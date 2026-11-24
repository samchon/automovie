import {
  type IProductionConfigProps,
  createProductionConfig,
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

import { ProductionWorkflowFixture } from "../../../internal/ProductionWorkflowFixture";

/**
 * Subordinate action groups retain their owning H2's native evidence and fingerprint.
 *
 * Scenarios:
 * 1. A script scene H2 with an H3 action group and a screenplay section H2 with an H3 beat each stay one H2 respondent.
 * 2. Readdressing the script scene's detached answers to its H3 is refused, because the H3 is no claim unit.
 * 3. Changing an H3 action changes the owning H2 fingerprint and expires its review.
 */
export async function test_unit_evidence_evidence_production_action_groups(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    const props: IProductionConfigProps = ProductionWorkflowFixture.complete(
      root,
      "long",
    );
    const file: string = "001-part/001-scene.md";
    fs.appendFileSync(
      path.join(root, "docs/body/scripts", file),
      "\n### Decision {#decision}\n\nThe guest folds the map.\n",
    );
    fs.appendFileSync(
      path.join(
        root,
        "docs/body/screenplay",
        ProductionWorkflowFixture.scene("long"),
      ),
      "\n### Deliberate movement {#arrival-b01}\n\nThe guest folds the map.\n",
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
    const screenplayIndex: number = config.claims.findIndex(
      (claim: IEvidenceConfig["claims"][number]): boolean =>
        claim.name?.startsWith("screenplay H2 units") === true,
    );
    const section: IEvidenceGraphClaim | undefined =
      ready.graphInput.claims.find(
        (claim: IEvidenceGraphClaim): boolean =>
          claim.index === screenplayIndex,
      );
    assert.ok(section);
    assert.equal(section.unitIds.length, 1);
    const fingerprint: string = EvidenceFingerprint.inspect(
      before.inventory,
      before.unitIds[0],
    ).fingerprint;

    const answers: string = path.join(
      root,
      "docs/evidence/construction/units/scripts",
      file,
    );
    const answered: string = fs.readFileSync(answers, "utf8");
    fs.writeFileSync(answers, answered.replace("#arrival\n", "#decision\n"));
    const misplaced: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, config.claims);
    assert.equal(misplaced.report.success, false);
    assert.ok(
      misplaced.report.diagnostics.some(
        (finding: { code: string }): boolean =>
          finding.code === "evidence-files-owner",
      ),
      JSON.stringify(misplaced.report.diagnostics),
    );
    fs.writeFileSync(answers, answered);

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
