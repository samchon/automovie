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
 * A short production composes its brief canon and its scene-file screenplay as native graph duties.
 *
 * Scenarios:
 * 1. A complete brief and a screenplay scene file in its film folder, with construction answers and reviews, need no settings, treatment, script or outline population and pass.
 * 2. Editing a reviewed brief decision expires its native review.
 * 3. With the brief closed and turned back to disabled while the screenplay runs, the brief's recorded discovery findings still resolve and the graph passes.
 * 4. Removing the screenplay's citation of its brief decision exposes missing native coverage.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the public short configuration through native Evidence, changes the brief, disables the closed brief stage and removes the actual dependency annotation; checks complete reports and stale-review and missing-acknowledgement diagnostics.
 * @evidence contracts/development/testing.md#independent-expectations The authored one-scene fixture supplies its real brief dependency and current fingerprints; removing that edge or changing reviewed brief bytes must produce native errors, while a closed brief turned back to disabled must not break the running screenplay, as the evidence README promises for a finished layer.
 * @evidence contracts/development/testing.md#distinguishing-cases Complete, changed-brief, closed-brief and missing-citation cases distinguish relationship coverage, review freshness and stage independence on the short route.
 * @evidence contracts/development/testing.md#execution-ownership This exported test evaluates native Evidence in process, owns its unique temporary files and removes them in finally. It starts no installation, subprocess, browser or GPU and replaces no foreign method.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A complete brief and a screenplay scene file in its film folder, with construction answers and reviews, need no settings, treatment, script or outline population and pass.).
 */
export async function test_evidence_production_short_brief(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    ProductionWorkflowFixture.complete(root, "short");
    for (const relative of [
      "docs/body/settings",
      "docs/body/treatments",
      "docs/body/scripts",
    ])
      fs.rmSync(path.join(root, relative), { recursive: true });
    const config: IEvidenceConfig = createEvidenceConfig({
      location: root,
      narrative: {
        mode: "short",
        construction: { brief: "evidence", screenplay: "evidence" },
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
    // The brief closes and returns to disabled while the screenplay still
    // runs; the brief's findings in the shared discovery record still resolve.
    const closed: IEvidenceConfig = createEvidenceConfig({
      location: root,
      narrative: {
        mode: "short",
        construction: { brief: "disabled", screenplay: "evidence" },
      },
    });
    const running: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, closed.claims);
    assert.equal(
      running.report.success,
      true,
      JSON.stringify(running.report.diagnostics),
    );

    const unit: string = path.join(
      root,
      "docs/evidence/construction/units/screenplay",
      ProductionWorkflowFixture.scene("short"),
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
