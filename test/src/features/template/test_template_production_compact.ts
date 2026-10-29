import { createEvidenceConfig } from "@automovie/evidence";
import {
  type IProductionPassValidation,
  analyzeProductionPass,
} from "@automovie/evidence/narrative";
import type { IEvidenceConfig } from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * A compact film can inherit actual settings without invented event/script layers.
 *
 * Scenarios:
 * 1. Settings and screenplay pass through the public facade without treatments, scripts or an outline.
 * 2. Changed canon and a missing screenplay-to-canon answer block readiness.
 * 3. Missing canon and disabled drafts cannot become completed passes.
 * 4. Direct short mode still refuses an undeclared settings stage.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates real authored populations and current review fingerprints through the public factory and pass analyzer, then changes canon, removes a dependency answer and removes canon entirely. Readiness and required pass assertions catch omitted settings dependencies and invented intermediate stages.
 * @evidence contracts/testing.md#independent-expectations The compact route requires settings construction and screenplay construction/naturalness, with neither treatments nor scripts. A changed required parent's current fingerprint, an unanswered actual canon dependency or an absent required population must prevent readiness regardless of screenplay approval.
 * @evidence contracts/testing.md#distinguishing-cases Complete, stale-parent, unanswered-edge, missing-parent and disabled states distinguish routing from approval. An unchanged direct short rejects active settings rather than silently changing its route; existing tests own long, asset and physical-alias behavior.
 * @evidence contracts/testing.md#execution-ownership The exported test owns its temporary Markdown package and removes it in finally. Native graph evaluation runs in-process without installing a consumer, spawning a process or using a GPU; fixture review records establish structure only.
 */
export async function test_template_production_compact(): Promise<void> {
  const cache: string = path.resolve(
    __dirname,
    "../../../../packages/template/.cache",
  );
  fs.mkdirSync(cache, { recursive: true });
  const root: string = fs.realpathSync.native(
    fs.mkdtempSync(path.join(cache, "compact-")),
  );
  try {
    ProductionWorkflowFixture.complete(root, "short-with-settings");
    for (const relative of ["docs/body/treatments", "docs/body/scripts"])
      fs.rmSync(path.join(root, relative), { recursive: true });
    fs.rmSync(path.join(root, "docs/body/screenplay/001-part/index.md"));
    const unit: string =
      "docs/evidence/construction/units/screenplay/001-part/001-scene.md";
    const dependency: string =
      "## @evidence settings/001-event.md#arrival\n\nThe complete fixture scene carries this requirement.\n";
    const config: IEvidenceConfig = createEvidenceConfig({
      location: root,
      narrative: {
        mode: "short-with-settings",
        construction: { settings: "evidence", screenplay: "evidence" },
        naturalness: { screenplay: "evidence" },
      },
    });
    await ProductionWorkflowFixture.certify(root, config);
    const complete: IProductionPassValidation = await analyzeProductionPass(
      config,
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.deepEqual(
      complete.scope.requiredPasses
        .map(
          (entry: { layer: string; pass: string }): string =>
            `${entry.layer}/${entry.pass}`,
        )
        .sort((left: string, right: string): number =>
          left < right ? -1 : left > right ? 1 : 0,
        ),
      [
        "screenplay/construction",
        "screenplay/naturalness",
        "settings/construction",
      ],
    );
    assert.equal(
      complete.approvalStructureReady,
      true,
      JSON.stringify({
        issues: complete.scope.issues,
        diagnostics: complete.blockingDiagnostics,
        refresh: complete.reviewRefreshDiagnostics,
        transfers: complete.pendingNaturalnessTransfers,
      }),
    );

    const canon: string = "docs/body/settings/001-event.md";
    const originalCanon: string = fs.readFileSync(
      path.join(root, canon),
      "utf8",
    );
    ProductionWorkflowFixture.write(
      root,
      canon,
      originalCanon + "\nThe door is blue.\n",
    );
    const changed: IProductionPassValidation = await analyzeProductionPass(
      config,
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(changed.rereadReady, false);
    assert.ok(changed.blockingDiagnostics.length > 0);

    ProductionWorkflowFixture.write(root, canon, originalCanon);
    ProductionWorkflowFixture.write(
      root,
      unit,
      fs.readFileSync(path.join(root, unit), "utf8").replace(dependency, ""),
    );
    const missingAnswer: IProductionPassValidation =
      await analyzeProductionPass(
        config,
        path.join(root, "evidence.config.ts"),
        { layer: "screenplay", pass: "construction" },
      );
    assert.equal(missingAnswer.rereadReady, false);
    assert.ok(missingAnswer.blockingDiagnostics.length > 0);

    fs.rmSync(path.join(root, canon));
    const absent: IProductionPassValidation = await analyzeProductionPass(
      createEvidenceConfig({
        location: root,
        narrative: {
          mode: "short-with-settings",
          construction: { settings: "evidence", screenplay: "evidence" },
        },
      }),
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "construction" },
    );
    assert.equal(absent.rereadReady, false);
    assert.ok(absent.scope.issues.length > 0);

    const draft: IProductionPassValidation = await analyzeProductionPass(
      createEvidenceConfig({
        location: root,
        narrative: { mode: "short-with-settings" },
      }),
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "construction" },
    );
    assert.equal(draft.approvalStructureReady, false);
    assert.throws(
      (): IEvidenceConfig =>
        createEvidenceConfig({
          location: root,
          narrative: { mode: "short", construction: { settings: "evidence" } },
        }),
      /outside.*route|disabled/i,
    );
  } finally {
    fs.rmSync(root, { recursive: true });
  }
}
