import { z } from "zod"
import pkg from "../../package.json"
import type { Leaf } from "../command"
import { defineCommand, ok } from "../command"

export const version: Leaf = defineCommand({
	name: "version",
	summary: "Print the CLI version",
	positionals: [],
	input: z.strictObject({}),
	output: z.string().describe("The bare version string."),
	examples: [{ command: "traj version", description: "Print the version." }],
	errorCodes: [],
	run: () => ok(pkg.version),
})
