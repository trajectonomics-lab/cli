import { Database } from "bun:sqlite"
import { existsSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { z } from "zod"
import type { AnyCommand, Env } from "../command"
import { defineCommand, ok } from "../command"

/** `TRAJ_HOME` if set, otherwise `~/.traj`, resolved through `os.homedir()` on every platform. */
export function dataDirectory(env: Env): string {
	const override = env["TRAJ_HOME"]
	return override ? override : join(homedir(), ".traj")
}

export const init: AnyCommand = defineCommand({
	name: "init",
	summary: "Create the data directory and an empty database",
	positionals: [],
	input: z.strictObject({}),
	output: z.strictObject({
		directory: z.string().describe("The data directory."),
		database: z.string().describe("The path of traj.db."),
		created: z.boolean().describe("True when this run created the database."),
	}),
	examples: [
		{ command: "traj init", description: "Create ~/.traj/traj.db if it does not exist." },
		{ command: "TRAJ_HOME=/tmp/traj traj init --json", description: "Use another directory." },
	],
	errorCodes: [],
	run: (_input, ctx) => {
		const directory = dataDirectory(ctx.env)
		const database = join(directory, "traj.db")
		const created = !existsSync(database)
		mkdirSync(directory, { recursive: true })
		if (created) {
			// No tables yet: the schema belongs to a later change. `user_version` stays 0.
			const db = new Database(database, { create: true })
			db.run("PRAGMA journal_mode = WAL")
			db.close()
		}
		return ok({ directory, database, created })
	},
})
