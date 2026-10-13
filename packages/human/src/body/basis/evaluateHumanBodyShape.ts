import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { applyHumanBodyShapeRows } from "./applyHumanBodyShapeRows";
import { evaluateHumanBodyLandmarks } from "./evaluateHumanBodyLandmarks";

/**
 * Evaluate named channels and correctives over their resident skin and landmark rows.
 *
 * Each vertex receives p + sum(abs(weight) * endpoint) + sum(activation * corrective target), in that order. Declared landmark rows move their joints with the same authored channels. Per-person vertex rows are not a document input.
 *
 * Returned buffers are fresh copies and never mutate the basis. A surface without a local endpoint row stays unchanged: admission requires each endpoint to move something, rather than requiring every surface to carry every endpoint.
 *
 * @evidence contracts/common.md#principled-implementation Fresh copies of each resident skin surface and named landmarks receive the same ordered sparse channel/corrective sum, preserving endpoint-owner correspondence.
 * @evidence contracts/common.md#clear-and-simple-design Full shape evaluation composes shared skin accumulation and landmark evaluation without adding per-person vertex controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A surface without local rows stays unchanged, while declared availability failures remain accumulator-owned rather than synthesized missing geometry.
 * @evidence contracts/common.md#meaningful-documentation The prose gives the authored sum, source-copy ownership, sparse per-surface omission and joint movement matching skin.
 * @evidence contracts/performance.md#efficient-algorithms Copying V skin vertices and L landmarks costs O(V+L), plus active sparse rows; each surface requires its own buffer so source geometry remains immutable.
 * @evidence contracts/performance.md#reuse-equivalent-work Skin and landmark consumers share the row operation, while the owning builder decides whether an equivalent complete shape may be reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh position arrays and landmark vectors escape as one output; temporary row plans expire and no source buffer or external task is retained.
 */
export function evaluateHumanBodyShape(
  basis: IAutoMovieHumanBodyBasis,
  state: {
    weights: Map<string, number>;
    activations: { target: string; activation: number }[];
  },
): { surfaces: number[][]; landmarks: Record<string, IAutoMovieVector3> } {
  const surfaces: number[][] = basis.surfaces.map((surface: IAutoMovieHumanBodyBasis["surfaces"][number]): number[] => {
    const positions: number[] = surface.positions.slice();
    applyHumanBodyShapeRows(basis, state, positions, surface.targets);
    return positions;
  });
  return { surfaces, landmarks: evaluateHumanBodyLandmarks(basis, state) };
}
