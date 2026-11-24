import {
  type IProductionConfigProps,
  createProductionClaims,
} from "@automovie/evidence/internal";
import type {
  IEvidenceCheckAnalysis,
  IEvidenceClaim,
} from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Factory relationships allow event braiding while preserving script-scene lineage.
 *
 * Scenarios:
 * 1. Two scripts share an event and one script realizes two treatment files.
 * 2. Removing every citation of the second event exposes missing coverage.
 * 3. A script episode of two scenes becomes a screenplay episode folder of two scene files, each realizing exactly one script scene H2.
 * 4. A screenplay scene file claiming a second script scene is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Submits the factory's actual file-relationship claims to EvidenceChecker with authored Markdown citations and asserts accepted many-to-many coverage, uncovered-event failure, accepted scene-file lineage and rejection of multiple lineage parents.
 * @evidence contracts/development/testing.md#independent-expectations Two independently authored treatment files and three explicit script citations establish the allowed braid; the screenplay layout's one-scene-file-per-script-scene rule determines the permitted cardinality. Assertions inspect checker outcomes and diagnostic codes rather than source arrangement.
 * @evidence contracts/development/testing.md#distinguishing-cases Shared-parent and multi-parent event coverage both pass, a completely uncited event fails, three scene files each citing one script scene pass, and the same lineage rejects a scene file citing two. Separate review tests cover native fingerprint freshness.
 * @evidence contracts/development/testing.md#execution-ownership The exported test_evidence_production_relationships entry owns its authored snapshots in a temporary tree and calls the public checker in-process. It installs nothing and starts no process, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Two scripts share an event and one script realizes two treatment files.).
 */
export async function test_evidence_production_relationships(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  try {
    const props: IProductionConfigProps = ProductionWorkflowFixture.props(root);
    props.construction.scripts = "evidence";
    props.construction.screenplay = "evidence";
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
      "<!--\n@evidence docs/body/treatments/001-arrival.md Revisits the arrival from another view.\n-->\n# Second\n\n## Scene {#scene}\n\nThe host sees the guest arrive.\n",
    );
    for (const file of [
      "scripts/001-part/001-scene.md",
      "scripts/001-part/002-scene.md",
      "screenplay/001-part/001-scene/001-arrival.md",
      "screenplay/001-part/001-scene/002-doorway.md",
      "screenplay/001-part/002-scene/001-host.md",
    ])
      ProductionWorkflowFixture.write(
        root,
        `docs/evidence/construction/files/${file}`,
        `# docs/body/${file}\n`,
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

    // The first script episode holds two scenes, so its screenplay episode
    // folder holds two scene files, each realizing exactly one script scene.
    ProductionWorkflowFixture.write(
      root,
      "docs/body/scripts/001-part/001-scene.md",
      "<!--\n@evidence docs/body/treatments/001-arrival.md Opens with the arrival.\n@evidence docs/body/treatments/002-departure.md Ends with the departure.\n-->\n# First\n\n## Arrival {#arrival}\n\nThe guest arrives.\n\n## Doorway {#doorway}\n\nThe guest turns back at the door.\n",
    );
    const scene = (citations: string[], title: string): string =>
      `<!--\n${citations.join("\n")}\n-->\n# ${title}\n\n## Entry {#s01}\n\nThe guest moves.\n`;
    ProductionWorkflowFixture.write(
      root,
      "docs/body/screenplay/001-part/001-scene/001-arrival.md",
      scene(
        [
          "@evidence scripts/001-part/001-scene.md#arrival Realizes the arrival scene.",
          "@evidence docs/body/treatments/001-arrival.md Realizes the arrival.",
        ],
        "Arrival",
      ),
    );
    ProductionWorkflowFixture.write(
      root,
      "docs/body/screenplay/001-part/001-scene/002-doorway.md",
      scene(
        [
          "@evidence scripts/001-part/001-scene.md#doorway Realizes the doorway scene.",
          "@evidence docs/body/treatments/002-departure.md Realizes the departure.",
        ],
        "Doorway",
      ),
    );
    ProductionWorkflowFixture.write(
      root,
      "docs/body/screenplay/001-part/002-scene/001-host.md",
      scene(
        [
          "@evidence scripts/001-part/002-scene.md#scene Realizes the host's view.",
          "@evidence docs/body/treatments/001-arrival.md Realizes the arrival again.",
        ],
        "Host",
      ),
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
      "docs/body/screenplay/001-part/001-scene/001-arrival.md",
      scene(
        [
          "@evidence scripts/001-part/001-scene.md#arrival Realizes the arrival scene.",
          "@evidence scripts/001-part/001-scene.md#doorway Also claims the doorway scene.",
          "@evidence docs/body/treatments/001-arrival.md Realizes the arrival.",
        ],
        "Arrival",
      ),
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
