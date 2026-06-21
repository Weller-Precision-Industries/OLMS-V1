import type { TeachingStep, TutorEvent } from "./store";

type GenerateInput = {
	topic: string;
	events: TutorEvent[];
};

type EvaluateInput = {
	topic: string;
	question: string;
	expectedAnswer: string;
	answer: string;
};

type Feedback = {
	score: number;
	feedback: string;
	nextAction: "continue" | "review" | "finish";
};

const useMock = () => process.env.OLMS_MOCK_AI === "true" || !process.env.OPENAI_API_KEY;

export async function generateTeachingStep(input: GenerateInput): Promise<TeachingStep> {
	if (useMock()) {
		return mockTeachingStep(input);
	}

	const recent = input.events.slice(-6).map((event) => ({
		type: event.type,
		payload: event.payload
	}));

	const result = await callOpenAI({
		system:
			"You are a concise tutor. Create one small learning step for the learner's chosen topic. Return only JSON.",
		user: JSON.stringify({
			topic: input.topic,
			recent,
			format: {
				title: "short title",
				explanation: "120 words or fewer",
				question: "one check question",
				expectedAnswer: "what a good answer should contain"
			}
		})
	});

	return normalizeTeachingStep(result, input.topic);
}

export async function evaluateAnswer(input: EvaluateInput): Promise<Feedback> {
	if (useMock()) {
		return mockFeedback(input);
	}

	const result = await callOpenAI({
		system:
			"You are a fair tutor. Grade the learner answer against the expected answer. Return only JSON.",
		user: JSON.stringify({
			topic: input.topic,
			question: input.question,
			expectedAnswer: input.expectedAnswer,
			answer: input.answer,
			format: {
				score: "number from 0 to 1",
				feedback: "brief useful feedback",
				nextAction: "continue, review, or finish"
			}
		})
	});

	const score = clampNumber(result.score, 0, 1, 0.5);
	const nextAction =
		result.nextAction === "finish" || result.nextAction === "review" ? result.nextAction : "continue";
	return {
		score,
		feedback: typeof result.feedback === "string" ? result.feedback : "Keep going.",
		nextAction
	};
}

async function callOpenAI(input: { system: string; user: string }): Promise<any> {
	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			authorization: `Bearer ${process.env.OPENAI_API_KEY}`
		},
		body: JSON.stringify({
			model: process.env.OPENAI_MODEL || "gpt-4o-mini",
			temperature: 0.4,
			response_format: { type: "json_object" },
			messages: [
				{ role: "system", content: input.system },
				{ role: "user", content: input.user }
			]
		})
	});

	if (!response.ok) {
		throw new Error(`OpenAI request failed with ${response.status}`);
	}

	const data = await response.json() as any;
	const content = data.choices?.[0]?.message?.content;
	if (!content) {
		throw new Error("OpenAI response did not include message content");
	}
	return JSON.parse(content);
}

function normalizeTeachingStep(result: any, topic: string): TeachingStep {
	return {
		title: stringOr(result.title, `Learning ${topic}`),
		explanation: stringOr(result.explanation, `Here is a focused step about ${topic}.`),
		question: stringOr(result.question, `What is one important idea from ${topic}?`),
		expectedAnswer: stringOr(result.expectedAnswer, `A good answer explains a central idea from ${topic}.`)
	};
}

function mockTeachingStep(input: GenerateInput): TeachingStep {
	const stepNumber = input.events.filter((event) => event.type === "teaching_step").length + 1;
	return {
		title: `${input.topic}: step ${stepNumber}`,
		explanation:
			`This mock step introduces ${input.topic} in a small slice. Focus on one definition, one example, and one reason the idea matters before moving on.`,
		question: `In your own words, what is one useful idea about ${input.topic}?`,
		expectedAnswer: `The learner should name a relevant idea about ${input.topic} and explain it briefly.`
	};
}

function mockFeedback(input: EvaluateInput): Feedback {
	const wordCount = input.answer.split(/\s+/).filter(Boolean).length;
	if (wordCount >= 18) {
		return {
			score: 0.85,
			feedback: "Solid answer. You gave enough detail to move forward.",
			nextAction: "continue"
		};
	}
	return {
		score: 0.45,
		feedback: `Add one concrete detail. A good answer should connect back to: ${input.expectedAnswer}`,
		nextAction: "review"
	};
}

function stringOr(value: unknown, fallback: string): string {
	return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
	if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
	return Math.min(max, Math.max(min, value));
}
