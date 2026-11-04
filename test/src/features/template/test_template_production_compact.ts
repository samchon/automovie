import { createEvidenceConfig } from "@automovie/evidence";
import type {
  IEvidenceCheckAnalysis,
  IEvidenceConfig,
} from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Compact shorts compose actual canon and screenplay as native graph duties.
 *
 * Scenarios:
 * 1. Complete settings and screenplay need no treatment, script or outline population.
 * 2. A canon action edit expires its native review.
 * 3. Removing an actual canon citation exposes missing native coverage.
 * 4. Direct screenplay mode rejects an active settings stage.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates the public compact configuration, then changes canon and removes the actual dependency annotation; checks complete native reports and stale-review diagnostics.
 * @evidence contracts/testing.md#independent-expectations The authored one-scene fixture supplies its real settings dependency and current fingerprints. Removing that edge or changing reviewed body bytes must produce native errors.
 * @evidence contracts/testing.md#distinguishing-cases Complete, changed-parent and missing-citation cases distinguish relationship coverage from review freshness; direct short routing preserves its separate layer boundary.
 * @evidence contracts/testing.md#execution-ownership This exported test evaluates native Evidence in process, owns its unique temporary files and removes them in finally. It starts no installation, subprocess, browser or GPU and replaces no foreign method.
 */

export async function test_template_production_compact(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    ProductionWorkflowFixture.complete(root, "short-with-settings");
    for (const relative of ["docs/body/treatments", "docs/body/scripts"])
      fs.rmSync(path.join(root, relative), { recursive: true });
    fs.rmSync(path.join(root, "docs/body/screenplay/001-part/index.md"));
    const config: IEvidenceConfig = createEvidenceConfig({
      location: root,
      narrative: {
        mode: "short-with-settings",
        construction: { settings: "evidence", screenplay: "evidence" },
        naturalness: { screenplay: "evidence" },
      },
    });
    await ProductionWorkflowFixture.certify(root, config);
    const complete: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, config.claims);
    assert.equal(
      complete.report.success,
      true,
      JSON.stringify(complete.report.diagnostics),
    );

    const canon: string = path.join(root, "docs/body/settings/001-event.md");
    const original: string = fs.readFileSync(canon, "utf8");
    fs.writeFileSync(canon, original + "\nThe door is blue.\n");
    const changed: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, config.claims);
    assert.equal(changed.report.success, false);
    assert.ok(
      changed.report.diagnostics.some(
        (finding: { code: string }): boolean =>
          finding.code === "graph-stale-review",
      ),
    );

    fs.writeFileSync(canon, original);
    const unit: string = path.join(
      root,
      "docs/evidence/construction/units/screenplay/001-part/001-scene.md",
    );
    const dependency: string =
      "## @evidence settings/001-event.md#arrival\n\nThe complete fixture scene carries this requirement.\n";
    const content: string = fs.readFileSync(unit, "utf8");
    assert.ok(content.includes(dependency));
    fs.writeFileSync(unit, content.replace(dependency, ""));
    const missing: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, config.claims);
    assert.equal(missing.report.success, false);
    assert.ok(
      missing.report.diagnostics.some(
        (finding: { code: string }): boolean =>
          finding.code === "graph-missing-acknowledgement",
      ),
    );

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
