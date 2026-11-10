import {
  SCAFFOLD_SYNC_STATE_FILE,
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
 * An explicit sync baseline governs the files it supplies over the stored scaffold-state digests, which still govern every file the baseline lacks.
 *
 * Scenarios:
 * 1. Without a baseline, a router that is a verbatim older edition differing from its recorded digest conflicts, while a file matching its recorded digest plans an update.
 * 2. A baseline whose copy of that recorded-matching file differs conflicts on it, because the declared base replaces the record, and writes nothing.
 * 3. A baseline holding the router's exact older edition resolves its conflict; the file the baseline lacks updates through its record, project content and the baseline stay untouched, and the next plain sync is unchanged.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Writes a real production, runs public syncScaffold with and without explicit baselines, and reads back instruction, project, baseline and state bytes; reverting the precedence makes scenario 3 conflict on the router and scenario 2 pass silently.
 * @evidence contracts/development/testing.md#independent-expectations Literal edition texts and independent SHA-256 digests seed the stored record; expected instruction bytes are the rendered bundle the sync must install, and the next state digest is recomputed from those bytes.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates record-only governance, a baseline overriding a matching record into a conflict, a baseline overriding a mismatching record into an update, and record fallback for a file absent from the baseline.
 * @evidence contracts/development/testing.md#execution-ownership Runs in-process through the public template API over owned temporary roots that the finally block removes; no child process or installed consumer is involved.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the precedence under test and lists each scenario with the property it pins.
 */
export function test_template_scaffold_sync_baseline_precedence(): void {
  const root: string = fs.realpathSync.native(
    fs.mkdtempSync(path.join(os.tmpdir(), "automovie-sync-precedence-")),
  );
  const baseline: string = fs.realpathSync.native(
    fs.mkdtempSync(path.join(os.tmpdir(), "automovie-sync-precedence-base-")),
  );
  try {
    const router: string = "AGENTS.md";
    const physics: string = ".agents/skills/motion/physical-feedback.md";
    const files: Record<string, string> = renderScaffold({
      name: "precedence-case",
    });
    const expected: Record<string, string> = { ...files };
    const sha: (text: string) => string = (text: string): string =>
      createHash("sha256").update(text).digest("hex");

    // The router is a verbatim older edition the record never saw; physics matches its record.
    const olderRouter: string = "Older adopted router edition.\n";
    const recordedPhysics: string = "Recorded physics edition.\n";
    const state: { version: number; files: Record<string, string> } =
      JSON.parse(files[SCAFFOLD_SYNC_STATE_FILE]);
    files[router] = olderRouter;
    state.files[router] = sha("Recorded router edition.\n");
    files[physics] = recordedPhysics;
    state.files[physics] = sha(recordedPhysics);
    files[SCAFFOLD_SYNC_STATE_FILE] = JSON.stringify(state, null, 2) + "\n";
    writeFiles(root, files);
    const project: string = "A preserved screenplay.\n";
    writeFiles(
      root,
      { "docs/body/screenplay/local.md": project },
      { force: true },
    );
    const recordedState: string = fs.readFileSync(
      path.join(root, SCAFFOLD_SYNC_STATE_FILE),
      "utf8",
    );

    // Scenario 1: the record alone governs.
    const recorded: ReturnType<typeof syncScaffold> = syncScaffold({
      location: root,
    });
    assert.equal(recorded.status, "conflicted");
    assert.deepEqual(recorded.plan.conflicts, [router]);
    assert.ok(recorded.plan.changed.includes(physics));

    // Scenario 2: the declared base replaces a matching record and conflicts.
    writeFiles(baseline, {
      [router]: olderRouter,
      [physics]: "Another physics edition.\n",
    });
    const overridden: ReturnType<typeof syncScaffold> = syncScaffold({
      location: root,
      baseline,
    });
    assert.equal(overridden.status, "conflicted");
    assert.deepEqual(overridden.plan.conflicts, [physics]);
    assert.equal(fs.readFileSync(path.join(root, router), "utf8"), olderRouter);
    assert.equal(
      fs.readFileSync(path.join(root, SCAFFOLD_SYNC_STATE_FILE), "utf8"),
      recordedState,
    );

    // Scenario 3: the exact older edition resolves the router; physics falls back to its record.
    fs.unlinkSync(path.join(baseline, physics));
    const adopted: ReturnType<typeof syncScaffold> = syncScaffold({
      location: root,
      baseline,
    });
    assert.equal(adopted.status, "completed");
    assert.deepEqual(adopted.plan.conflicts, []);
    assert.equal(
      fs.readFileSync(path.join(root, router), "utf8"),
      expected[router],
    );
    assert.equal(
      fs.readFileSync(path.join(root, physics), "utf8"),
      expected[physics],
    );
    assert.equal(
      fs.readFileSync(path.join(root, "docs/body/screenplay/local.md"), "utf8"),
      project,
    );
    assert.equal(
      fs.readFileSync(path.join(baseline, router), "utf8"),
      olderRouter,
    );
    assert.equal(
      JSON.parse(
        fs.readFileSync(path.join(root, SCAFFOLD_SYNC_STATE_FILE), "utf8"),
      ).files[router],
      sha(expected[router].replaceAll("\r\n", "\n")),
    );
    assert.equal(syncScaffold({ location: root }).status, "unchanged");
  } finally {
    fs.rmSync(root, { recursive: true });
    fs.rmSync(baseline, { recursive: true });
  }
}
