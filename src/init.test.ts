import { Database } from "bun:sqlite"
import { describe, expect, it } from "bun:test"
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { registry } from "./errors"
import { capture } from "./test-support"

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
