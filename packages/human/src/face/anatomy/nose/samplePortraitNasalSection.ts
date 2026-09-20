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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Joins complete nasal section jets without independently fitting neighboring seam derivatives.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Evaluates the equivalent cubic Bernstein controls with convex de Casteljau interpolation, exact endpoints and finite physical derivatives.
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
