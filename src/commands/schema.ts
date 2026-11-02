import { z } from "zod"
import type { AnyCommand } from "../command"
import { defineCommand, ok, sortedByName } from "../command"
import { type ErrorCode, fail, registry } from "../errors"

const jsonSchema = z.record(z.string(), z.unknown())

const listing = z.strictObject({
	commands: z.array(z.strictObject({ name: z.string(), summary: z.string() })),
	errors: z.array(
		z.strictObject({
			code: z.string(),
			exitCode: z.number().int().min(0).max(5),
			message: z.string(),
		}),
	),
})

const detail = z.strictObject({
	name: z.string(),
	summary: z.string(),
	input: jsonSchema.describe("JSON Schema of the command's input."),
	output: jsonSchema.describe("JSON Schema of the command's result."),
	examples: z.array(z.strictObject({ command: z.string(), description: z.string() })),
	errorCodes: z.array(z.string()).describe("Registry codes this command raises."),
})

export const schema: AnyCommand = defineCommand({
	name: "schema",
	summary: "Describe the commands and the error registry",
	positionals: ["command"],
	input: z.strictObject({
		command: z.string().optional().describe("A command name; omit to list everything."),
	}),
	output: z.union([listing, detail]),
	examples: [
		{ command: "traj schema", description: "List commands and every error code." },
		{ command: "traj schema init --json", description: "Show the input and output of init." },
	],
	errorCodes: ["unknown_command"],
	run: (input, ctx) => {
		const commands = sortedByName(ctx.commands)
		if (input.command === undefined) {
			const codes = (Object.keys(registry) as ErrorCode[]).sort()
			return ok({
				commands: commands.map(({ name, summary }) => ({ name, summary })),
				errors: codes.map((code) => ({
					code,
					exitCode: registry[code].exit,
					message: registry[code].message,
				})),
			})
		}
		const command = commands.find((candidate) => candidate.name === input.command)
		if (!command) {
			return fail("unknown_command", {
				message: `Unknown command: ${input.command}`,
				hint: 'Run "traj schema" to list commands.',
			})
		}
		return ok({
			name: command.name,
			summary: command.summary,
			input: z.toJSONSchema(command.input, { io: "input" }),
			output: z.toJSONSchema(command.output, { io: "output" }),
			examples: command.examples.map((example) => ({ ...example })),
			errorCodes: [...command.errorCodes].sort(),
		})
	},
})
