import {
  type IProductionConfigProps,
  type IProductionGateKey,
  type IProductionPassValidation,
  analyzeProductionPass,
  createProductionConfig,
} from "@automovie/evidence/narrative";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Preparing an empty current review round preserves readiness for its first reader.
 *
 * Scenarios:
 * 1. Every supported pass permits both an absent round and a complete empty round.
 * 2. A review alone or verdict alone permits rereading but cannot complete approval.
 * 3. Invalid UTF-8 in a current review host or its reference remains blocking.
 * 4. Empty current authored work and empty upstream reviews remain blocking.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates complete real Markdown graphs through createProductionConfig and analyzeProductionPass before and after moving the current round, creating an empty round, restoring each review owner separately and restoring both. Readiness, missing owner kinds, preserved native success and complete inactive claims distinguish first-reader preparation from approval. Invalid captured bytes and empty current/upstream populations prevent a blanket inactive-claim exemption.
 * @evidence contracts/testing.md#independent-expectations The public contract permits independent reading before current reviews exist while requiring both current review kinds for approval and completed upstream passes. Fixed fixture bytes supply the authored work; the existing native certification helper supplies opaque fingerprints. No graph or report is fabricated and these structural assertions grant no literary approval.
 * @evidence contracts/testing.md#distinguishing-cases Four construction layers and the screenplay expression pass exercise the same rule with different factory owners. Review-only and verdict-only populations distinguish the two owner kinds; invalid host and reference captures distinguish complete emptiness from unavailable input. Treatments with empty settings reviews and screenplay naturalness with empty construction reviews distinguish upstream ownership across layers and passes. Existing topology, transfer, support and stale-upstream tests own those additional refusals.
 * @evidence contracts/testing.md#execution-ownership The exported async test owns five temporary productions and all mutations, restores individual inputs between negative controls and removes each root in finally. Public native Markdown evaluation stays in process without installation, external processes, browser or GPU, and no foreign method or global is replaced.
 */
export async function test_template_production_first_reread(): Promise<void> {
  const keys: IProductionGateKey[] = [
    { layer: "settings", pass: "construction" },
    { layer: "treatments", pass: "construction" },
    { layer: "scripts", pass: "construction" },
    { layer: "screenplay", pass: "construction" },
    { layer: "screenplay", pass: "naturalness" },
  ];
  for (const key of keys) {
    const root: string = ProductionWorkflowFixture.create();
    try {
      const props: IProductionConfigProps = ProductionWorkflowFixture.complete(
        root,
        "long",
      );
      await ProductionWorkflowFixture.certify(root, props);
      const inspect: () => Promise<IProductionPassValidation> =
        async (): Promise<IProductionPassValidation> =>
          analyzeProductionPass(
            createProductionConfig(props),
            path.join(root, "evidence.config.ts"),
            key,
          );
      const edition: string = key.pass === "construction" ? "draft" : "final";
      const round: string = path.join(
        root,
        `docs/review/${edition}/${key.layer}/round-1`,
      );
      const saved: string = path.join(root, "saved-current-round");
      fs.renameSync(round, saved);
      const absent: IProductionPassValidation = await inspect();
      assert.equal(absent.packageSuccess, true);
      assert.equal(
        absent.rereadReady,
        true,
        JSON.stringify(absent.scope.issues),
      );
      assert.equal(absent.approvalStructureReady, false);
      assert.deepEqual(absent.missingReviewClaims, ["review", "verdict"]);

      fs.mkdirSync(round);
      const empty: IProductionPassValidation = await inspect();
      assert.equal(empty.packageSuccess, true);
      assert.equal(empty.rereadReady, true, JSON.stringify(empty.scope.issues));
      assert.equal(empty.approvalStructureReady, false);
      assert.deepEqual(empty.missingReviewClaims, ["review", "verdict"]);
      assert.deepEqual(empty.scope.issues, []);
      const current: typeof empty.scope.owners = empty.scope.owners.filter(
        (owner: (typeof empty.scope.owners)[number]): boolean =>
          owner.layer === key.layer &&
          owner.pass === key.pass &&
          (owner.kind === "review" || owner.kind === "verdict"),
      );
      assert.equal(current.length, 2);
      for (const owner of current) {
        const claim: (typeof empty.analysis.report.claims)[number] | undefined =
          empty.analysis.report.claims.find(
            (entry: (typeof empty.analysis.report.claims)[number]): boolean =>
              entry.claim === owner.index,
          );
        assert.ok(claim);
        assert.equal(claim.active, false);
        assert.equal(claim.complete, true);
        for (const obligation of claim.obligations) {
          assert.equal(obligation.active, false);
          assert.equal(obligation.complete, true);
        }
      }
      const file: string =
        key.layer === "settings" || key.layer === "treatments"
          ? "001-event.md"
          : "001-part/001-scene.md";
      const reviewFile: string = path.join(round, file);
      fs.mkdirSync(path.dirname(reviewFile), { recursive: true });
      fs.copyFileSync(path.join(saved, file), reviewFile);
      const reviewOnly: IProductionPassValidation = await inspect();
      assert.equal(reviewOnly.rereadReady, true);
      assert.equal(reviewOnly.approvalStructureReady, false);
      assert.deepEqual(reviewOnly.missingReviewClaims, ["verdict"]);
      fs.rmSync(reviewFile);
      const verdictFile: string = path.join(round, "verdict/index.md");
      fs.mkdirSync(path.dirname(verdictFile), { recursive: true });
      fs.copyFileSync(path.join(saved, "verdict/index.md"), verdictFile);
      const verdictOnly: IProductionPassValidation = await inspect();
      assert.equal(verdictOnly.rereadReady, true);
      assert.equal(verdictOnly.approvalStructureReady, false);
      assert.deepEqual(verdictOnly.missingReviewClaims, ["review"]);
      fs.copyFileSync(path.join(saved, file), reviewFile);
      const complete: IProductionPassValidation = await inspect();
      assert.equal(complete.approvalStructureReady, true);

      if (key.layer === "screenplay" && key.pass === "naturalness") {
        fs.writeFileSync(reviewFile, Buffer.from([0xff]));
        const badHost: IProductionPassValidation = await inspect();
        assert.equal(badHost.rereadReady, false);
        assert.equal(badHost.approvalStructureReady, false);
        assert.ok(
          badHost.analysis.graphInput.claims.some(
            (
              claim: (typeof badHost.analysis.graphInput.claims)[number],
            ): boolean =>
              current.some(
                (owner: (typeof current)[number]): boolean =>
                  owner.kind === "review" && owner.index === claim.index,
              ) && !claim.inventory.complete,
          ),
        );
        fs.copyFileSync(path.join(saved, file), reviewFile);

        // Reference capture remains mandatory even with no current review hosts.
        fs.rmSync(reviewFile);
        fs.rmSync(verdictFile);
        const reference: string = path.join(
          root,
          ".agents/skills/contracts/story/shared/principles/review.md",
        );
        const referenceBytes: Buffer = fs.readFileSync(reference);
        fs.writeFileSync(reference, Buffer.from([0xff]));
        const badReference: IProductionPassValidation = await inspect();
        assert.equal(badReference.rereadReady, false);
        assert.equal(badReference.approvalStructureReady, false);
        assert.ok(
          badReference.analysis.graphInput.claims.some(
            (
              claim: (typeof badReference.analysis.graphInput.claims)[number],
            ): boolean =>
              current.some(
                (owner: (typeof current)[number]): boolean =>
                  owner.kind === "review" && owner.index === claim.index,
              ) &&
              claim.references.some(
                (reference: (typeof claim.references)[number]): boolean =>
                  !reference.inventory.complete,
              ),
          ),
        );
        fs.writeFileSync(reference, referenceBytes);
        const authored: string = path.join(
          root,
          `docs/naturalness/${key.layer}/${file}`,
        );
        const authoredBytes: Buffer = fs.readFileSync(authored);
        fs.writeFileSync(authored, "# Empty working file\n");
        const emptyAuthored: IProductionPassValidation = await inspect();
        assert.equal(emptyAuthored.rereadReady, false);
        assert.equal(emptyAuthored.approvalStructureReady, false);
        assert.ok(
          emptyAuthored.scope.issues.some((issue: string): boolean =>
            issue.includes("has no active authored population"),
          ),
        );
        fs.writeFileSync(authored, authoredBytes);
      }

      if (
        (key.layer === "treatments" && key.pass === "construction") ||
        (key.layer === "screenplay" && key.pass === "naturalness")
      ) {
        const upstreamLayer: string =
          key.layer === "treatments" ? "settings" : "screenplay";
        const upstream: string = path.join(
          root,
          `docs/review/draft/${upstreamLayer}/round-1`,
        );
        fs.renameSync(upstream, path.join(root, "saved-upstream-round"));
        fs.mkdirSync(upstream);
        const emptyUpstream: IProductionPassValidation = await inspect();
        assert.equal(emptyUpstream.packageSuccess, true);
        assert.equal(emptyUpstream.rereadReady, false);
        assert.equal(emptyUpstream.approvalStructureReady, false);
        assert.ok(
          emptyUpstream.scope.issues.some(
            (issue: string): boolean =>
              issue.includes("Required upstream pass") &&
              issue.includes("has no active review"),
          ),
        );
      }
    } finally {
      fs.rmSync(root, { recursive: true });
    }
  }
}
