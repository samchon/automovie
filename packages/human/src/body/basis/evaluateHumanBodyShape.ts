import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { applyHumanBodyShapeRows } from "./applyHumanBodyShapeRows";
import { evaluateHumanBodyLandmarks } from "./evaluateHumanBodyLandmarks";

/**
 * Evaluate named channels and correctives over their resident skin and landmark rows.
 *
 * For each vertex p the result is p + sum(abs(weight) * endpoint) +
 * sum(activation * corrective target), in that order. Landmark rows are
 * applied when an endpoint declares them, so those authored shape channels
 * move their joints with the skin. Per-person vertex rows are not a document
 * input.
 *
 * The returned buffers are fresh copies; the basis is never mutated. A surface
 * that carries no row for an endpoint is left where it is, which is how the
 * admission's "every endpoint moves something" rule and a per-surface sparse
 * payload coexist.
 *
 */
export function evaluateHumanBodyShape(
  basis: IAutoMovieHumanBodyBasis,
  state: {
    weights: Map<string, number>;
    activations: { target: string; activation: number }[];
  },
): { surfaces: number[][]; landmarks: Record<string, IAutoMovieVector3> } {
  const surfaces = basis.surfaces.map((surface) => {
    const positions = surface.positions.slice();
    applyHumanBodyShapeRows(basis, state, positions, surface.targets);
    return positions;
  });
  return { surfaces, landmarks: evaluateHumanBodyLandmarks(basis, state) };
}
