import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type SessionStatus = "active" | "complete";

export type TutorSession = {
	id: string;
	topic: string;
	status: SessionStatus;
	createdAt: string;
	updatedAt: string;
};

export type TutorEvent = {
	id: string;
	sessionId: string;
	type: "teaching_step" | "answer";
	payload: any;
	createdAt: string;
};

export type TeachingStep = {
	title: string;
	explanation: string;
	question: string;
	expectedAnswer: string;
};

export class TutorStore {
	private db: Database.Database;

	constructor(path: string) {
		mkdirSync(dirname(path), { recursive: true });
		this.db = new Database(path);
		this.db.pragma("journal_mode = WAL");
		this.db.pragma("foreign_keys = ON");
		this.init();
	}

	createSession(input: { id: string; topic: string; status: SessionStatus }): TutorSession {
		const now = new Date().toISOString();
		this.db
			.prepare(
				"INSERT INTO sessions (id, topic, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
			)
			.run(input.id, input.topic, input.status, now, now);
		return this.getSession(input.id)!;
	}

	getSession(id: string): (TutorSession & { events: TutorEvent[] }) | null {
		const row = this.db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as any;
		if (!row) return null;
		return {
			id: row.id,
			topic: row.topic,
			status: row.status,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
			events: this.getEvents(id)
		};
	}

	getEvents(sessionId: string): TutorEvent[] {
		const rows = this.db
			.prepare("SELECT * FROM events WHERE session_id = ? ORDER BY created_at ASC")
			.all(sessionId) as any[];
		return rows.map((row) => ({
			id: row.id,
			sessionId: row.session_id,
			type: row.type,
			payload: JSON.parse(row.payload_json),
			createdAt: row.created_at
		}));
	}

	getLastTeachingStep(sessionId: string): TeachingStep | null {
		const row = this.db
			.prepare(
				"SELECT payload_json FROM events WHERE session_id = ? AND type = 'teaching_step' ORDER BY created_at DESC LIMIT 1"
			)
			.get(sessionId) as any;
		return row ? JSON.parse(row.payload_json) : null;
	}

	addEvent(input: { id: string; sessionId: string; type: TutorEvent["type"]; payload: any }) {
		const now = new Date().toISOString();
		this.db
			.prepare(
				"INSERT INTO events (id, session_id, type, payload_json, created_at) VALUES (?, ?, ?, ?, ?)"
			)
			.run(input.id, input.sessionId, input.type, JSON.stringify(input.payload), now);
		this.db.prepare("UPDATE sessions SET updated_at = ? WHERE id = ?").run(now, input.sessionId);
	}

	updateStatus(sessionId: string, status: SessionStatus) {
		this.db
			.prepare("UPDATE sessions SET status = ?, updated_at = ? WHERE id = ?")
			.run(status, new Date().toISOString(), sessionId);
	}

	private init() {
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS sessions (
				id TEXT PRIMARY KEY,
				topic TEXT NOT NULL,
				status TEXT NOT NULL,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS events (
				id TEXT PRIMARY KEY,
				session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
				type TEXT NOT NULL,
				payload_json TEXT NOT NULL,
				created_at TEXT NOT NULL
			);

			CREATE INDEX IF NOT EXISTS idx_events_session_created
				ON events(session_id, created_at);
		`);
	}
}
