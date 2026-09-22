import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";

/**
 * Evaluate the rest layer of a facial basis: every endpoint row, on surfaces
 * and landmarks alike, before any joint moves.
 *
 * For each vertex p the result is p + sum(|weight| * endpoint) over the
 * channels in basis order, then + sum(activation * corrective target). Shape
 * endpoints are identity; expression endpoints of an articulated basis are
 * rest-space residuals over the articulation, so adding them here and posing
 * afterwards is what makes a smile travel with an opening jaw. Landmarks
 * receive the same rows by endpoint name, which is how a joint follows the
 * shape that moves it; an expression carries no landmark row by admission,
 * so a joint's centre is identity and its motion is articulation.
 *
 * The returned buffers are fresh copies; the basis is never mutated. A
 * surface that carries no row for an endpoint is left where it is, which is
 * how the admission's "every endpoint moves something" rule and a per-surface
 * sparse payload coexist.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Produces the deterministic rest surface that the same document yields regardless of edit order.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Applies `|weight| x endpoint` in channel order, then activation-scaled correctives, to surfaces and landmarks by endpoint name.
 */
export function evaluateHumanFaceRest(
  basis: IAutoMovieHumanFaceBasis,
  state: {
    weights: ReadonlyMap<string, number>;
    activations: readonly { target: string; activation: number }[];
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
  const landmarks: Record<string, IAutoMovieVector3> = {};
  if (basis.landmarks !== undefined) {
    const marks = basis.landmarks.positions.slice();
    shape(marks, basis.landmarks.targets);
    basis.landmarks.ids.forEach((id, i) => {
      landmarks[id] = {
        x: marks[i * 3],
        y: marks[i * 3 + 1],
        z: marks[i * 3 + 2],
      };
    });
  }
  return { surfaces, landmarks };
}
