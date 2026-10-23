import {
  type IProductionConfigProps,
  type IProductionPassValidation,
  analyzeProductionPass,
  createProductionConfig,
  getProductionClaimOwners,
} from "@automovie/evidence/narrative";
import type { IEvidenceConfig } from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Authored pass validation follows the selected production route and fails closed.
 *
 * Scenarios:
 * 1. A long screenplay follows settings, treatments, scripts, and scripts revision.
 * 2. A short screenplay has no invented upstream narrative requirements.
 * 3. Asset work rejects narrative validation; disabled or empty work stays unready.
 * 4. Cloning a factory config or mutating its captured props loses ownership.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates real temporary Markdown populations through analyzeProductionPass and checks dependency closure, readiness, retained package failure and identity refusal, catching skipped layers and false approval of disabled work.
 * @evidence contracts/testing.md#independent-expectations The required pass sets come from the four-layer long route and direct short route, not generated claim labels. Missing evidence deliberately prevents readiness, so these cases establish structural routing rather than literary approval.
 * @evidence contracts/testing.md#distinguishing-cases Long and short routes share the same authored fixture; disabled and empty populations test fail-closed boundaries. Original and cloned config objects and unchanged versus changed props distinguish valid ownership from bypasses. Relationship cardinalities and revision bytes have separate tests.
 * @evidence contracts/testing.md#execution-ownership The exported test_template_production_routing entry owns all cases and removes its temporary root in finally. It evaluates public evidence APIs in-process without an installed consumer, subprocess, browser or GPU.
 */
export async function test_template_production_routing(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    ProductionWorkflowFixture.populate(root);
    const long: IProductionConfigProps = ProductionWorkflowFixture.props(root);
    long.construction = {
      settings: "evidence",
      treatments: "evidence",
      scripts: "evidence",
      screenplay: "evidence",
    };
    long.naturalness.scripts = "evidence";
    const longConfig: IEvidenceConfig = createProductionConfig(long);
    const longResult: IProductionPassValidation = await analyzeProductionPass(
      longConfig,
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "construction" },
    );
    assert.deepEqual(
      longResult.scope.requiredPasses
        .map(
          (key: { layer: string; pass: string }): string =>
            `${key.layer}/${key.pass}`,
        )
        .sort((left: string, right: string): number =>
          left < right ? -1 : left > right ? 1 : 0,
        ),
      [
        "screenplay/construction",
        "scripts/construction",
        "scripts/naturalness",
        "settings/construction",
        "treatments/construction",
      ],
    );
    assert.equal(longResult.packageSuccess, false);
    assert.equal(longResult.rereadReady, false);
    assert.ok(longResult.blockingDiagnostics.length > 0);
    assert.equal(longResult.analysis.report.success, false);

    const short: IProductionConfigProps = ProductionWorkflowFixture.props(
      root,
      "short",
    );
    short.construction.screenplay = "evidence";
    const shortResult: IProductionPassValidation = await analyzeProductionPass(
      createProductionConfig(short),
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "construction" },
    );
    assert.deepEqual(shortResult.scope.requiredPasses, [
      { layer: "screenplay", pass: "construction" },
    ]);
    assert.equal(shortResult.rereadReady, false);

    const disabled: IProductionConfigProps =
      ProductionWorkflowFixture.props(root);
    const disabledResult: IProductionPassValidation =
      await analyzeProductionPass(
        createProductionConfig(disabled),
        path.join(root, "evidence.config.ts"),
        { layer: "screenplay", pass: "construction" },
      );
    assert.equal(disabledResult.rereadReady, false);
    assert.equal(disabledResult.approvalStructureReady, false);
    assert.ok(disabledResult.scope.issues.length > 0);

    const asset: IProductionConfigProps = ProductionWorkflowFixture.props(
      root,
      "asset",
    );
    await assert.rejects(
      analyzeProductionPass(
        createProductionConfig(asset),
        path.join(root, "evidence.config.ts"),
        { layer: "screenplay", pass: "construction" },
      ),
      /asset|route|narrative|selected|layer/i,
    );

    fs.rmSync(path.join(root, "docs/body/screenplay"), {
      recursive: true,
      force: true,
    });
    const emptyResult: IProductionPassValidation = await analyzeProductionPass(
      createProductionConfig(short),
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "construction" },
    );
    assert.equal(emptyResult.rereadReady, false);
    assert.ok(emptyResult.scope.issues.length > 0);

    assert.throws(
      (): unknown => getProductionClaimOwners(structuredClone(longConfig)),
      /original|factory|instance/i,
    );
    long.gate.harnessVersion = "changed-after-capture";
    assert.throws(
      (): unknown => getProductionClaimOwners(longConfig),
      /changed|ownership/i,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
