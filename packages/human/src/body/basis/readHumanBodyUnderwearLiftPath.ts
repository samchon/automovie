import { HumanExactFraction as Fraction } from "../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../common/measure/IHumanExactFraction";
import type { IHumanBodyUnderwearLiftPath } from "./IHumanBodyUnderwearLiftPath";
import type { IHumanBodyUnderwearLiftPathInput } from "./IHumanBodyUnderwearLiftPathInput";

/**
 * Exact minimum of A(s) dot N_corner for the declared affine-normal lift.
 *
 * Internal callers satisfy IHumanBodyUnderwearLiftPathInput's validated face, corner and finite signed-offset preconditions; this owner does not admit a second public authoring input or reinterpret an invalid caller as geometry.
 *
 * The represented base coordinates and returned normals define a quadratic in signed metres. Rational coefficients and comparisons retain the existing strict-sign policy. Every tied endpoint and interior stationary minimum is retained for the analytic fitting model. Constant quadratics also identify their continuum of minimizers; two endpoint witnesses do not imply that its directional derivative has no interior minimum.
 *
 * @evidence contracts/common.md#principled-implementation Exact fractions of represented base coordinates and returned normals define the affine lift's orientation quadratic; endpoints and an interior convex stationary point determine strict sign and all finite tied witnesses.
 * @evidence contracts/common.md#clear-and-simple-design One quadratic coefficient tuple and one exact candidate comparison serve the signed interval, returning a rounded minimum alongside authoritative exactPositive and constant-case metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Validated face/corner/offset inputs are an internal caller premise; exact arithmetic concerns supplied doubles, and endpoint witnesses of a constant polynomial do not prove the continuum derivative or global embedding.
 * @evidence contracts/common.md#meaningful-documentation The comment states signed metre interval, represented-input rational coefficients, tied stationary witnesses and the constant-polynomial derivative limitation.
 * @evidence contracts/performance.md#efficient-algorithms A fixed three-corner face builds three coefficients and tests at most three distinct candidate locations; BigInt reduction/product cost depends on represented input bit widths rather than mesh population.
 * @evidence contracts/performance.md#reuse-equivalent-work Coefficients are built once and reused by the Horner value reader; exact fraction conversion, arithmetic and comparison reuse the shared numerical owner without a cross-face cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned fractions and witness numbers belong to the caller; temporary candidate records expire, and no source mesh buffer, persistent map, handle or pending work is retained.
 */
export function readHumanBodyUnderwearLiftPath(
  input: IHumanBodyUnderwearLiftPathInput,
): IHumanBodyUnderwearLiftPath {
  const {
    points: q,
    normals,
    corner,
    offsetMetres: offset,
  }: IHumanBodyUnderwearLiftPathInput = input;
  const points: IHumanExactFraction[][] = q.map(
    (point: readonly number[]): IHumanExactFraction[] =>
      point.map((value: number): IHumanExactFraction => Fraction.from(value)),
  );
  const n: IHumanExactFraction[][] = normals.map(
    (normal: readonly number[]): IHumanExactFraction[] =>
      normal.map((value: number): IHumanExactFraction => Fraction.from(value)),
  );
  const e1: IHumanExactFraction[] = points[1].map(
    (value: IHumanExactFraction, k: number): IHumanExactFraction =>
      Fraction.subtract(value, points[0][k]),
  );
  const e2: IHumanExactFraction[] = points[2].map(
    (value: IHumanExactFraction, k: number): IHumanExactFraction =>
      Fraction.subtract(value, points[0][k]),
  );
  const d1: IHumanExactFraction[] = n[1].map(
    (value: IHumanExactFraction, k: number): IHumanExactFraction =>
      Fraction.subtract(value, n[0][k]),
  );
  const d2: IHumanExactFraction[] = n[2].map(
    (value: IHumanExactFraction, k: number): IHumanExactFraction =>
      Fraction.subtract(value, n[0][k]),
  );
  const coefficients: IHumanExactFraction[] = [
    exactDot(exactCross(e1, e2), n[corner]),
    Fraction.add(
      exactDot(exactCross(e1, d2), n[corner]),
      exactDot(exactCross(d1, e2), n[corner]),
    ),
    exactDot(exactCross(d1, d2), n[corner]),
  ];
  const low: IHumanExactFraction = Fraction.from(Math.min(0, offset));
  const high: IHumanExactFraction = Fraction.from(Math.max(0, offset));
  const value: (s: IHumanExactFraction) => IHumanExactFraction = (
    s: IHumanExactFraction,
  ): IHumanExactFraction =>
    Fraction.add(
      coefficients[0],
      Fraction.multiply(
        s,
        Fraction.add(coefficients[1], Fraction.multiply(s, coefficients[2])),
      ),
    );
  let locations: IHumanExactFraction[] = [low],
    minimum: IHumanExactFraction = value(low);
  const consider: (location: IHumanExactFraction) => void = (
    location: IHumanExactFraction,
  ): void => {
    const candidate: IHumanExactFraction = value(location),
      order: number = Fraction.compare(candidate, minimum);
    if (order < 0) {
      minimum = candidate;
      locations = [location];
    } else if (
      order === 0 &&
      !locations.some(
        (prior: IHumanExactFraction): boolean =>
          Fraction.compare(prior, location) === 0,
      )
    )
      locations.push(location);
  };
  consider(high);
  if (coefficients[2].numerator > 0n) {
    const stationary: IHumanExactFraction = Fraction.divide(
      Fraction.negate(coefficients[1]),
      Fraction.multiply(Fraction.from(2), coefficients[2]),
    );
    if (
      Fraction.compare(stationary, low) > 0 &&
      Fraction.compare(stationary, high) < 0
    )
      consider(stationary);
  }
  return {
    minimum: Fraction.number(minimum),
    exactPositive: minimum.numerator > 0n,
    locations: locations.map((location: IHumanExactFraction): number =>
      Fraction.number(location),
    ),
    constant:
      offset !== 0 &&
      coefficients[1].numerator === 0n &&
      coefficients[2].numerator === 0n,
    coefficients,
  };
}

function exactCross(
  a: readonly IHumanExactFraction[],
  b: readonly IHumanExactFraction[],
): IHumanExactFraction[] {
  return [
    [1, 2],
    [2, 0],
    [0, 1],
  ].map(
    ([j, k]: number[]): IHumanExactFraction =>
      Fraction.subtract(
        Fraction.multiply(a[j], b[k]),
        Fraction.multiply(a[k], b[j]),
      ),
  );
}
function exactDot(
  a: readonly IHumanExactFraction[],
  b: readonly IHumanExactFraction[],
): IHumanExactFraction {
  return a.reduce(
    (
      sum: IHumanExactFraction,
      value: IHumanExactFraction,
      k: number,
    ): IHumanExactFraction => Fraction.add(sum, Fraction.multiply(value, b[k])),
    Fraction.create(0n),
  );
}
