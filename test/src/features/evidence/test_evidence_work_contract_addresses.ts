import assert from "node:assert/strict";

import { createPackageChecklistClaim } from "../../../../packages/evidence/src/narrative/internal/createPackageChecklistClaim";
import { createPackagePopulationContract } from "../../../../packages/evidence/src/narrative/internal/createPackagePopulationContract";

/**
 * Admits exact work contracts to the factory that owns their answer.
 *
 * Scenarios:
 *
 * 1. A nested principle or obligation with Windows separators is canonical.
 * 2. Both factories reject paths with empty, relative or wildcard segments.
 * 3. The checklist keeps naturalness, rejects duplicate paths and reserves duties.
 * 4. A population claim selects a duty once per file and rejects other families.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the exact-path, canonicalization and independent answer roles under test.
 * @evidence contracts/development/testing.md#behavioral-verification Calls both claim constructors as used by the graph and checks their emitted references and refusals in memory.
 * @evidence contracts/development/testing.md#independent-expectations Literal target paths establish the slash form and matching report, and one principle and one duty establish type of answer. Neighboring invalid paths differ in one segment or reserved owner.
 */
export function test_evidence_work_contract_addresses(): void {
  const checklist = (document: string | string[]) =>
    createPackageChecklistClaim({
      name: "work-specific scenes",
      document,
      files: ["screenplay/**/*.md"],
      stage: "evidence",
      symbol: "h2",
    });
  const population = (document: string) =>
    createPackagePopulationContract({
      document,
      layers: { screenplay: "evidence" },
      narrativeScope: { mode: "complete-work" },
      reason: "account for the commission",
    });

  const rule = checklist("work\\principles\\dialogue\\rule.md");
  assert.deepEqual(rule.reference, [
    {
      type: "markdown",
      root: "docs/contracts",
      files: ["work/principles/dialogue/rule.md"],
      symbol: "h2",
      checklist: true,
      noEvidenceExclude: true,
    },
  ]);
  const [duty] = population("work\\obligations\\dialogue\\duty.md");
  assert.equal(duty?.symbol, "file");
  assert.deepEqual(duty?.reference, {
    type: "markdown",
    root: "docs/contracts",
    files: ["work/obligations/dialogue/duty.md"],
    symbol: "h2",
    uniqueEvidence: true,
    noEvidenceExclude: true,
  });

  for (const suffix of [
    "/rule.md",
    "./rule.md",
    "a/../rule.md",
    "a/*.md",
    "a/[1].md",
    "a/rule.md#scope",
    "a/SkiLL.md",
    "readme.txt",
  ]) {
    assert.throws(() => checklist(`work/principles/${suffix}`), /exact work/);
    assert.throws(() => population(`work/obligations/${suffix}`), /exact work/);
  }
  assert.doesNotThrow(() => checklist("work/naturalness/dialogue.md"));
  assert.throws(
    () => checklist(["work/principles/rule.md", "work\\principles\\rule.md"]),
    /same work document twice/,
  );
  assert.throws(() => checklist("work/obligations/duty.md"), /once per duty/);
  assert.throws(
    () => checklist("work/discovery/results.md"),
    /built-in discovery/,
  );
  assert.throws(() => population("work/principles/rule.md"), /exact work/);
}
