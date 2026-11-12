import {
  createProductionConfig,
  type IProductionConfigProps,
} from "@automovie/evidence/internal";
import {
  EvidenceFingerprint,
  type IEvidenceCheckAnalysis,
  type IEvidenceConfig,
  type IEvidenceGraphClaim,
  type IEvidenceUnit,
} from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Subordinate action groups retain their owning scene's native evidence and fingerprint.
 *
 * Scenarios:
 * 1. Different H3 labels across scripts and screenplay keep one H2 scene respondent.
 * 2. Moving checklist answers below H3 leaves the actual H2 unanswered.
 * 3. Changing an H3 action changes the owning H2 fingerprint and expires its review.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates a real long-form native graph, inspects actual selected units and parent IDs, moves an annotation and changes a scripted action.
 * @evidence contracts/development/testing.md#independent-expectations H2 scene selection remains one unit despite a subordinate H3. An action change must alter its ancestor fingerprint; existing current reviews must then fail.
 * @evidence contracts/development/testing.md#distinguishing-cases Unchanged scenes with different H3 labels distinguish grouping from inherited scene identity; moved answers and changed action distinguish annotation ownership from body freshness.
 * @evidence contracts/development/testing.md#execution-ownership This exported test evaluates native Evidence in process, owns its unique temporary files and removes them in finally. It starts no installation, subprocess, browser or GPU and replaces no foreign method.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Different H3 labels across scripts and screenplay keep one H2 scene respondent.).
 */

export async function test_template_production_action_groups(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    const props: IProductionConfigProps = ProductionWorkflowFixture.complete(
      root,
      "long",
    );
    const file: string = "001-part/001-scene.md";
    fs.appendFileSync(
      path.join(root, "docs/body/scripts", file),
      "\n### Decision\n\nThe guest folds the map.\n",
    );
    fs.appendFileSync(
      path.join(root, "docs/revision/screenplay", file),
      "\n### Draft movement\n\nThe guest folds the map.\n",
    );
    for (const edition of ["body", "naturalness"])
      fs.appendFileSync(
        path.join(root, "docs", edition, "screenplay", file),
        "\n### Deliberate movement\n\nThe guest folds the map.\n",
      );
    await ProductionWorkflowFixture.certify(root, props);
    const config: IEvidenceConfig = createProductionConfig(props);
    const ready: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, config.claims);
    assert.equal(
      ready.report.success,
      true,
      JSON.stringify(ready.report.diagnostics),
    );
    const scriptIndex: number = config.claims.findIndex(
      (claim: IEvidenceConfig["claims"][number]): boolean =>
        claim.name?.startsWith("scripts H2 units") === true,
    );
    assert.ok(scriptIndex >= 0);
    const before: IEvidenceGraphClaim | undefined =
      ready.graphInput.claims.find(
        (claim: IEvidenceGraphClaim): boolean => claim.index === scriptIndex,
      );
    assert.ok(before);
    assert.equal(before.unitIds.length, 1);
    const groups: IEvidenceUnit[] = before.inventory.units.filter(
      (unit: IEvidenceUnit): boolean => unit.symbol === "h3",
    );
    assert.equal(groups.length, 1);
    assert.equal(groups[0].parentId, before.unitIds[0]);
    const fingerprint: string = EvidenceFingerprint.inspect(
      before.inventory,
      before.unitIds[0],
    ).fingerprint;

    const workingFile: string = path.join(
      root,
      "docs/naturalness/screenplay",
      file,
    );
    const working: string = fs.readFileSync(workingFile, "utf8");
    const attached: RegExpMatchArray | null =
      /^## [^\n]+\n(<!--[\s\S]*?-->\n)/mu.exec(working);
    assert.ok(attached);
    fs.writeFileSync(
      workingFile,
      working.replace(attached[1], "") + "\n" + attached[1],
    );
    const misplaced: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, config.claims);
    assert.equal(misplaced.report.success, false);
    assert.ok(
      misplaced.report.diagnostics.some(
        (finding: { code: string }): boolean =>
          finding.code === "graph-checklist-missing" ||
          finding.code === "graph-missing-acknowledgement",
      ),
    );
    fs.writeFileSync(workingFile, working);

    const script: string = path.join(root, "docs/body/scripts", file);
    fs.writeFileSync(
      script,
      fs.readFileSync(script, "utf8").replace("folds the map", "tears the map"),
    );
    const stale: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, config.claims);
    const after: IEvidenceGraphClaim | undefined = stale.graphInput.claims.find(
      (claim: IEvidenceGraphClaim): boolean => claim.index === scriptIndex,
    );
    assert.ok(after);
    assert.notEqual(
      EvidenceFingerprint.inspect(after.inventory, after.unitIds[0])
        .fingerprint,
      fingerprint,
    );
    assert.ok(
      stale.report.diagnostics.some(
        (finding: { code: string }): boolean =>
          finding.code === "graph-stale-review",
      ),
    );
  } finally {
    fs.rmSync(root, { recursive: true });
  }
}
