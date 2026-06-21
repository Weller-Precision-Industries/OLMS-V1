import "dotenv/config";

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

import { TutorStore } from "./src/tutor/store";
import { evaluateAnswer, generateTeachingStep } from "./src/tutor/ai";

const port = Number(process.env.PORT || 8080);
const dbPath = process.env.OLMS_SQLITE_PATH || join(process.cwd(), "data", "olms-v1.sqlite");
const store = new TutorStore(dbPath);

function sendJson(res: ServerResponse, status: number, body: unknown) {
	const payload = JSON.stringify(body);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"content-length": Buffer.byteLength(payload)
	});
	res.end(payload);
}

function sendText(res: ServerResponse, status: number, body: string, contentType = "text/plain; charset=utf-8") {
	res.writeHead(status, {
		"content-type": contentType,
		"content-length": Buffer.byteLength(body)
	});
	res.end(body);
}

async function readJson(req: IncomingMessage): Promise<any> {
	const chunks: Buffer[] = [];
	for await (const chunk of req) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	}
	const text = Buffer.concat(chunks).toString("utf8").trim();
	return text ? JSON.parse(text) : {};
}

async function startSession(req: IncomingMessage, res: ServerResponse) {
	const body = await readJson(req);
	const topic = String(body.topic || "").trim();
	if (!topic) {
		sendJson(res, 400, { error: "topic is required" });
		return;
	}

	const session = store.createSession({
		id: randomUUID(),
		topic,
		status: "active"
	});

	const step = await generateTeachingStep({ topic, events: [] });
	store.addEvent({
		id: randomUUID(),
		sessionId: session.id,
		type: "teaching_step",
		payload: step
	});

	sendJson(res, 201, store.getSession(session.id));
}

async function answerSession(sessionId: string, req: IncomingMessage, res: ServerResponse) {
	const session = store.getSession(sessionId);
	if (!session) {
		sendJson(res, 404, { error: "session not found" });
		return;
	}

	const body = await readJson(req);
	const answer = String(body.answer || "").trim();
	if (!answer) {
		sendJson(res, 400, { error: "answer is required" });
		return;
	}

	const lastStep = store.getLastTeachingStep(sessionId);
	if (!lastStep) {
		sendJson(res, 409, { error: "session has no active teaching step" });
		return;
	}

	const feedback = await evaluateAnswer({
		topic: session.topic,
		question: lastStep.question,
		expectedAnswer: lastStep.expectedAnswer,
		answer
	});

	store.addEvent({
		id: randomUUID(),
		sessionId,
		type: "answer",
		payload: { answer, feedback }
	});

	if (feedback.nextAction === "finish") {
		store.updateStatus(sessionId, "complete");
		sendJson(res, 200, store.getSession(sessionId));
		return;
	}

	const nextStep = await generateTeachingStep({
		topic: session.topic,
		events: store.getEvents(sessionId)
	});

	store.addEvent({
		id: randomUUID(),
		sessionId,
		type: "teaching_step",
		payload: nextStep
	});

	sendJson(res, 200, store.getSession(sessionId));
}

async function route(req: IncomingMessage, res: ServerResponse) {
	const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

	try {
		if (req.method === "GET" && url.pathname === "/") {
			const html = readFileSync(join(process.cwd(), "src", "templates", "main.html"), "utf8");
			sendText(res, 200, html, "text/html; charset=utf-8");
			return;
		}

		if (req.method === "GET" && url.pathname === "/api/health") {
			sendJson(res, 200, {
				ok: true,
				mode: process.env.OLMS_MOCK_AI === "true" || !process.env.OPENAI_API_KEY ? "mock" : "openai",
				storage: "sqlite"
			});
			return;
		}

		if (req.method === "POST" && url.pathname === "/api/session/start") {
			await startSession(req, res);
			return;
		}

		const sessionMatch = url.pathname.match(/^\/api\/session\/([^/]+)$/);
		if (sessionMatch && req.method === "GET") {
			const session = store.getSession(sessionMatch[1]);
			sendJson(res, session ? 200 : 404, session || { error: "session not found" });
			return;
		}

		const answerMatch = url.pathname.match(/^\/api\/session\/([^/]+)\/answer$/);
		if (answerMatch && req.method === "POST") {
			await answerSession(answerMatch[1], req, res);
			return;
		}

		sendJson(res, 404, { error: "not found" });
	} catch (error) {
		const message = error instanceof Error ? error.message : "unknown error";
		sendJson(res, 500, { error: message });
	}
}

createServer(route).listen(port, () => {
	console.log(`OLMS-V1 running at http://localhost:${port}`);
	console.log(`SQLite database: ${dbPath}`);
});
