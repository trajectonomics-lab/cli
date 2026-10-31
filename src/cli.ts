import { parseArgs } from "node:util"
import pkg from "../package.json"

export interface Io {
	out: (line: string) => void
	err: (line: string) => void
}

/** One entry in the command table. `run` returns the exit code. */
type Command = {
	summary: string
	run: (args: string[], io: Io) => number | Promise<number>
}

const version: Command = {
	summary: "Print the CLI version",
	run: (_args, io) => {
		io.out(pkg.version)
		return 0
	},
}

// Add a command here: one entry, one file under src/commands/ when it grows.
const commands: Record<string, Command> = { version }

function usage(): string {
	const width = Math.max(...Object.keys(commands).map((name) => name.length))
	const lines = Object.entries(commands).map(
		([name, command]) => `  ${name.padEnd(width)}  ${command.summary}`,
	)
	return ["Usage: trajectonomics <command> [options]", "", "Commands:", ...lines].join("\n")
}

// strict: false means unknown flags are accepted and ignored instead of throwing.
function parseFlags(argv: string[]) {
	return parseArgs({
		args: argv,
		options: {
			help: { type: "boolean", short: "h" },
			version: { type: "boolean", short: "v" },
		},
		allowPositionals: true,
		strict: false,
	})
}

/** Runs the CLI and returns the exit code. Never calls process.exit, so tests can drive it. */
export async function run(argv: string[], io: Io): Promise<number> {
	const { values, positionals } = parseFlags(argv)

	// --version and --help are checked before any command name is looked up.
	if (values.version) return version.run([], io)
	const [commandName, ...commandArgs] = positionals
	if (!commandName || values.help) {
		io.out(usage())
		return 0
	}

	const command = commands[commandName]
	if (!command) {
		io.err(`Unknown command: ${commandName}\n\n${usage()}`)
		return 1
	}
	return command.run(commandArgs, io)
}
