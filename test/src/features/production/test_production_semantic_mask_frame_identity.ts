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
 * @evidence contracts/testing.md#behavioral-verification Creates receipts for frame zero and twelve from identical evidence/sidecar bytes, asserting changed frame identity and equal semantic/resident digests; catches frame-independent receipts or content identity contaminated by frame.
 * @evidence contracts/testing.md#independent-expectations Identical supplied palette/bytes should retain their digests while authored integer frames differ; these are metamorphic identity relations, not an independent hash vector, exact asserted frame value or observed captured pixels.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the two distinct frames over identical content; malformed frame, foreign shot, altered bytes and receipt reopening are owned by adjacent semantic tests.
 * @evidence contracts/testing.md#execution-ownership The named discoverable portable unit calls receipt creation and canonical sidecar rendering on memory records only, without a real capture, filesystem, GPU or dynamic registration.
 *
 * Scenarios:
 * 1. A receipt at frame12 differs from frame0.
 * 2. Both frames retain the same semantic payload and exact resident sidecar digest.
 */
export function test_production_semantic_mask_frame_identity(): void {
  const { validEvidence, createReceipt, bytes }: ReturnType<typeof createSemanticMaskEvidenceTestInputs> = createSemanticMaskEvidenceTestInputs();

  const evidence: ReturnType<typeof validEvidence> = validEvidence();

  const sidecarBytes: Uint8Array = bytes(renderAutoMovieSemanticMaskSidecar(evidence.mask));

  const receipt: ReturnType<typeof createAutoMovieProductionSemanticMaskReceipt> = createAutoMovieProductionSemanticMaskReceipt({
      frame: 0,
      expectedShot: "opening",
      evidence,
      sidecar: { path: "semantic/opening.mask.json", bytes: sidecarBytes },
    });

  const later: ReturnType<typeof createReceipt> = createReceipt({ frame: 12, evidence, sidecarBytes });

  TestValidator.equals(
      "repeated semantic evidence stays content-identical but frame-specific",
      {
        frameMoved: later.frame !== receipt.frame,
        semanticHeld: later.semanticDigest === receipt.semanticDigest,
        sidecarHeld: later.sidecar.digest === receipt.sidecar.digest,
      },
      { frameMoved: true, semanticHeld: true, sidecarHeld: true },
    );
}
