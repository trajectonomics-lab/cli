import { Database } from "bun:sqlite"
import { describe, expect, it } from "bun:test"
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import pkg from "../package.json"
import { run } from "./cli"
import { type ErrorCode, registry } from "./errors"

async function capture(argv: string[], env: Record<string, string | undefined> = {}) {
	const out: string[] = []
	const err: string[] = []
	const code = await run(argv, { out: (l) => out.push(l), err: (l) => err.push(l) }, env)
	return { code, out: out.join("\n"), err: err.join("\n") }
}

describe("usage and version", () => {
	it("prints usage with no arguments", async () => {
		const res = await capture([])
		expect(res.code).toBe(0)
		expect(res.out).toContain("Usage: traj")
	})

	it("prints usage for the help command and for --help", async () => {
		for (const argv of [["help"], ["--help"]]) {
			const res = await capture(argv)
			expect(res.code).toBe(0)
			expect(res.out).toContain("Usage: traj")
		}
	})

	it("prints the bare version for --version and the version command", async () => {
		for (const argv of [["--version"], ["version"]]) {
			const res = await capture(argv)
			expect(res.code).toBe(0)
			expect(res.out).toBe(pkg.version)
		}
	})
})

describe("errors", () => {
	it("rejects an unknown command as invalid input, in text on stderr", async () => {
		const res = await capture(["nope"])
		expect(res.code).toBe(2)
		expect(res.out).toBe("")
		expect(res.err).toContain("unknown_command")
		expect(res.err).toContain("Unknown command: nope")
	})
})

describe("strict parsing and format selection", () => {
	it("rejects an unknown flag with unknown_flag", async () => {
		const res = await capture(["--nope"])
		expect(res.code).toBe(2)
		expect(res.out).toBe("")
		expect(res.err).toContain("unknown_flag")
		expect(res.err).toContain("--nope")
	})

	it("answers a malformed command line in JSON when --json is present", async () => {
		const res = await capture(["--nope", "--json"])
		expect(res.code).toBe(2)
		expect(res.out).toBe("")
		const envelope = JSON.parse(res.err)
		expect(envelope.error.code).toBe("unknown_flag")
		expect(envelope.error.exitCode).toBe(2)
		expect(typeof envelope.error.message).toBe("string")
	})

	it("writes JSON errors to stderr only, for an unknown command", async () => {
		const res = await capture(["nope", "--json"])
		expect(res.out).toBe("")
		expect(JSON.parse(res.err).error.code).toBe("unknown_command")
	})

	it("selects JSON from TRAJ_FORMAT alone", async () => {
		const res = await capture(["nope"], { TRAJ_FORMAT: "json" })
		expect(JSON.parse(res.err).error.code).toBe("unknown_command")
	})

	it("lets --json win over TRAJ_FORMAT", async () => {
		const res = await capture(["nope", "--json"], { TRAJ_FORMAT: "human" })
		expect(JSON.parse(res.err).error.code).toBe("unknown_command")
	})

	it("reports an unknown TRAJ_FORMAT as text with exit 2", async () => {
		const res = await capture(["version"], { TRAJ_FORMAT: "yaml" })
		expect(res.code).toBe(2)
		expect(res.out).toBe("")
		expect(res.err).toContain("unknown_format")
		expect(res.err.startsWith("{")).toBe(false)
	})

	it("rejects extra positional arguments as invalid input", async () => {
		const res = await capture(["version", "extra", "--json"])
		expect(res.code).toBe(2)
		expect(JSON.parse(res.err).error.code).toBe("invalid_input")
	})

	it("prints JSON results to stdout in JSON mode", async () => {
		const res = await capture(["version", "--json"])
		expect(res.code).toBe(0)
		expect(JSON.parse(res.out)).toBe(pkg.version)
		expect(res.err).toBe("")
	})
})

describe("schema", () => {
	it("lists the commands and the whole registry sorted by code", async () => {
		const res = await capture(["schema", "--json"])
		expect(res.code).toBe(0)
		const data = JSON.parse(res.out)
		const names = data.commands.map((c: { name: string }) => c.name)
		expect(names).toEqual(["help", "init", "schema", "version"])
		const codes = data.errors.map((e: { code: string }) => e.code)
		expect(codes).toEqual([...codes].sort())
		expect(codes).toEqual(Object.keys(registry).sort())
		for (const entry of data.errors) {
			expect(entry.exitCode).toBe(registry[entry.code as ErrorCode].exit)
		}
	})

	it("describes one command: input, output, examples and error codes by reference", async () => {
		const res = await capture(["schema", "init", "--json"])
		expect(res.code).toBe(0)
		const data = JSON.parse(res.out)
		expect(data.name).toBe("init")
		expect(data.input.type).toBe("object")
		expect(data.output.properties.created.type).toBe("boolean")
		expect(data.examples.length).toBeGreaterThan(0)
		for (const code of data.errorCodes) expect(registry).toHaveProperty(code)
	})

	it("every command's listed error codes exist in the registry", async () => {
		for (const name of ["help", "init", "schema", "version"]) {
			const data = JSON.parse((await capture(["schema", name, "--json"])).out)
			for (const code of data.errorCodes) expect(registry).toHaveProperty(code)
		}
	})

	it("rejects an unknown command name with unknown_command", async () => {
		const res = await capture(["schema", "nope", "--json"])
		expect(res.code).toBe(2)
		expect(JSON.parse(res.err).error.code).toBe("unknown_command")
	})

	it("renders the listing as readable text by default", async () => {
		const res = await capture(["schema"])
		expect(res.code).toBe(0)
		expect(res.out).toContain("unknown_command")
	})
})

describe("init", () => {
	function tempHome() {
		return join(mkdtempSync(join(tmpdir(), "traj-test-")), "home")
	}

	it("creates the data directory and a WAL database with no tables", async () => {
		const home = tempHome()
		const res = await capture(["init", "--json"], { TRAJ_HOME: home })
		expect(res.code).toBe(0)
		expect(JSON.parse(res.out)).toEqual({
			directory: home,
			database: join(home, "traj.db"),
			created: true,
		})
		const db = new Database(join(home, "traj.db"), { readonly: true })
		expect(db.query("PRAGMA journal_mode").get()).toEqual({ journal_mode: "wal" })
		expect(db.query("PRAGMA user_version").get()).toEqual({ user_version: 0 })
		expect(db.query("SELECT name FROM sqlite_master").all()).toEqual([])
		db.close()
	})

	it("is idempotent: the second run exits 0 and changes nothing", async () => {
		const home = tempHome()
		await capture(["init"], { TRAJ_HOME: home })
		const before = readFileSync(join(home, "traj.db"))
		const listing = readdirSync(home)
		const res = await capture(["init", "--json"], { TRAJ_HOME: home })
		expect(res.code).toBe(0)
		expect(JSON.parse(res.out).created).toBe(false)
		expect(readFileSync(join(home, "traj.db")).equals(before)).toBe(true)
		expect(readdirSync(home)).toEqual(listing)
	})

	it("reports an unexpected failure as the fixed internal envelope", async () => {
		const file = join(mkdtempSync(join(tmpdir(), "traj-test-")), "afile")
		writeFileSync(file, "")
		const res = await capture(["init", "--json"], { TRAJ_HOME: file })
		expect(res.code).toBe(1)
		expect(res.out).toBe("")
		expect(JSON.parse(res.err)).toEqual({
			error: { code: "internal", exitCode: 1, message: registry.internal.message },
		})
		expect(res.err).not.toContain(file)
		expect(res.err).not.toContain("at ")
	})
})

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
