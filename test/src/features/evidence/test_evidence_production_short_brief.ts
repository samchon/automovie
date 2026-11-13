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
 * A short production composes its brief canon and screenplay as native graph duties, with screenplay naturalness kept.
 *
 * Scenarios:
 * 1. A complete brief and screenplay, with construction, naturalness and reviews, need no settings, treatment, script or outline population and pass.
 * 2. Editing a reviewed brief decision expires its native review.
 * 3. Removing the screenplay's citation of its brief decision exposes missing native coverage.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the public short configuration through native Evidence, then changes the brief and removes the actual dependency annotation; checks complete reports and stale-review and missing-acknowledgement diagnostics.
 * @evidence contracts/development/testing.md#independent-expectations The authored one-scene fixture supplies its real brief dependency and current fingerprints; removing that edge or changing reviewed brief bytes must produce native errors.
 * @evidence contracts/development/testing.md#distinguishing-cases Complete, changed-brief and missing-citation cases distinguish relationship coverage from review freshness on the short route.
 * @evidence contracts/development/testing.md#execution-ownership This exported test evaluates native Evidence in process, owns its unique temporary files and removes them in finally. It starts no installation, subprocess, browser or GPU and replaces no foreign method.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A complete brief and screenplay, with construction, naturalness and reviews, need no settings, treatment, script or outline population and pass.).
 */
export async function test_evidence_production_short_brief(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    ProductionWorkflowFixture.complete(root, "short");
    for (const relative of [
      "docs/body/settings",
      "docs/body/treatments",
      "docs/body/scripts",
      "docs/body/screenplay/001-part/index.md",
    ])
      fs.rmSync(path.join(root, relative), { recursive: true });
    const config: IEvidenceConfig = createEvidenceConfig({
      location: root,
      narrative: {
        mode: "short",
        construction: { brief: "evidence", screenplay: "evidence" },
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

    const brief: string = path.join(root, "docs/body/brief/world/arrival.md");
    const original: string = fs.readFileSync(brief, "utf8");
    fs.writeFileSync(brief, original + "\nThe door is blue.\n");
    const changed: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, config.claims);
    assert.equal(changed.report.success, false);
    assert.ok(
      changed.report.diagnostics.some(
        (finding: { code: string }): boolean =>
          finding.code === "graph-stale-review",
      ),
    );

    fs.writeFileSync(brief, original);
    const unit: string = path.join(
      root,
      "docs/evidence/construction/units/screenplay/001-part/001-scene.md",
    );
    const dependency: string =
      "## @evidence brief/world/arrival.md#arrival\n\nThe complete fixture scene carries this requirement.\n";
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
  } finally {
    fs.rmSync(root, { recursive: true });
  }
}
