import {
  type IScaffoldSyncPlan,
  type IScaffoldSyncProps,
  SCAFFOLD_SYNC_STATE_FILE,
  planScaffoldSync,
  publishFiles,
  renderScaffold,
  syncScaffold,
  writeFiles,
} from "@automovie/template";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Explicit sync updates generated instructions without overwriting authored work.
 *
 * Scenarios:
 * 1. A recorded older router updates, check is read-only, and a second sync is unchanged.
 * 2. Local edits stop the complete update, including restoration of a missing instruction.
 * 3. A declared legacy baseline permits that exact prior edition; malformed state refuses.
 * 4. Retired generated instructions are reported and retained, including their baseline.
 * 5. Linked instruction parents refuse and stale publication generations cannot truncate a later edit.
 *
 * @evidence contracts/testing.md#behavioral-verification Creates actual project files, runs public sync/check and conditional publication, and inspects resulting text and retained files. Local edits, absent files, legacy inputs, invalid state and a junction exercise refusal before writes.
 * @evidence contracts/testing.md#independent-expectations Literal old/local text and an independent SHA-256 seed establish the prior edition; current render bytes are sync inputs rather than approval. Project-owned sentinels must remain exact, and a stale inspected generation must never overwrite later bytes.
 * @evidence contracts/testing.md#distinguishing-cases Covers update, no-op, dry-run, full-plan conflict, missing generated input, explicit versus absent legacy baseline, invalid state, retained retired instructions, linked parent and stale generation. Existing publication tests retain partial writes, hard links, native handles and platform error cases.
 * @evidence contracts/testing.md#execution-ownership Runs filesystem semantics in-process through public APIs with owned temporary roots, no installed consumer or child host. The junction is verified and removed before recursive fixture cleanup, preserving its target until ordinary owned-root cleanup.
 */
export function test_template_scaffold_sync(): void {
  const root: string = fs.realpathSync.native(
    fs.mkdtempSync(path.join(os.tmpdir(), "automovie-sync-")),
  );
  const baseline: string = fs.realpathSync.native(
    fs.mkdtempSync(path.join(os.tmpdir(), "automovie-sync-base-")),
  );
  const linked: string = path.join(root, ".agents/skills/motion");
  const saved: string = path.join(root, ".agents/skills/saved-motion");
  let junction: boolean = false;
  try {
    const files: Record<string, string> = renderScaffold({ name: "sync-case" });
    const expectedRouter: string = files["AGENTS.md"];
    const state: { version: number; files: Record<string, string> } =
      JSON.parse(files[SCAFFOLD_SYNC_STATE_FILE]);
    files["AGENTS.md"] = "Previous generated router.\n";
    state.files["AGENTS.md"] = createHash("sha256")
      .update(files["AGENTS.md"])
      .digest("hex");
    files[SCAFFOLD_SYNC_STATE_FILE] = JSON.stringify(state, null, 2) + "\n";
    writeFiles(root, files);
    const sentinels: Record<string, string> = {
      "PROJECT.md": "The adopted output remains a screenplay.\n",
      "README.md": "Actual local execution commands.\n",
      "evidence.config.ts": "export default { claims: [] };\n",
      ".agents/skills/contracts/story/work/local.md":
        "Authored work contract.\n",
      ".agents/skills/custom/SKILL.md": "An independent local skill.\n",
      "docs/body/screenplay/local.md": "A preserved screenplay.\n",
    };
    writeFiles(root, sentinels, { force: true });
    const props: IScaffoldSyncProps = { location: root, name: "sync-case" };
    const initial: IScaffoldSyncPlan = planScaffoldSync(props);
    const before: string = fs.readFileSync(
      path.join(root, SCAFFOLD_SYNC_STATE_FILE),
      "utf8",
    );
    assert.deepEqual(initial.changed, ["AGENTS.md"]);
    assert.equal(syncScaffold({ ...props, check: true }).status, "planned");
    assert.equal(
      fs.readFileSync(path.join(root, "AGENTS.md"), "utf8"),
      files["AGENTS.md"],
    );
    assert.equal(
      fs.readFileSync(path.join(root, SCAFFOLD_SYNC_STATE_FILE), "utf8"),
      before,
    );
    assert.equal(syncScaffold(props).status, "completed");
    assert.equal(
      fs.readFileSync(path.join(root, "AGENTS.md"), "utf8"),
      expectedRouter,
    );
    for (const [relative, text] of Object.entries(sentinels))
      assert.equal(fs.readFileSync(path.join(root, relative), "utf8"), text);
    assert.equal(syncScaffold(props).status, "unchanged");

    const retired: string = ".agents/skills/retired/SKILL.md";
    const retiredText: string = "An adopted instruction no longer shipped.\n";
    writeFiles(root, { [retired]: retiredText }, { force: true });
    const retiredState: { version: number; files: Record<string, string> } =
      JSON.parse(
        fs.readFileSync(path.join(root, SCAFFOLD_SYNC_STATE_FILE), "utf8"),
      );
    retiredState.files[retired] = createHash("sha256")
      .update(retiredText)
      .digest("hex");
    fs.writeFileSync(
      path.join(root, SCAFFOLD_SYNC_STATE_FILE),
      JSON.stringify(retiredState, null, 2) + "\n",
    );
    const retained: ReturnType<typeof syncScaffold> = syncScaffold(props);
    assert.deepEqual(retained.plan.retired, [retired]);
    assert.equal(
      fs.readFileSync(path.join(root, retired), "utf8"),
      retiredText,
    );
    assert.equal(
      JSON.parse(
        fs.readFileSync(path.join(root, SCAFFOLD_SYNC_STATE_FILE), "utf8"),
      ).files[retired],
      retiredState.files[retired],
    );

    const stale: ReturnType<typeof publishFiles> = publishFiles(
      root,
      { "AGENTS.md": "A stale writer must not reach this text.\n" },
      { force: true, expected: initial.expected },
    );
    assert.equal(stale.status, "refused");
    assert.equal(
      fs.readFileSync(path.join(root, "AGENTS.md"), "utf8"),
      expectedRouter,
    );

    const missing: string = ".agents/skills/motion/physics.md";
    fs.unlinkSync(path.join(root, missing));
    fs.writeFileSync(path.join(root, "AGENTS.md"), "Local author choice.\n");
    const conflict: ReturnType<typeof syncScaffold> = syncScaffold(props);
    assert.equal(conflict.status, "conflicted");
    assert.ok(conflict.plan.conflicts.includes("AGENTS.md"));
    assert.equal(fs.existsSync(path.join(root, missing)), false);
    assert.equal(
      fs.readFileSync(path.join(root, "AGENTS.md"), "utf8"),
      "Local author choice.\n",
    );

    fs.unlinkSync(path.join(root, SCAFFOLD_SYNC_STATE_FILE));
    assert.equal(syncScaffold(props).status, "conflicted");
    fs.writeFileSync(
      path.join(baseline, "AGENTS.md"),
      "Local author choice.\n",
    );
    assert.equal(syncScaffold({ ...props, baseline }).status, "completed");
    assert.equal(
      fs.readFileSync(path.join(baseline, "AGENTS.md"), "utf8"),
      "Local author choice.\n",
    );
    assert.equal(
      fs.readFileSync(path.join(root, missing), "utf8"),
      files[missing],
    );

    const validState: string = fs.readFileSync(
      path.join(root, SCAFFOLD_SYNC_STATE_FILE),
      "utf8",
    );
    fs.writeFileSync(
      path.join(root, SCAFFOLD_SYNC_STATE_FILE),
      '{"version":1,"files":{"../README.md":"invalid"}}',
    );
    assert.throws((): unknown => syncScaffold(props), /invalid.*baseline/i);
    assert.equal(
      fs.readFileSync(path.join(root, "AGENTS.md"), "utf8"),
      expectedRouter,
    );
    fs.writeFileSync(path.join(root, SCAFFOLD_SYNC_STATE_FILE), validState);

    fs.renameSync(linked, saved);
    fs.symlinkSync(
      baseline,
      linked,
      process.platform === "win32" ? "junction" : "dir",
    );
    junction = true;
    assert.throws(
      (): unknown => syncScaffold(props),
      /ordinary directory|link/i,
    );
    assert.equal(
      fs.readFileSync(path.join(baseline, "AGENTS.md"), "utf8"),
      "Local author choice.\n",
    );
  } finally {
    if (junction) {
      assert.equal(fs.lstatSync(linked).isSymbolicLink(), true);
      assert.equal(fs.realpathSync.native(linked), baseline);
      fs.unlinkSync(linked);
    }
    fs.rmSync(root, { recursive: true });
    fs.rmSync(baseline, { recursive: true });
  }
}
