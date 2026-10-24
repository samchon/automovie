import {
  type IProductionClaimOwner,
  type IProductionConfigProps,
  type IProductionPassValidation,
  analyzeProductionPass,
  createProductionConfig,
  getProductionClaimOwners,
} from "@automovie/evidence/narrative";
import type {
  IEvidenceClaim,
  IEvidenceConfig,
  IEvidenceDiagnostic,
} from "@wrtnlabs/evidence";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { ProductionWorkflowFixture } from "../internal/ProductionWorkflowFixture";

/**
 * Complete original graphs can close and cannot inherit stale upstream approval.
 *
 * Scenarios:
 * 1. Four long layers, outline, instructions and both expression passes close.
 * 2. A changed promoted script expires upstream reviews until freshly paired.
 * 3. Disabling or removing that upstream prevents downstream readiness.
 * 4. A short closes directly; a support failure remains globally blocking.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs complete factory configs through analyzeProductionPass with explicit authored units, outline topology, instruction coverage, detached evidence, discovery, expression population duties, current review and verdict populations. It asserts positive readiness, missing outline entry refusal, stale upstream refusal, successful refresh and disabled or empty parent refusal, detecting an implementation that always rejects or silently drops prerequisites.
 * @evidence contracts/testing.md#independent-expectations The four-layer long route and direct short route define the required scope; every synthetic contract has one explicit question answered by a fixed scene. Native graph fingerprints supply opaque review tokens. Clean graph and readiness are structural assertions and do not certify a literary verdict or rendered quality.
 * @evidence contracts/testing.md#distinguishing-cases Positive long and short graphs distinguish route selection; a changed upstream, renewed reviews, disabled stage and absent source distinguish current approval from stale or missing prerequisites. An unrelated support obligation remains blocking even when narrative structure is ready.
 * @evidence contracts/testing.md#execution-ownership The exported test_template_production_complete_pass entry owns both complete temporary productions and their edited snapshots, removes both roots in finally, and evaluates the native Markdown graph in-process without installing consumers or starting processes, browsers or GPUs.
 */
export async function test_template_production_complete_pass(): Promise<void> {
  const root: string = ProductionWorkflowFixture.create();
  const shortRoot: string = ProductionWorkflowFixture.create();
  try {
    const props: IProductionConfigProps = ProductionWorkflowFixture.complete(
      root,
      "long",
    );
    await ProductionWorkflowFixture.certify(root, props);
    const ready: IProductionPassValidation = await analyzeProductionPass(
      createProductionConfig(props),
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(
      ready.packageSuccess,
      true,
      JSON.stringify(ready.analysis.report.diagnostics),
    );
    assert.equal(ready.rereadReady, true, JSON.stringify(ready.scope.issues));
    assert.equal(ready.approvalStructureReady, true);
    const outline: string = path.join(
      root,
      "docs/body/settings/outline/index.md",
    );
    const originalOutline: string = fs.readFileSync(outline, "utf8");
    fs.writeFileSync(
      outline,
      "# Settings outline\n\n## Canon {#canon}\n\nThe arrival entry is missing.\n",
      "utf8",
    );
    assert.throws(
      (): IEvidenceConfig => createProductionConfig(props),
      /outline/i,
    );
    fs.writeFileSync(outline, originalOutline, "utf8");
    for (const area of ["body", "naturalness"]) {
      const file: string = path.join(
        root,
        `docs/${area}/scripts/001-part/001-scene.md`,
      );
      fs.writeFileSync(
        file,
        fs
          .readFileSync(file, "utf8")
          .replace("opens the door", "quietly opens the door"),
        "utf8",
      );
    }
    const stale: IProductionPassValidation = await analyzeProductionPass(
      createProductionConfig(props),
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(stale.rereadReady, false);
    assert.ok(
      stale.blockingDiagnostics.some(
        (finding: IEvidenceDiagnostic): boolean =>
          finding.code === "graph-stale-review",
      ),
    );
    await ProductionWorkflowFixture.certify(root, props);
    const refreshed: IProductionPassValidation = await analyzeProductionPass(
      createProductionConfig(props),
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(
      refreshed.approvalStructureReady,
      true,
      JSON.stringify({
        issues: refreshed.scope.issues,
        diagnostics: refreshed.analysis.report.diagnostics,
      }),
    );
    props.construction.scripts = "disabled";
    const disabled: IProductionPassValidation = await analyzeProductionPass(
      createProductionConfig(props),
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(disabled.rereadReady, false);
    props.construction.scripts = "evidence";
    fs.rmSync(path.join(root, "docs/body/scripts"), {
      recursive: true,
      force: true,
    });
    const empty: IProductionPassValidation = await analyzeProductionPass(
      createProductionConfig(props),
      path.join(root, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(empty.rereadReady, false);

    const shortProps: IProductionConfigProps =
      ProductionWorkflowFixture.complete(shortRoot, "short");
    await ProductionWorkflowFixture.certify(shortRoot, shortProps);
    const shortReady: IProductionPassValidation = await analyzeProductionPass(
      createProductionConfig(shortProps),
      path.join(shortRoot, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(
      shortReady.packageSuccess,
      true,
      JSON.stringify(shortReady.analysis.report.diagnostics),
    );
    assert.equal(
      shortReady.approvalStructureReady,
      true,
      JSON.stringify(shortReady.scope.issues),
    );
    assert.deepEqual(shortReady.scope.requiredPasses, [
      { layer: "screenplay", pass: "construction" },
      { layer: "screenplay", pass: "naturalness" },
    ]);
    ProductionWorkflowFixture.write(
      shortRoot,
      "checks/source.md",
      "# Source\n\n## State\n\nThe task is pending.\n",
    );
    ProductionWorkflowFixture.write(
      shortRoot,
      "checks/requirements.md",
      "# Requirement\n\n## Ready {#ready}\n\nProve the standalone duty.\n",
    );
    const support: IEvidenceClaim = {
      name: "support duty",
      type: "markdown",
      files: ["checks/source.md"],
      symbol: "h2",
      reference: {
        type: "markdown",
        files: ["checks/requirements.md"],
        symbol: "h2",
        noEvidenceExclude: true,
      },
    };
    shortProps.supportClaims = [support];
    const config: IEvidenceConfig = createProductionConfig(shortProps);
    const owner: IProductionClaimOwner | undefined = getProductionClaimOwners(
      config,
    ).find(
      (candidate: IProductionClaimOwner): boolean =>
        candidate.kind === "support",
    );
    assert.ok(owner);
    const failed: IProductionPassValidation = await analyzeProductionPass(
      config,
      path.join(shortRoot, "evidence.config.ts"),
      { layer: "screenplay", pass: "naturalness" },
    );
    assert.equal(failed.rereadReady, false);
    assert.ok(
      failed.blockingDiagnostics.some(
        (finding: IEvidenceDiagnostic): boolean =>
          finding.claim === owner.index,
      ),
    );
    assert.ok(
      failed.frozenDownstreamDiagnostics.every(
        (finding: IEvidenceDiagnostic): boolean =>
          finding.claim !== owner.index,
      ),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(shortRoot, { recursive: true, force: true });
  }
}
