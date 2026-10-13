import {
  renderAutoMovieSemanticMaskSidecar,
} from "@automovie/engine";
import {
  createAutoMovieProductionSemanticMaskReceipt,
} from "@automovie/production";
import {
  TestValidator,
} from "@nestia/e2e";

import { createSemanticMaskEvidenceTestInputs } from "../internal/createSemanticMaskEvidenceTestInputs";

/**
 * Repeated semantic content keeps its own frame identity without changing its resident content digest.
 *
 * Scenarios:
 * 1. A receipt at frame12 differs from frame0.
 * 2. Both frames retain the same semantic payload and exact resident sidecar digest.
 */
export const test_production_semantic_mask_frame_identity = (): void => {
  const { validEvidence, createReceipt, bytes } = createSemanticMaskEvidenceTestInputs();

  const evidence = validEvidence();

  const sidecarBytes = bytes(renderAutoMovieSemanticMaskSidecar(evidence.mask));

  const receipt = createAutoMovieProductionSemanticMaskReceipt({
      frame: 0,
      expectedShot: "opening",
      evidence,
      sidecar: { path: "semantic/opening.mask.json", bytes: sidecarBytes },
    });

  const later = createReceipt({ frame: 12, evidence, sidecarBytes });

  TestValidator.equals(
      "repeated semantic evidence stays content-identical but frame-specific",
      {
        frameMoved: later.frame !== receipt.frame,
        semanticHeld: later.semanticDigest === receipt.semanticDigest,
        sidecarHeld: later.sidecar.digest === receipt.sidecar.digest,
      },
      { frameMoved: true, semanticHeld: true, sidecarHeld: true },
    );
};
