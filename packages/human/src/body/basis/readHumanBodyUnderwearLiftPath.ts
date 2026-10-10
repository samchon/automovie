import { HumanExactFraction as Fraction } from "../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../common/measure/IHumanExactFraction";
import type { IHumanBodyUnderwearLiftPath } from "./IHumanBodyUnderwearLiftPath";
import type { IHumanBodyUnderwearLiftPathInput } from "./IHumanBodyUnderwearLiftPathInput";

/**
 * Exact minimum of A(s) dot N_corner for the declared affine-normal lift.
 *
 * Internal callers satisfy IHumanBodyUnderwearLiftPathInput's validated face,
 * corner and finite signed-offset preconditions; this owner does not admit a
 * second public authoring input or reinterpret an invalid caller as geometry.
 *
 * The represented base coordinates and returned normals define a quadratic in
 * signed metres. Rational coefficients and comparisons retain the existing
 * strict-sign policy. Every tied endpoint and interior stationary minimum is
 * retained for the analytic fitting model. Constant quadratics also identify
 * their continuum of minimizers; two endpoint witnesses do not imply that its
 * directional derivative has no interior minimum.
 */
export function readHumanBodyUnderwearLiftPath(
  input: IHumanBodyUnderwearLiftPathInput,
): IHumanBodyUnderwearLiftPath {
  const { points: q, normals, corner, offsetMetres: offset } = input;
  const points = q.map((point) => point.map((value) => Fraction.from(value)));
  const n = normals.map((normal) => normal.map((value) => Fraction.from(value)));
  const e1 = points[1].map((value, k) => Fraction.subtract(value, points[0][k]));
  const e2 = points[2].map((value, k) => Fraction.subtract(value, points[0][k]));
  const d1 = n[1].map((value, k) => Fraction.subtract(value, n[0][k]));
  const d2 = n[2].map((value, k) => Fraction.subtract(value, n[0][k]));
  const coefficients = [
    exactDot(exactCross(e1, e2), n[corner]),
    Fraction.add(exactDot(exactCross(e1, d2), n[corner]), exactDot(exactCross(d1, e2), n[corner])),
    exactDot(exactCross(d1, d2), n[corner]),
  ];
  const low = Fraction.from(Math.min(0, offset));
  const high = Fraction.from(Math.max(0, offset));
  const value = (s: IHumanExactFraction): IHumanExactFraction =>
    Fraction.add(coefficients[0], Fraction.multiply(s,
      Fraction.add(coefficients[1], Fraction.multiply(s, coefficients[2]))));
  let locations = [low], minimum = value(low);
  const consider = (location: IHumanExactFraction): void => {
    const candidate = value(location), order = Fraction.compare(candidate, minimum);
    if (order < 0) { minimum = candidate; locations = [location]; }
    else if (order === 0 && !locations.some((prior) => Fraction.compare(prior, location) === 0))
      locations.push(location);
  };
  consider(high);
  if (coefficients[2].numerator > 0n) {
    const stationary = Fraction.divide(Fraction.negate(coefficients[1]),
      Fraction.multiply(Fraction.from(2), coefficients[2]));
    if (Fraction.compare(stationary, low) > 0 && Fraction.compare(stationary, high) < 0)
      consider(stationary);
  }
  return {
    minimum: Fraction.number(minimum),
    exactPositive: minimum.numerator > 0n,
    locations: locations.map((location) => Fraction.number(location)),
    constant: offset !== 0 && coefficients[1].numerator === 0n && coefficients[2].numerator === 0n,
    coefficients,
  };
}

function exactCross(
  a: readonly IHumanExactFraction[], b: readonly IHumanExactFraction[],
): IHumanExactFraction[] {
  return [[1, 2], [2, 0], [0, 1]].map(([j, k]) =>
    Fraction.subtract(Fraction.multiply(a[j], b[k]), Fraction.multiply(a[k], b[j])));
}
function exactDot(
  a: readonly IHumanExactFraction[], b: readonly IHumanExactFraction[],
): IHumanExactFraction {
  return a.reduce((sum, value, k) => Fraction.add(sum, Fraction.multiply(value, b[k])),
    Fraction.create(0n));
}
