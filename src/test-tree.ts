import { z } from "zod"
import type { Group } from "./command"
import { defineCommand, defineGroup, ok } from "./command"
import { root } from "./commands"

const echo = defineCommand({
	name: "echo",
	summary: "Echo a word back",
	positionals: ["word"],
	input: z.strictObject({
		word: z.string().describe("The word to echo."),
		upper: z.boolean().optional().describe("Shout it."),
		times: z.number().int().optional().describe("How many times."),
		tag: z.array(z.string()).optional().describe("A label."),
		fromDate: z.string().optional(),
	}),
	output: z.strictObject({
		text: z.string(),
		times: z.number(),
		tags: z.array(z.string()),
		from: z.string(),
	}),
	examples: [{ command: "traj demo echo hi --upper", description: "Shout hi." }],
	errorCodes: [],
	run: (input) =>
		ok({
			text: input.upper ? input.word.toUpperCase() : input.word,
			times: input.times ?? 1,
			tags: input.tag ?? [],
			from: input.fromDate ?? "none",
		}),
})

const demo = defineGroup({ name: "demo", summary: "A fixture group", children: [echo] })

/** The real command tree plus a `demo` group, for tests that need nesting and flags. */
export const fixtureRoot: Group = defineGroup({
	name: "traj",
	summary: "trajectonomics command line",
	children: [...root.children, demo],
})
