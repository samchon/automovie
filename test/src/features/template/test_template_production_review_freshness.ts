import {
  type IProductionConfigProps,
  createProductionClaims,
} from "@automovie/evidence/narrative";
import type {
  IEvidenceCheckAnalysis,
  IEvidenceClaim,
} from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Mirrored independent reviews expire when the authored scene changes.
 *
 * Scenarios:
 * 1. A review citation without its fingerprint pair remains unapproved.
 * 2. A pair naming the checker's captured fingerprint covers the current scene.
 * 3. A body annotation leaves that review current; changing action expires it.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates the factory's real review claim against body and mirrored review documents, proving that an ordinary evidence citation cannot substitute for independent review and that authored action changes produce graph-stale-review.
 * @evidence contracts/testing.md#independent-expectations The documented native fingerprint contract excludes annotations and includes scene content. A captured public graph edge supplies the opaque hash token, while independently changed annotations and action determine the expected unchanged and stale outcomes; no literary verdict is inferred.
 * @evidence contracts/testing.md#distinguishing-cases Missing review, current paired review, annotation-only edit and action edit distinguish presence from currentness. Relationship coverage and complete upstream readiness belong to their separate tests.
 * @evidence contracts/testing.md#execution-ownership The exported test_template_production_review_freshness entry owns four authored snapshots and a finally-cleaned temporary directory. It uses the public Markdown checker in-process without spawning a host or mocking adapters.
 */
export async function test_template_production_review_freshness(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    const body: string =
      "# First\n\n## Scene {#scene}\n\nThe guest opens the door.\n";
    const reviewPath: string =
      "docs/review/draft/scripts/round-1/001-part/001-scene.md";
    const review: string =
      "# First\n\n## Scene {#scene}\n<!--\n@evidence 001-part/001-scene.md#scene Read the full scene.\n@evidence shared/principles/review.md#scope Compared the complete scene.\n";
    ProductionWorkflowFixture.write(
      root,
      "docs/body/scripts/001-part/001-scene.md",
      body,
    );
    ProductionWorkflowFixture.write(
      root,
      reviewPath,
      `${review}-->\nThe action is executable.\n`,
    );
    ProductionWorkflowFixture.write(
      root,
      ".agents/skills/contracts/story/shared/principles/review.md",
      "# Review\n\n## Scope {#scope}\n\nRead the complete target.\n",
    );
    const props: IProductionConfigProps = ProductionWorkflowFixture.props(root);
    props.construction.scripts = "evidence";
    const claim: IEvidenceClaim | undefined = createProductionClaims(
      props,
    ).find(
      (candidate: IEvidenceClaim): boolean =>
        candidate.name ===
        "scripts construction review H2 units keep a current review of their draft H2",
    );
    assert.ok(claim);
    const unreviewed: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, [claim]);
    assert.equal(unreviewed.report.success, false);
    assert.ok(
      unreviewed.report.diagnostics.some(
        (finding: { code: string }): boolean =>
          finding.code === "graph-missing-review",
      ),
    );
    const fingerprint: string | undefined =
      unreviewed.graph.claims[0]?.obligations[0]?.edges[0]?.fingerprint;
    assert.ok(fingerprint);
    ProductionWorkflowFixture.write(
      root,
      reviewPath,
      `${review}@evidenceReview 001-part/001-scene.md#scene #${fingerprint} Independently inspected the scene.\n-->\nThe action is executable.\n`,
    );
    const current: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, [claim]);
    assert.equal(
      current.report.success,
      true,
      JSON.stringify(current.report.diagnostics),
    );

    ProductionWorkflowFixture.write(
      root,
      "docs/body/scripts/001-part/001-scene.md",
      body.replace("\n\nThe guest", "\n<!-- A drafting note. -->\n\nThe guest"),
    );
    const annotated: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, [claim]);
    assert.equal(
      annotated.report.success,
      true,
      JSON.stringify(annotated.report.diagnostics),
    );

    ProductionWorkflowFixture.write(
      root,
      "docs/body/scripts/001-part/001-scene.md",
      body.replace("opens", "locks"),
    );
    const stale: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, [claim]);
    assert.equal(stale.report.success, false);
    assert.ok(
      stale.report.diagnostics.some(
        (finding: { code: string }): boolean =>
          finding.code === "graph-stale-review",
      ),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
