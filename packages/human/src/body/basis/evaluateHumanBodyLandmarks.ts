import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { applyHumanBodyShapeRows } from "./applyHumanBodyShapeRows";

/**
 * The basis's landmarks after a document's channels and correctives, without
 * shaping any skin.
 *
 * Landmarks are the joints' source, so this is all the shaped rest skeleton
 * needs, at the cost of a few hundred rows instead of every surface's. The
 * rows are applied by `applyHumanBodyShapeRows`, the same owner the skin
 * uses, to a copy of the basis positions, and the basis is never mutated.
 * Positions are metres in the builder's Y-up, Z-forward, +X-left frame.
 */
export function evaluateHumanBodyLandmarks(
  basis: Pick<IAutoMovieHumanBodyBasis, "channels" | "landmarks">,
  state: {
    weights: ReadonlyMap<string, number>;
    activations: readonly { target: string; activation: number }[];
  },
): Record<string, IAutoMovieVector3> {
  const marks = basis.landmarks.positions.slice();
  applyHumanBodyShapeRows(basis, state, marks, basis.landmarks.targets);
  const landmarks: Record<string, IAutoMovieVector3> = {};
  basis.landmarks.ids.forEach((id, i) => {
    landmarks[id] = {
      x: marks[i * 3],
      y: marks[i * 3 + 1],
      z: marks[i * 3 + 2],
    };
  });
  return landmarks;
}
