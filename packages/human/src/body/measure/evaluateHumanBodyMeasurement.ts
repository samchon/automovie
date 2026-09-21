import { Vector3 } from "@automovie/engine";

import { evaluateHumanBodyShape } from "../basis/evaluateHumanBodyShape";
import { humanBodyBasisWeights } from "../basis/humanBodyBasisWeights";
import { humanBodyClipRing } from "../simple/humanBodyClipRing";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";
import { measureHumanBodySection } from "./measureHumanBodySection";

/**
 * Evaluate one measurement rule on a shaped body, in metres, or null when the
 * surface cannot answer it.
 *
 * The shape is evaluated through the same `humanBodyBasisWeights` and
 * `evaluateHumanBodyShape` the builder uses, without a pose, so the value is
 * the value the built body has at rest. A `height` reads from the surface's
 * lowest point to the mean of its clip ring; a `distance` is the straight
 * landmark-to-landmark length; a `girth` or `breadth` walks the rule's
 * stations, cuts the surface at each and keeps the largest or smallest closed
 * section as the rule picks. A landmark the basis lacks, or a station set on
 * which no closed loop exists, answers null. This is the instrument the
 * channel measurement report and the simple tier's inversions share.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Computes a rule's value on the shaped surface, the number the editor prints and the simple tier solves against.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Realizes the three rule kinds, the station walk and the null answers the specification lists.
 */
export function evaluateHumanBodyMeasurement(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
  rule: IAutoMovieHumanBodyMeasurement,
): number | null {
  const shaped = evaluateHumanBodyShape(
    basis,
    humanBodyBasisWeights(basis, { shape }),
    undefined,
  );
  if (rule.kind === "height") {
    const positions = shaped.surfaces[0];
    const ring = humanBodyClipRing(basis.surfaces[0]);
    let lowest = Infinity;
    for (let v = 1; v < positions.length; v += 3)
      lowest = Math.min(lowest, positions[v]);
    const top =
      ring.reduce((sum, v) => sum + positions[v * 3 + 1], 0) / ring.length;
    return top - lowest;
  }
  const from = shaped.landmarks[rule.from];
  const to = shaped.landmarks[rule.to];
  if (from === undefined || to === undefined) return null;
  if (rule.kind === "distance")
    return Vector3.length(Vector3.subtract(to, from));
  const axis = Vector3.subtract(to, from);
  const normal = rule.horizontal
    ? Vector3.create(0, 1, 0)
    : Vector3.normalize(axis);
  let chosen: number | null = null;
  for (let step = 0; step < rule.steps; step++) {
    const fraction =
      rule.range[0] +
      (rule.steps === 1
        ? 0
        : (step * (rule.range[1] - rule.range[0])) / (rule.steps - 1));
    const point = Vector3.add(from, Vector3.scale(axis, fraction));
    const section = measureHumanBodySection(
      shaped.surfaces[0],
      basis.surfaces[0].indices,
      { point, normal },
      point,
    );
    if (section === null) continue;
    const value = rule.kind === "breadth" ? section.breadth : section.perimeter;
    if (
      chosen === null ||
      (rule.pick === "max" ? value > chosen : value < chosen)
    )
      chosen = value;
  }
  return chosen;
}
