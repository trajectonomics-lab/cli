import { describe, expect, it } from "bun:test"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { type ErrorCode, registry } from "./errors"
import { capture } from "./test-support"

describe("contract", () => {
	// Typed over ErrorCode: registering a new code fails to compile until a trigger is added here.
	const triggers: Record<ErrorCode, () => Promise<{ code: number; err: string }>> = {
		internal: () => {
			const file = join(mkdtempSync(join(tmpdir(), "traj-test-")), "afile")
			writeFileSync(file, "")
			return capture(["init", "--json"], { TRAJ_HOME: file })
		},
		invalid_input: () => capture(["version", "extra", "--json"]),
		unknown_command: () => capture(["nope", "--json"]),
		unknown_flag: () => capture(["--nope", "--json"]),
		// An unknown format is reported in text by design, so read the code from the text.
		unknown_format: () => capture(["version"], { TRAJ_FORMAT: "yaml" }),
	}

	it("makes every envelope's exitCode equal the value run() returns", async () => {
		for (const code of Object.keys(registry) as ErrorCode[]) {
			const res = await triggers[code]()
			expect(res.code).toBe(registry[code].exit)
			if (code === "unknown_format") {
				expect(res.err).toContain(code)
				continue
			}
			const { error } = JSON.parse(res.err)
			expect(error.code).toBe(code)
			expect(error.exitCode).toBe(res.code)
		}
	})

	it("gives byte-identical output for identical arguments", async () => {
		for (const argv of [["schema"], ["schema", "init", "--json"], ["help"], ["nope", "--json"]]) {
			const first = await capture(argv)
			const second = await capture(argv)
			expect(second).toEqual(first)
		}
	})

	it("adds a diagnostic to stderr only when TRAJ_DEBUG=1 asks for it", async () => {
		const file = join(mkdtempSync(join(tmpdir(), "traj-test-")), "afile")
		writeFileSync(file, "")
		const quiet = await capture(["init", "--json"], { TRAJ_HOME: file })
		const loud = await capture(["init", "--json"], { TRAJ_HOME: file, TRAJ_DEBUG: "1" })
		expect(quiet.err.split("\n")).toHaveLength(1)
		expect(loud.err.split("\n").length).toBeGreaterThan(1)
		expect(loud.err.split("\n").at(-1)).toBe(quiet.err)
	})
})
