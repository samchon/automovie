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
 * @evidence contracts/testing.md#behavioral-verification Classifies zero-gap evidence, creates its receipt from canonical sidecar bytes and reopens the same shot/frame/path/bytes; explicit receipt fields and successful verification expose wrong content or correspondence.
 * @evidence contracts/testing.md#independent-expectations Authored opening/frame-zero/mask identity and zero coverage define the receipt metadata, while native node:crypto SHA-256 and byteLength independently check the exact sidecar bytes; sidecar text and semantic digest still come from engine owners and no pixel output is observed.
 * @evidence contracts/testing.md#distinguishing-cases Owns the fully admitted zero-gap receipt and exact reopen; malformed keys, stale identities, byte drift and nonzero runtime gaps belong to adjacent semantic tests rather than being implied by this positive witness.
 * @evidence contracts/testing.md#execution-ownership The named discoverable portable unit uses in-memory resident bytes and CPU hashing, with no actual file reopening, browser capture, GPU or dynamic registrations.
 *
 * Scenarios:
 * 1. The current observation classifies complete and reopens at the exact frame and shot.
 * 2. Independent native SHA256 and byte length agree with the receipt's resident sidecar binding.
 */
export function test_production_semantic_mask_evidence(): void {
  const { validEvidence, bytes }: ReturnType<typeof createSemanticMaskEvidenceTestInputs> = createSemanticMaskEvidenceTestInputs();

  const evidence: ReturnType<typeof validEvidence> = validEvidence();

  const sidecarBytes: Uint8Array = bytes(renderAutoMovieSemanticMaskSidecar(evidence.mask));

  const observation: Parameters<typeof classifyAutoMovieProductionSemanticMaskEvidence>[0]["observation"] = { status: "available", value: evidence } as const;

  const complete: ReturnType<typeof classifyAutoMovieProductionSemanticMaskEvidence> = classifyAutoMovieProductionSemanticMaskEvidence({
      observation,
      expectedShot: "opening",
    });

  const receipt: ReturnType<typeof createAutoMovieProductionSemanticMaskReceipt> = createAutoMovieProductionSemanticMaskReceipt({
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
}
