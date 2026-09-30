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
 * sparse payload coexist. Channels named in `except` are skipped, which is
 * how a contact basis holds its closure channel back for the aperture-scaled
 * pass; their correctives still activate on the raw weights.
 *
 * @evidence contracts/common.md#principled-implementation The rest layer is p + sum |w| * endpoint over the channels in basis order plus activation * corrective, with the negative endpoint used for a negative weight; it is linear in the weights, order independent in exact arithmetic, and the rows are sparse so an absent row leaves a vertex where it is. Landmarks receive the same rows so a joint follows the shape that moves it.
 * @evidence contracts/common.md#clear-and-simple-design One accumulate function applied to surfaces and to landmarks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case; `except` names channels held back for a documented aperture-scaled pass.
 * @evidence contracts/common.md#meaningful-documentation States the formula, the treatment of expression endpoints on an articulated basis and the fresh-copy rule.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres in the Y-up +Z-anterior head frame, unchanged.
 * @evidenceExclude contracts/anatomy.md#anatomical-source evaluateHumanFaceRest carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range evaluateHumanFaceRest admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority evaluateHumanFaceRest defines no input through which a caller shapes a human form.
 */
export function evaluateHumanFaceRest(
  basis: IAutoMovieHumanFaceBasis,
  state: {
    weights: ReadonlyMap<string, number>;
    activations: readonly { target: string; activation: number }[];
  },
  except: ReadonlySet<string> = new Set(),
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
      if (weight === 0 || except.has(channel.id)) continue;
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
