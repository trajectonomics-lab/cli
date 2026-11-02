import { z } from "zod"
import type { AnyCommand } from "../command"
import { defineCommand, ok } from "../command"

export const help: AnyCommand = defineCommand({
	name: "help",
	summary: "Show usage",
	positionals: [],
	input: z.strictObject({}),
	output: z.string().describe("The usage text."),
	examples: [{ command: "traj help", description: "Show usage." }],
	errorCodes: [],
	run: (_input, ctx) => {
		const sorted = [...ctx.commands].sort((a, b) => (a.name < b.name ? -1 : 1))
		const width = Math.max(...sorted.map((command) => command.name.length))
		const lines = sorted.map((command) => `  ${command.name.padEnd(width)}  ${command.summary}`)
		return ok(
			[
				"Usage: traj <command> [options]",
				"",
				"Commands:",
				...lines,
				"",
				"Options:",
				"  --json         Print JSON; errors become a JSON envelope on stderr",
				"  -h, --help     Show usage",
				"  -v, --version  Print the version",
				"",
				"Environment:",
				"  TRAJ_FORMAT    human (default) or json; --json takes precedence",
				"  TRAJ_HOME      Data directory (default ~/.traj)",
				"  TRAJ_DEBUG     Set to 1 to print diagnostics for unexpected errors",
			].join("\n"),
		)
	},
})
