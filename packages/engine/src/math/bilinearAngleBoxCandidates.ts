import type { IAutoMovieAngleRange } from "@automovie/interface";

import { nearestAngleAlias } from "./nearestAngleAlias";

/**
 * Candidate full angles for maximizing the absolute bilinear form
 * `[cos(x/2),sin(x/2)] M [cos(y/2),sin(y/2)]^T` on a degree-valued box.
 * Matrix entries are row-major. Reference coordinates are clipped to the box.
 * The list contains the reference, feasible top singular-vector pair, each
 * boundary's sinusoidal maximum and reference point, and all corners.
 *
 * For equal singular values, an orthogonal matrix's optimal set is
 * `x-sign*y=phase+360*k`. Reference projections onto both orthogonal limiting
 * families are always added. For other matrices these are merely additional
 * feasible candidates: they never exclude the SVD or boundary maxima. No
 * numerical-rank threshold changes the candidate set.
 *
 * The caller scores actual reconstructed rotations. This operation neither
 * scores quaternion composition nor turns coupled joint limits into a box.
 * Invalid finite/ordered inputs throw; unrepresentable whole-turn indices
 * return null so a caller can retain its existing general solver.
 *
 * Method: David Eberly, Constrained Quaternions Using Euler Angles, sections
 * 2.3 and 3.1–3.5: https://www.geometrictools.com/Documentation/ConstrainedQuaternions.pdf
 * The general two-by-two SVD and limiting-family projections are derived below.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines matrix order, half-angle objective, full-angle degree boxes, reference handling, the candidate populations, null/refusal meanings and the caller's actual-rotation scoring responsibility.
 * @evidence contracts/development/implementation.md#principled-implementation On a positive-width box an interior maximum is a top singular pair; a boundary fixes one variable and leaves one sinusoid. Rotation/reflection limiting families include the equal-SVD continuum, whose reference-nearest point is a line projection clipped to the box. Whole-turn lifting uses nearestAngleAlias.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One finite candidate construction separates alias admission, boundaries, the top singular pair and the two reference families; physical joint conversion remains with the caller.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No grid, iterative search, rank cutoff, physical tolerance or fitted answer chooses a candidate. Both singular-vector and all boundary candidates remain present, including beside the reference-family candidates.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most eighteen pairs and constant-size arithmetic are produced regardless of interval width. At most twenty full lift computations remain: per axis, three fixed coordinates, one SVD coordinate, two opposite-edge stationary coordinates and four limiting-family coordinates; repeated fixed inputs reuse their original result. Only two phase indices bracketing the reference are needed per family. Exact-duplicate endpoints reduce append attempts before membership without losing a returned pair; runtime speedup remains unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One positive matrix rescaling serves every candidate and each boundary reuses its fixed sine/cosine. Exact-equal endpoints are enumerated once and the endpoint arrays serve corners and edges. Each axis lazily reuses its unchanged minimum/maximum/reference alias, including refused results after the original safe-index check. Numeric pair membership preserves the old string key's zero equivalence without decimal conversion; no candidate or its order changes. Four normalized scalars preserve each division, direct integer guards avoid temporary arrays, and each family's floor/ceil is read once. The existing alias owner still decides admission.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The pair list and numeric row/column membership contain at most eighteen pairs. Two endpoint arrays and two three-slot fixed-alias records are call-local; only the new pair list escapes and no input, cache or handle is retained.
 */
export function bilinearAngleBoxCandidates(
  matrix: readonly [number, number, number, number],
  ranges: readonly [IAutoMovieAngleRange, IAutoMovieAngleRange],
  reference: readonly [number, number],
): [number, number][] | null {
  if (
    !matrix.every(Number.isFinite) ||
    !reference.every(Number.isFinite) ||
    ranges.some(
      (range: IAutoMovieAngleRange): boolean =>
        !Number.isFinite(range.min) ||
        !Number.isFinite(range.max) ||
        range.min > range.max,
    )
  )
    throw new Error("Bilinear angle boxes require finite ordered inputs.");
  const anchor: [number, number] = [
    Math.max(ranges[0].min, Math.min(ranges[0].max, reference[0])),
    Math.max(ranges[1].min, Math.min(ranges[1].max, reference[1])),
  ];
  /** Share identical boundaries while keeping distinct signed zeros. */
  const endpoints: (range: IAutoMovieAngleRange) => number[] = (
    range: IAutoMovieAngleRange,
  ): number[] =>
    Object.is(range.min, range.max) ? [range.min] : [range.min, range.max];
  const ends: [number[], number[]] = [
    endpoints(ranges[0]),
    endpoints(ranges[1]),
  ];
  const points: [number, number][] = [];
  const seen: Map<number, Set<number>> = new Map();
  const aliases: [
    Partial<Record<0 | 1 | 2, number | null>>,
    Partial<Record<0 | 1 | 2, number | null>>,
  ] = [{}, {}];
  let representable: boolean = true;

  /** Select the admitted full-turn alias nearest this coordinate's reference. */
  const lift: (angle: number, axis: 0 | 1) => number | null = (
    angle: number,
    axis: 0 | 1,
  ): number | null => {
    const range: IAutoMovieAngleRange = ranges[axis];
    // Fixed coordinates are keyed by Object.is, unlike pair membership below.
    // A refused cached lift has already applied any unsafe-index refusal.
    const slot: 0 | 1 | 2 | null = Object.is(angle, range.min)
      ? 0
      : Object.is(angle, range.max)
        ? 1
        : Object.is(angle, anchor[axis])
          ? 2
          : null;
    const known: number | null | undefined =
      slot === null ? undefined : aliases[axis][slot];
    if (known !== undefined) return known;
    const first: number = Math.ceil((range.min - angle) / 360);
    const last: number = Math.floor((range.max - angle) / 360);
    const turn: number = Math.round((anchor[axis] - angle) / 360);
    let result: number | null;
    if (
      !Number.isSafeInteger(first) ||
      !Number.isSafeInteger(last) ||
      !Number.isSafeInteger(turn)
    ) {
      representable = false;
      result = null;
    } else {
      const value: number = nearestAngleAlias(angle + 360 * turn, range);
      result = value >= range.min && value <= range.max ? value : null;
    }
    if (slot !== null) aliases[axis][slot] = result;
    return result;
  };

  /** Admit an actual pair once; no coordinate is clamped into the interval. */
  const append: (x: number, y: number) => void = (
    x: number,
    y: number,
  ): void => {
    const a: number | null = lift(x, 0);
    const b: number | null = lift(y, 1);
    if (a === null || b === null) return;
    // Finite Number::toString keys and numeric membership identify the same
    // values, merging +/-0. Keep the first actual a,b signs in the output.
    // ECMA-262 6.1.6.1.20 and 24.5.1 define those two zero conventions.
    let columns: Set<number> | undefined = seen.get(a);
    if (columns?.has(b) === true) return;
    if (columns === undefined) {
      columns = new Set();
      seen.set(a, columns);
    }
    columns.add(b);
    points.push([a, b]);
  };
  append(anchor[0], anchor[1]);
  const scale: number = Math.max(
    Math.abs(matrix[0]),
    Math.abs(matrix[1]),
    Math.abs(matrix[2]),
    Math.abs(matrix[3]),
  );
  if (scale === 0) return representable ? points : null;
  const a: number = matrix[0] / scale;
  const b: number = matrix[1] / scale;
  const c: number = matrix[2] / scale;
  const d: number = matrix[3] / scale;
  const toDegrees: number = 180 / Math.PI;
  const halfRadians: number = Math.PI / 360;

  // M=R(alpha) diag(s,t) R(beta)^T with s>=|t| gives
  // (a+d,c-b)=(s+t)(cos(alpha-beta),sin(alpha-beta)) and
  // (a-d,c+b)=(s-t)(cos(alpha+beta),sin(alpha+beta)).
  // Thus the two phases give the top pair without squaring M's condition.
  const rotationPhase: number = Math.atan2(c - b, a + d);
  const reflectionPhase: number = Math.atan2(c + b, a - d);
  append(
    (rotationPhase + reflectionPhase) * toDegrees,
    (reflectionPhase - rotationPhase) * toDegrees,
  );
  for (const x of ends[0]) for (const y of ends[1]) append(x, y);

  // A fixed boundary leaves A*cos(variable/2)+B*sin(variable/2).
  // All absolute maxima have atan2(B,A)+k*pi as their half angle.
  for (const x of ends[0]) {
    const cosine: number = Math.cos(x * halfRadians);
    const sine: number = Math.sin(x * halfRadians);
    const A: number = a * cosine + c * sine;
    const B: number = b * cosine + d * sine;
    if (A !== 0 || B !== 0) append(x, 2 * Math.atan2(B, A) * toDegrees);
    append(x, anchor[1]);
  }
  for (const y of ends[1]) {
    const cosine: number = Math.cos(y * halfRadians);
    const sine: number = Math.sin(y * halfRadians);
    const A: number = a * cosine + b * sine;
    const B: number = c * cosine + d * sine;
    if (A !== 0 || B !== 0) append(2 * Math.atan2(B, A) * toDegrees, y);
    append(anchor[0], y);
  }

  /** Add the closest reference point of each feasible orthogonal-family line. */
  const family: (sign: 1 | -1, phase: number) => void = (
    sign: 1 | -1,
    phase: number,
  ): void => {
    const phaseDegrees: number = 2 * phase * toDegrees;
    const minimum: number =
      ranges[0].min - sign * (sign === 1 ? ranges[1].max : ranges[1].min);
    const maximum: number =
      ranges[0].max - sign * (sign === 1 ? ranges[1].min : ranges[1].max);
    const first: number = Math.ceil((minimum - phaseDegrees) / 360);
    const last: number = Math.floor((maximum - phaseDegrees) / 360);
    const near: number = (anchor[0] - sign * anchor[1] - phaseDegrees) / 360;
    const below: number = Math.floor(near);
    const above: number = Math.ceil(near);
    if (
      !Number.isSafeInteger(first) ||
      !Number.isSafeInteger(last) ||
      !Number.isSafeInteger(below) ||
      !Number.isSafeInteger(above)
    ) {
      representable = false;
      return;
    }
    if (first > last) return;
    const indices: Set<number> = new Set();
    indices.add(Math.max(first, Math.min(last, below)));
    indices.add(Math.max(first, Math.min(last, above)));
    for (const index of indices) {
      const intercept: number = phaseDegrees + 360 * index;
      const low: number = Math.max(
        ranges[1].min,
        sign === 1 ? ranges[0].min - intercept : intercept - ranges[0].max,
      );
      const high: number = Math.min(
        ranges[1].max,
        sign === 1 ? ranges[0].max - intercept : intercept - ranges[0].min,
      );
      if (low > high) continue;
      const y: number = Math.max(
        low,
        Math.min(high, (sign * (anchor[0] - intercept) + anchor[1]) / 2),
      );
      append(sign * y + intercept, y);
    }
  };
  family(1, rotationPhase);
  family(-1, reflectionPhase);
  return representable ? points : null;
}
