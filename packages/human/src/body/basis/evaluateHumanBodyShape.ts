import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

/**
 * Evaluate named channels and correctives on skin and landmarks alike.
 *
 * For each vertex p the result is p + sum(abs(weight) * endpoint) +
 * sum(activation * corrective target), in that order. The same named endpoint
 * and corrective rows apply to landmarks, so the joint follows authored shape
 * channels. Per-person vertex rows are not a document input.
 *
 * The returned buffers are fresh copies; the basis is never mutated. A surface
 * that carries no row for an endpoint is left where it is, which is how the
 * admission's "every endpoint moves something" rule and a per-surface sparse
 * payload coexist.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Produces the deterministic shaped surface and landmarks that the same document yields regardless of edit order.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Applies `|weight| x endpoint`, then activation-scaled correctives, to surfaces and landmarks by endpoint name.
 */
export function evaluateHumanBodyShape(
  basis: IAutoMovieHumanBodyBasis,
  state: {
    weights: Map<string, number>;
    activations: { target: string; activation: number }[];
  },
): { surfaces: number[][]; landmarks: Record<string, IAutoMovieVector3> } {
  const accumulate = (
    positions: number[],
    targets: Record<string, number[]>,
    name: string,
    gain: number,
  ): void => {
    const rows = targets[name];
    if (rows === undefined) return;
    for (let i = 0; i < rows.length; i += 4)
      for (let axis = 0; axis < 3; axis++)
        positions[rows[i] * 3 + axis] += gain * rows[i + axis + 1];
  };
  const shape = (
    positions: number[],
    targets: Record<string, number[]>,
  ): void => {
    for (const channel of basis.channels) {
      const weight = state.weights.get(channel.id) ?? 0;
      if (weight === 0) continue;
      accumulate(
        positions,
        targets,
        weight < 0 ? channel.negative! : channel.positive,
        Math.abs(weight),
      );
    }
    for (const corrective of state.activations)
      if (corrective.activation > 0)
        accumulate(
          positions,
          targets,
          corrective.target,
          corrective.activation,
        );
  };
  const surfaces = basis.surfaces.map((surface) => {
    const positions = surface.positions.slice();
    shape(positions, surface.targets);
    return positions;
  });
  const marks = basis.landmarks.positions.slice();
  shape(marks, basis.landmarks.targets);
  const landmarks: Record<string, IAutoMovieVector3> = {};
  basis.landmarks.ids.forEach((id, i) => {
    landmarks[id] = {
      x: marks[i * 3],
      y: marks[i * 3 + 1],
      z: marks[i * 3 + 2],
    };
  });
  return { surfaces, landmarks };
}
