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
 * Factory relationships allow event braiding while preserving final-script lineage.
 *
 * Scenarios:
 * 1. Two scripts share an event and one script realizes two treatment files.
 * 2. Removing every citation of the second event exposes missing coverage.
 * 3. A screenplay file realizes exactly one script; a second parent is refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Submits the factory's actual file-relationship claims to EvidenceChecker with authored Markdown citations and asserts accepted many-to-many coverage, uncovered-event failure and rejection of multiple lineage parents.
 * @evidence contracts/testing.md#independent-expectations Two independently authored treatment files and three explicit script citations establish the allowed braid; the final screenplay's one-parent contract determines its permitted cardinality. Assertions inspect checker outcomes and diagnostic codes rather than source arrangement.
 * @evidence contracts/testing.md#distinguishing-cases Shared-parent and multi-parent event coverage both pass, a completely uncited event fails, and the neighboring final-lineage relation rejects that same multi-parent shape. Full pass readiness and review freshness are owned by the routing and review tests.
 * @evidence contracts/testing.md#execution-ownership The exported test_template_production_relationships entry owns three independent authored snapshots in a temporary tree and calls the public checker in-process. It installs nothing and starts no process, browser or GPU.
 */
export async function test_template_production_relationships(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    const props: IProductionConfigProps = ProductionWorkflowFixture.props(root);
    props.construction.scripts = "evidence";
    props.construction.screenplay = ["evidence", false];
    const claims: IEvidenceClaim[] = createProductionClaims(props);
    const scripts: IEvidenceClaim | undefined = claims.find(
      (claim: IEvidenceClaim): boolean =>
        claim.name === "scripts unit files account for the layers they inherit",
    );
    const screenplay: IEvidenceClaim | undefined = claims.find(
      (claim: IEvidenceClaim): boolean =>
        claim.name ===
        "screenplay unit files account for the layers they inherit",
    );
    assert.ok(scripts);
    assert.ok(screenplay);
    for (const event of ["001-arrival", "002-departure"])
      ProductionWorkflowFixture.write(
        root,
        `docs/body/treatments/${event}.md`,
        `# ${event}\n\n## Event\n\nThe guest changes direction.\n`,
      );
    ProductionWorkflowFixture.write(
      root,
      "docs/body/scripts/001-part/001-scene.md",
      "<!--\n@evidence docs/body/treatments/001-arrival.md Opens with the arrival.\n@evidence docs/body/treatments/002-departure.md Ends with the departure.\n-->\n# First\n\n## Scene\n\nThe guest arrives and departs.\n",
    );
    ProductionWorkflowFixture.write(
      root,
      "docs/body/scripts/001-part/002-scene.md",
      "<!--\n@evidence docs/body/treatments/001-arrival.md Revisits the arrival from another view.\n-->\n# Second\n\n## Scene\n\nThe host sees the guest arrive.\n",
    );
    for (const layer of ["scripts", "screenplay"])
      for (const scene of ["001-scene", "002-scene"])
        ProductionWorkflowFixture.write(
          root,
          `docs/evidence/construction/files/${layer}/001-part/${scene}.md`,
          `# docs/body/${layer}/001-part/${scene}.md\n`,
        );
    const braided: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, [scripts]);
    assert.equal(
      braided.report.success,
      true,
      JSON.stringify(braided.report.diagnostics),
    );

    ProductionWorkflowFixture.write(
      root,
      "docs/body/scripts/001-part/001-scene.md",
      "<!--\n@evidence docs/body/treatments/001-arrival.md Opens with the arrival.\n-->\n# First\n\n## Scene\n\nThe guest arrives.\n",
    );
    const missing: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, [scripts]);
    assert.equal(missing.report.success, false);
    assert.ok(
      missing.report.diagnostics.some(
        (finding: { code: string }): boolean =>
          finding.code === "graph-missing-acknowledgement",
      ),
    );

    ProductionWorkflowFixture.write(
      root,
      "docs/body/screenplay/001-part/001-scene.md",
      "<!--\n@evidence docs/body/scripts/001-part/001-scene.md Realizes the first script.\n@evidence docs/body/treatments/001-arrival.md Realizes the arrival.\n-->\n# First\n\n## Scene\n\nThe guest arrives.\n",
    );
    ProductionWorkflowFixture.write(
      root,
      "docs/body/screenplay/001-part/002-scene.md",
      "<!--\n@evidence docs/body/scripts/001-part/002-scene.md Realizes the second script.\n@evidence docs/body/treatments/002-departure.md Realizes the departure.\n-->\n# Second\n\n## Scene\n\nThe guest departs.\n",
    );
    const single: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, [screenplay]);
    assert.equal(
      single.report.success,
      true,
      JSON.stringify(single.report.diagnostics),
    );

    ProductionWorkflowFixture.write(
      root,
      "docs/body/screenplay/001-part/001-scene.md",
      "<!--\n@evidence docs/body/scripts/001-part/001-scene.md Realizes the first script.\n@evidence docs/body/scripts/001-part/002-scene.md Also claims the second script.\n@evidence docs/body/treatments/001-arrival.md Realizes the arrival.\n@evidence docs/body/treatments/002-departure.md Realizes the departure.\n-->\n# First\n\n## Scene\n\nThe guest arrives.\n",
    );
    const multiple: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, [screenplay]);
    assert.equal(multiple.report.success, false);
    assert.ok(
      multiple.report.diagnostics.some(
        (finding: { code: string }): boolean =>
          finding.code === "graph-single-evidence-per-symbol",
      ),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
