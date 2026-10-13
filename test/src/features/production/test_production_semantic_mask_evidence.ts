import {
  renderAutoMovieSemanticMaskSidecar,
} from "@automovie/engine";
import {
  classifyAutoMovieProductionSemanticMaskEvidence,
  createAutoMovieProductionSemanticMaskReceipt,
  verifyAutoMovieProductionSemanticMaskReceipt,
} from "@automovie/production";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  createHash,
} from "node:crypto";

import { createSemanticMaskEvidenceTestInputs } from "../internal/createSemanticMaskEvidenceTestInputs";

/**
 * Current palette, shot and zero-gap runtime coverage bind one exact resident sidecar receipt.
 *
 * Scenarios:
 * 1. The current observation classifies complete and reopens at the exact frame and shot.
 * 2. Independent native SHA256 and byte length agree with the receipt's resident sidecar binding.
 */
export const test_production_semantic_mask_evidence = (): void => {
  const { validEvidence, bytes } = createSemanticMaskEvidenceTestInputs();

  const evidence = validEvidence();

  const sidecarBytes = bytes(renderAutoMovieSemanticMaskSidecar(evidence.mask));

  const observation = { status: "available", value: evidence } as const;

  const complete = classifyAutoMovieProductionSemanticMaskEvidence({
      observation,
      expectedShot: "opening",
    });

  const receipt = createAutoMovieProductionSemanticMaskReceipt({
      frame: 0,
      expectedShot: "opening",
      evidence,
      sidecar: { path: "semantic/opening.mask.json", bytes: sidecarBytes },
    });

  TestValidator.equals(
      "current zero-gap evidence is complete and receipt-bound",
      {
        status: complete.status,
        verified: verifyAutoMovieProductionSemanticMaskReceipt({
          receipt,
          expectedFrame: 0,
          expectedShot: "opening",
          evidence,
          resident: {
            path: "semantic/opening.mask.json",
            bytes: sidecarBytes,
          },
        }),
        receipt,
      },
      {
        status: "complete",
        verified: undefined,
        receipt: {
          version: 1,
          frame: 0,
          pass: "mask",
          shot: "opening",
          sidecar: {
            path: "semantic/opening.mask.json",
            digest: `sha256:${createHash("sha256")
              .update(sidecarBytes)
              .digest("hex")}`,
            bytes: sidecarBytes.byteLength,
          },
          semanticDigest: evidence.mask.digest,
          coverage: { unresolved: [], unaddressed: 0 },
        },
      },
    );
};
