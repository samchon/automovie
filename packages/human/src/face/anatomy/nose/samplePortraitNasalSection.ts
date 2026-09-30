import { IPortraitNasalJet } from "./structures/IPortraitNasalJet";

/**
 * Interpolate two complete section jets with one cubic Hermite polynomial.
 * Parameter t is dimensionless in [0,1]; span is the positive physical interval
 * in mm. Both neighbours use the same jet at their shared end, so position and
 * first derivative have one owner. Reversing a section requires reversing its
 * derivative signs as well as swapping endpoints.
 *
 * The value uses the equivalent four Bernstein controls and convex de Casteljau
 * evaluation. Its domain is their convex hull, not merely the endpoint box:
 * authored tangents can intentionally form a rounded shoulder between ends.
 * The returned derivative is with respect to physical distance, not t. Exact
 * endpoint returns avoid arithmetic moving a shared seam. Nonrepresentable
 * controls or derivatives refuse rather than emitting a broken surface.
 *
 * @evidence contracts/common.md#principled-implementation A cubic Hermite segment equals the cubic Bezier with controls P0, P0+span*d0/3, P1-span*d1/3, P1 (exact identity), and de Casteljau evaluation is a convex combination that cannot leave the control hull; the per-mix clamp only removes floating rounding beyond the endpoint interval. The returned derivative 3(q1-q0)/span is the derivative with respect to physical distance because span converts the unit parameter. Non-finite or oversized controls refuse instead of emitting a broken surface.
 * @evidence contracts/common.md#clear-and-simple-design One cubic segment evaluator shared by every nasal section, jet and entry; endpoints return the input jets exactly so neighbours share one owner of a seam.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is special-cased; the result is a function of the two jets, the span and the parameter.
 * @evidence contracts/common.md#meaningful-documentation The comment states the parameter and span units, the Bernstein equivalence, the hull-not-box domain, the derivative convention and the refusals.
 * @evidence contracts/modeling.md#spatial-conventions Positions and derivatives are in the caller's millimetre frame; the parameter is dimensionless in [0,1] and span is millimetres, so derivative is per millimetre.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group; it is a numerical helper of the nasal section owner.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no mesh primitives; it returns values for its caller to place.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part; the callers that share its result own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part or joint; the nose component that consumes it is the declaration that observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value, range or proportion of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity; callers admit theirs.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is arithmetic on values its owner already named, not an input through which a caller shapes a human form.
 */
export function samplePortraitNasalSection(
  left: IPortraitNasalJet,
  right: IPortraitNasalJet,
  span: number,
  t: number,
): { point: number[]; derivative: number[] } {
  if (
    !Number.isFinite(span) ||
    span <= 0 ||
    !Number.isFinite(t) ||
    t < 0 ||
    t > 1 ||
    [left.point, left.derivative, right.point, right.derivative].some(
      (p) => p.length !== 3 || !p.every(Number.isFinite),
    )
  )
    throw new Error(
      "A nasal section needs finite XYZ jets, positive span and a unit parameter.",
    );
  if (t === 0)
    return { point: [...left.point], derivative: [...left.derivative] };
  if (t === 1)
    return { point: [...right.point], derivative: [...right.derivative] };
  const offset = (derivative: number): number => {
    const product = span * derivative;
    return Number.isFinite(product) ? product / 3 : (span / 3) * derivative;
  };
  const controls = [
    [...left.point],
    left.point.map((value, axis) => value + offset(left.derivative[axis])),
    right.point.map((value, axis) => value - offset(right.derivative[axis])),
    [...right.point],
  ];
  if (controls.some((p) => !p.every(Number.isFinite)))
    throw new Error(
      "Nasal section tangent controls exceed the finite coordinate domain.",
    );
  // A convex mix cannot leave its endpoint interval; keep that mathematical
  // bound even when floating addition rounds just beyond the larger endpoint.
  const mix = (a: number, b: number): number =>
    Math.max(Math.min(a, b), Math.min(Math.max(a, b), (1 - t) * a + t * b));
  const first = [0, 1, 2].map((i) =>
    controls[i].map((value, axis) => mix(value, controls[i + 1][axis])),
  );
  const second = [0, 1].map((i) =>
    first[i].map((value, axis) => mix(value, first[i + 1][axis])),
  );
  const point = second[0].map((value, axis) => mix(value, second[1][axis]));
  const derivative = second[0].map(
    (value, axis) => 3 * ((second[1][axis] - value) / span),
  );
  if (!derivative.every(Number.isFinite))
    throw new Error(
      "Nasal section derivative exceeds the finite coordinate domain.",
    );
  return { point, derivative };
}
