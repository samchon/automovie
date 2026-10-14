import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { applyHumanBodyShapeRows } from "./applyHumanBodyShapeRows";

/**
 * The basis's landmarks after a document's channels and correctives, without shaping any skin.
 *
 * Landmarks are the joints' source, so this is all the shaped rest skeleton needs, without evaluating every surface's rows. The rows are applied by `applyHumanBodyShapeRows`, the same owner the skin uses, to a copy of the basis positions, and the basis is never mutated. Positions are metres in the builder's Y-up, Z-forward, +X-left frame.
 *
 * @evidence contracts/common.md#principled-implementation Copied source landmark coordinates receive the shared ordered sparse channel/corrective sum and return named meter vectors without evaluating skin surfaces.
 * @evidence contracts/common.md#clear-and-simple-design Landmark-only evaluation serves shaped rig preparation while sharing displacement semantics with full skin evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Landmarks retain their source owner rather than being re-inferred from skin, and the caller's source coordinates remain unchanged.
 * @evidence contracts/common.md#meaningful-documentation The prose gives source/frame ownership, skin-independent scope and shared row/copy behavior.
 * @evidence contracts/performance.md#efficient-algorithms Copying and mapping L landmarks costs O(L), plus active sparse landmark rows and channel planning; it avoids all V skin vertices when only a rig is needed.
 * @evidence contracts/performance.md#reuse-equivalent-work The same row accumulator as skin preserves displacement identity; this entry does not cache varying shape states across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One copied coordinate array is temporary and L new named vectors escape; the basis and shape state are borrowed without retained tasks.
 */
export function evaluateHumanBodyLandmarks(
  basis: Pick<IAutoMovieHumanBodyBasis, "channels" | "landmarks">,
  state: {
    weights: ReadonlyMap<string, number>;
    activations: readonly { target: string; activation: number }[];
  },
): Record<string, IAutoMovieVector3> {
  const marks: number[] = basis.landmarks.positions.slice();
  applyHumanBodyShapeRows(basis, state, marks, basis.landmarks.targets);
  const landmarks: Record<string, IAutoMovieVector3> = {};
  basis.landmarks.ids.forEach((id: string, i: number): void => {
    landmarks[id] = {
      x: marks[i * 3],
      y: marks[i * 3 + 1],
      z: marks[i * 3 + 2],
    };
  });
  return landmarks;
}
