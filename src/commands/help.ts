import { z } from "zod"
import type { Leaf } from "../command"
import { defineCommand, ok } from "../command"
import { fail } from "../errors"
import { findNode, HELP_HINT } from "../tree"
import { usageOf } from "../usage"

export const help: Leaf = defineCommand({
	name: "help",
	summary: "Show usage for traj or for one command",
	positionals: ["path"],
	input: z.strictObject({
		path: z.array(z.string()).default([]).describe("A command path such as `tx add`."),
	}),
	output: z.string().describe("The usage text."),
	examples: [
		{ command: "traj help", description: "List the commands." },
		{ command: "traj help schema", description: "Show how `schema` is used." },
	],
	errorCodes: ["unknown_command"],
	run: (input, ctx) => {
		const node = findNode(ctx.root, input.path)
		if (!node) {
			const message = `Unknown command: ${input.path.join(" ")}`
			return fail("unknown_command", { message, hint: HELP_HINT })
		}
		return ok(usageOf(node, input.path))
	},
})
