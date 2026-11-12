import {
  createProductionClaims,
  createProductionConfig,
  type IProductionConfigProps,
} from "@automovie/evidence/internal";
import type {
  IEvidenceCheckAnalysis,
  IEvidenceClaim,
} from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Current reviews replace legacy rounds as one exclusive, scope-bound population.
 *
 * Scenarios:
 * 1. The highest numeric legacy round remains valid without current files.
 * 2. A current unit or verdict selects the direct root without legacy backfill.
 * 3. Invalid current bytes and changed authored action remain unapproved.
 * 4. Disabled passes preserve their native selection flags; absent reviews remain an inactive population.
 * 5. Out-of-scope pilot files do not replace legacy; missing H2 coverage fails.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Uses actual native graph evaluation to check current versus legacy review selection, unreadable captures, fingerprint staleness and missing H2 coverage, with exact selected-root assertions.
 * @evidence contracts/development/testing.md#independent-expectations The supported route requires either the direct current population or the largest numeric legacy round, never their union; both independent review and verdict remain necessary for approval. Literal fixture action changes and an omitted authored H2 independently require stale or incomplete review, while native fingerprints remain opaque tokens supplied by the existing certification helper.
 * @evidence contracts/development/testing.md#distinguishing-cases Current and legacy files distinguish exclusive selection; invalid bytes and an action edit distinguish extraction completeness from fingerprint freshness. Round 2 versus 10 distinguishes numeric ordering, and an exact pilot with a second H2 distinguishes selected population and missing coverage.
 * @evidence contracts/development/testing.md#execution-ownership The exported asynchronous entry owns two temporary roots, evaluates real Markdown graphs in process, changes only its fixture documents and removes both roots in finally. It starts no compiler, process, browser or installation and replaces no foreign method or global.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The highest numeric legacy round remains valid without current files.).
 */
export async function test_template_production_current_review(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  const pilotRoot: string = ProductionWorkflowFixture.create();
  try {
    const props: IProductionConfigProps = ProductionWorkflowFixture.complete(
      root,
      "short",
    );
    await ProductionWorkflowFixture.certify(root, props);
    const base: string = path.join(root, "docs/review/draft/screenplay");
    const unit: string = "001-part/001-scene.md";
    const verdict: string = "verdict/index.md";
    const inspect: () => Promise<IEvidenceCheckAnalysis> =
      async (): Promise<IEvidenceCheckAnalysis> =>
        ProductionWorkflowFixture.evaluate(
          root,
          createProductionConfig(props).claims,
        );
    const selected: () => IEvidenceClaim[] = (): IEvidenceClaim[] =>
      createProductionClaims(props).filter(
        (claim: IEvidenceClaim): boolean =>
          (claim.name?.startsWith("screenplay construction review") ?? false) ||
          (claim.name?.startsWith("screenplay construction verdict") ?? false),
      );

    // Numeric legacy selection remains supported even beside a broken older round.
    fs.cpSync(path.join(base, "round-1"), path.join(base, "round-10"), {
      recursive: true,
    });
    ProductionWorkflowFixture.write(
      root,
      "docs/review/draft/screenplay/round-2/001-part/001-scene.md",
      "# An incomplete older review\n",
    );
    assert.ok(
      selected().every(
        (claim: IEvidenceClaim): boolean =>
          claim.root === "docs/review/draft/screenplay/round-10",
      ),
    );
    fs.writeFileSync(
      path.join(base, "round-2/001-legacy.md"),
      Buffer.from([0xff]),
    );

    // Starting either canonical owner selects the whole direct population.
    const reviewBytes: Buffer = fs.readFileSync(
      path.join(base, "round-10", unit),
    );
    ProductionWorkflowFixture.write(
      root,
      `docs/review/draft/screenplay/${unit}`,
      reviewBytes.toString("utf8"),
    );
    assert.ok(
      selected().every(
        (claim: IEvidenceClaim): boolean =>
          claim.root === "docs/review/draft/screenplay",
      ),
    );
    fs.mkdirSync(path.join(base, "verdict"), { recursive: true });
    fs.copyFileSync(
      path.join(base, "round-10", verdict),
      path.join(base, verdict),
    );
    assert.equal((await inspect()).report.success, true);

    // A valid old population cannot conceal unreadable current input or staleness.
    fs.writeFileSync(path.join(base, unit), Buffer.from([0xff]));
    const invalid: IEvidenceCheckAnalysis = await inspect();
    assert.ok(
      invalid.graphInput.claims.some(
        (
          claim: IEvidenceCheckAnalysis["graphInput"]["claims"][number],
        ): boolean => claim.inventory.complete === false,
      ),
    );
    fs.writeFileSync(path.join(base, unit), reviewBytes);
    const authored: string = path.join(root, "docs/body/screenplay", unit);
    const authoredBytes: Buffer = fs.readFileSync(authored);
    fs.writeFileSync(
      authored,
      authoredBytes.toString("utf8").replace("opens", "locks"),
    );
    const stale: IEvidenceCheckAnalysis = await inspect();
    assert.ok(
      stale.report.diagnostics.some(
        (finding: { code: string }): boolean =>
          finding.code === "graph-stale-review",
      ),
    );
    fs.writeFileSync(authored, authoredBytes);

    fs.rmSync(path.join(base, unit));
    fs.rmSync(path.join(base, verdict));

    // Scope and stage remain independent of the selected review representation.
    props.construction.screenplay = "disabled";
    assert.ok(
      selected().every(
        (claim: IEvidenceClaim): boolean => claim.disabled === true,
      ),
    );
    props.construction.screenplay = "evidence";
    for (const round of ["round-1", "round-2", "round-10"])
      fs.rmSync(path.join(base, round), { recursive: true });
    assert.equal(selected().length, 0);
    fs.writeFileSync(
      path.join(base, "round-3"),
      "A file is not a review round.",
    );
    assert.throws((): IEvidenceClaim[] => selected(), /must be a directory/);

    // Canonical admission observes the pilot's exact file population.
    const pilot: IProductionConfigProps =
      ProductionWorkflowFixture.props(pilotRoot);
    pilot.narrativeScope = { mode: "first-part-pilot", part: "001-part" };
    pilot.construction.scripts = "evidence";
    ProductionWorkflowFixture.write(
      pilotRoot,
      ".agents/skills/contracts/story/shared/principles/review.md",
      "# Review\n\n## Scope {#scope}\n\nRead the whole selected scene.\n",
    );
    ProductionWorkflowFixture.write(
      pilotRoot,
      "docs/body/scripts/001-part/001-scene.md",
      "# Scene\n\n## Arrival {#arrival}\n\nThe guest opens the door.\n\n## Departure {#departure}\n\nThe guest leaves.\n",
    );
    const review: string =
      "# Review\n\n## Arrival {#arrival}\n<!--\n@evidence 001-part/001-scene.md#arrival Read the arrival.\n@evidence shared/principles/review.md#scope Read the complete selected scene.\n-->\nThe entrance is executable.\n";
    ProductionWorkflowFixture.write(
      pilotRoot,
      "docs/review/draft/scripts/round-1/001-part/001-scene.md",
      review,
    );
    ProductionWorkflowFixture.write(
      pilotRoot,
      "docs/review/draft/scripts/002-part/001-scene.md",
      "# Outside this pilot\n\n## Arrival\n\nNot selected.\n",
    );
    const pilotClaim: IEvidenceClaim | undefined = createProductionClaims(
      pilot,
    ).find(
      (claim: IEvidenceClaim): boolean =>
        claim.name?.startsWith("scripts construction review") ?? false,
    );
    assert.ok(pilotClaim);
    assert.equal(pilotClaim.root, "docs/review/draft/scripts/round-1");
    ProductionWorkflowFixture.write(
      pilotRoot,
      "docs/review/draft/scripts/001-part/001-scene.md",
      review,
    );
    await ProductionWorkflowFixture.certify(pilotRoot, pilot);
    const currentClaim: IEvidenceClaim | undefined = createProductionClaims(
      pilot,
    ).find(
      (claim: IEvidenceClaim): boolean =>
        claim.name?.startsWith("scripts construction review") ?? false,
    );
    assert.ok(currentClaim);
    assert.equal(currentClaim.root, "docs/review/draft/scripts");
    const incomplete: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(pilotRoot, [currentClaim]);
    assert.equal(incomplete.report.success, false);
    assert.ok(
      incomplete.report.diagnostics.some(
        (finding: { code: string }): boolean =>
          finding.code === "graph-missing-acknowledgement",
      ),
    );
  } finally {
    fs.rmSync(root, { recursive: true });
    fs.rmSync(pilotRoot, { recursive: true });
  }
}
