import {
  renderAutoMovieSemanticMaskSidecar,
} from "@automovie/engine";
import {
  IAutoMovieProductionRenderChunkReceipt,
  createAutoMovieProductionSemanticMaskReceipt,
  productionRenderChunkStatuses,
  verifyProductionRenderChunkReceipt,
} from "@automovie/production";
import type {
  IAutoMovieProductionRenderChunk,
  IAutoMovieProductionRenderJobPlan,
} from "@automovie/render";
import {
  TestValidator,
} from "@nestia/e2e";

import { createSemanticMaskEvidenceTestInputs } from "../internal/createSemanticMaskEvidenceTestInputs";

/**
 * Mask chunk completion requires a current complete semantic receipt for each scheduled mask layer.
 *
 * Scenarios:
 * 1. The valid receipt verifies and the chunk becomes complete.
 * 2. Historical, missing or incomplete semantic receipts, including ordered unresolved gaps, make the same chunk failed.
 */
export const test_production_semantic_mask_chunk_completion = (): void => {
  const { validEvidence, bytes, digest } = createSemanticMaskEvidenceTestInputs();

  const evidence = validEvidence();

  const sidecarBytes = bytes(renderAutoMovieSemanticMaskSidecar(evidence.mask));

  const receipt = createAutoMovieProductionSemanticMaskReceipt({
      frame: 0,
      expectedShot: "opening",
      evidence,
      sidecar: { path: "semantic/opening.mask.json", bytes: sidecarBytes },
    });

  const chunk = {
      slot: "mask/00000000-00000001",
      id: digest("a"),
      deliverable: "semantic-guide",
      kind: "guide-pass",
      pass: "mask",
      frameStart: 0,
      frameEndExclusive: 1,
      frames: [
        {
          globalFrame: 0,
          timelineFrame: 0,
          timeSeconds: 0,
          layers: [{ shot: "opening", sourceFrame: 0, weight: 1 }],
        },
      ],
    } satisfies IAutoMovieProductionRenderChunk;

  const plan = {
      frameFormat: { width: 16, height: 16, fps: 24 },
      chunks: [chunk],
    } as unknown as IAutoMovieProductionRenderJobPlan;

  const chunkReceipt = {
      version: 2,
      slot: chunk.slot,
      chunk: chunk.id,
      frames: [
        {
          globalFrame: 0,
          path: "frame_00000000.mask.png",
          digest: digest("b"),
          bytes: 1,
          width: 16,
          height: 16,
        },
      ],
      semanticMasks: [receipt],
      encoded: { path: "chunk.mp4", digest: digest("c"), bytes: 1 },
    } satisfies IAutoMovieProductionRenderChunkReceipt;

  TestValidator.equals(
      "chunk completion requires one complete semantic receipt per mask layer",
      {
        verified: verifyProductionRenderChunkReceipt({
          plan,
          chunk,
          receipt: chunkReceipt,
        }),
        status: productionRenderChunkStatuses({
          plan,
          receipts: [chunkReceipt],
          attempts: [],
        })[0]!.status,
        historical: productionRenderChunkStatuses({
          plan,
          receipts: [{ ...chunkReceipt, version: 1 } as never],
          attempts: [],
        })[0]!.status,
        missing: productionRenderChunkStatuses({
          plan,
          receipts: [{ ...chunkReceipt, semanticMasks: [] }],
          attempts: [],
        })[0]!.status,
        incomplete: productionRenderChunkStatuses({
          plan,
          receipts: [
            {
              ...chunkReceipt,
              semanticMasks: [
                {
                  ...receipt,
                  coverage: { unresolved: ["node:missing"], unaddressed: 0 },
                },
              ],
            },
          ],
          attempts: [],
        })[0]!.status,
        orderedGaps: productionRenderChunkStatuses({
          plan,
          receipts: [
            {
              ...chunkReceipt,
              semanticMasks: [
                {
                  ...receipt,
                  coverage: {
                    unresolved: ["node:first", "node:second"],
                    unaddressed: 0,
                  },
                },
              ],
            },
          ],
          attempts: [],
        })[0]!.status,
      },
      {
        verified: undefined,
        status: "complete",
        historical: "failed",
        missing: "failed",
        incomplete: "failed",
        orderedGaps: "failed",
      },
    );
};
