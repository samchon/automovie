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
 * Repeated queries on one unchanged box may use prepare to share its endpoint
 * arrays, boundary sine/cosine and range-only turn bounds; targets keep alias
 * admission, candidate list and reference, under the same input-check order.
 *
 * Method: David Eberly, Constrained Quaternions Using Euler Angles, sections
 * 2.3 and 3.1–3.5: https://www.geometrictools.com/Documentation/ConstrainedQuaternions.pdf
 * The general two-by-two SVD and limiting-family projections are derived below.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines matrix order, half-angle objective, full-angle degree boxes, reference handling, the candidate populations, null/refusal meanings and the caller's actual-rotation scoring responsibility.
 * @evidence contracts/development/implementation.md#principled-implementation On a positive-width box an interior maximum is a top singular pair; a boundary fixes one variable and leaves one sinusoid. Rotation/reflection limiting families include the equal-SVD continuum, whose reference-nearest point is a line projection clipped to the box. Whole-turn lifting uses nearestAngleAlias.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Direct and prepared calls share one finite candidate construction separating alias admission, boundaries, the top singular pair and the two reference families. A private boundary reader owns each original cosine/sine expression; physical joint conversion remains with the caller.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No grid, iterative search, rank cutoff, physical tolerance or fitted answer chooses a candidate. Both singular-vector and all boundary candidates remain present, including beside the reference-family candidates.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most eighteen pairs and constant-size arithmetic are produced regardless of interval width. At most twenty full lift computations remain: per axis, three fixed coordinates, one SVD coordinate, two opposite-edge stationary coordinates and four limiting-family coordinates; repeated fixed inputs reuse their original result. Numeric row heads and links replace per-row Sets; searching a row has O(K²) worst-case total work for K<=18 retained pairs. Only two scalar phase indices bracketing the reference are needed per family. Exact-duplicate endpoints reduce append attempts without losing a returned pair; runtime speedup remains unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One matrix rescaling serves every candidate and each boundary reuses fixed sine/cosine. Exact-equal endpoints are enumerated once; prepare shares endpoint arrays, at most four lazy boundary readings and four range-only first/last whole-turn prefixes. A prefix is read only after this query's local alias miss, at the original min/max lift site. Reference-dependent turn, all three safe-index checks, representability and nearestAngleAlias still run per query; no alias answer crosses queries. Each query also reuses its min/max/reference alias locally. Row links preserve SameValueZero and first pair signs, family scalar indices preserve former Set order/positive-zero behavior, and the existing alias owner decides admission.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A direct call owns at most eighteen pair tuples, one row-head map/link array, two endpoint arrays and two three-slot alias records; only its pair list escapes. Family choices are scalars. Prepared callers retain their borrowed box, endpoint arrays and at most four lazy boundary readings plus four raw first/last prefix records. Unsafe raw prefix numbers still undergo this query's safe-index refusal. Direct lifts allocate no prefix wrapper. No target, alias/candidate history, global cache or handle is retained.
 */
export function bilinearAngleBoxCandidates(
  matrix: readonly [number, number, number, number],
  ranges: readonly [IAutoMovieAngleRange, IAutoMovieAngleRange],
  reference: readonly [number, number],
): [number, number][] | null {
  return evaluateBox(matrix, ranges, reference);
}

/** One enumeration owner; optional metadata contains only unchanged box data. */
function evaluateBox(
  matrix: readonly [number, number, number, number],
  ranges: readonly [IAutoMovieAngleRange, IAutoMovieAngleRange],
  reference: readonly [number, number],
  prepared?: IBoxState,
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
  const ends: [number[], number[]] = prepared?.ends ?? [
    endpoints(ranges[0]),
    endpoints(ranges[1]),
  ];
  if (prepared !== undefined && prepared.ends === undefined) prepared.ends = ends;
  const points: [number, number][] = [];
  const seen: Map<number, number> = new Map();
  const previous: (number | undefined)[] = [];
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
    const bounds: IAliasBounds | undefined = slot === 0 || slot === 1
      ? prepared?.aliasBounds[axis][slot] : undefined;
    const first: number = bounds?.first ?? Math.ceil((range.min - angle) / 360);
    const last: number = bounds?.last ?? Math.floor((range.max - angle) / 360);
    const turn: number = Math.round((anchor[axis] - angle) / 360);
    if (prepared !== undefined && (slot === 0 || slot === 1) && bounds === undefined)
      prepared.aliasBounds[axis][slot] = { first, last };
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

    // Coordinates are finite, so === matches Set's SameValueZero, including
    // merged +/-0. The actual first pair keeps its original coordinate signs.
    const head: number | undefined = seen.get(a);
    let index: number | undefined = head;
    while (index !== undefined) {
      if (points[index]![1] === b) return;
      index = previous[index];
    }
    seen.set(a, points.length);
    previous.push(head);
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
  for (let index: number = 0; index < ends[0].length; index++) {
    const x: number = ends[0][index]!;
    const { cosine, sine }: IBoundary = boundary(x, 0, index, halfRadians, prepared);
    const A: number = a * cosine + c * sine;
    const B: number = b * cosine + d * sine;
    if (A !== 0 || B !== 0) append(x, 2 * Math.atan2(B, A) * toDegrees);
    append(x, anchor[1]);
  }
  for (let index: number = 0; index < ends[1].length; index++) {
    const y: number = ends[1][index]!;
    const { cosine, sine }: IBoundary = boundary(y, 1, index, halfRadians, prepared);
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
    const lowerIndex: number = Math.max(first, Math.min(last, below));
    const upperIndex: number = Math.max(first, Math.min(last, above));
    for (let choice: number = 0; choice < 2; choice++) {
      if (choice === 1 && upperIndex === lowerIndex) continue;
      const rawIndex: number = choice === 0 ? lowerIndex : upperIndex;

      // Set iteration canonicalized -0 to +0 before the intercept arithmetic.
      const index: number = rawIndex === 0 ? 0 : rawIndex;
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

/** Fixed endpoint data owned by one unchanged box operation, never a target. */
interface IBoxState {
  /** Exact endpoint order; signed-zero endpoints remain distinct. */
  ends?: [number[], number[]];

  /** At most two lazy boundary readings for each axis. */
  trigonometry: [Array<IBoundary | undefined>, Array<IBoundary | undefined>];

  /** Range-only min/max lift prefixes; reference-nearest turn stays query-local. */
  aliasBounds: [Array<IAliasBounds | undefined>, Array<IAliasBounds | undefined>];
}

/** Original raw whole-turn bounds, including unsafe values rechecked per query. */
interface IAliasBounds {
  /** ceil((range.min-fixedAngle)/360), with its original signed zero. */
  first: number;

  /** floor((range.max-fixedAngle)/360), before the original safe-index guard. */
  last: number;
}

/** One fixed full angle's half-angle components, used only as coefficients. */
interface IBoundary {
  /** Cosine, evaluated before the matching sine. */
  cosine: number;

  /** Sine of the same original angle-times-halfRadians expression. */
  sine: number;
}

/** Share identical boundaries while keeping distinct signed zeros. */
function endpoints(range: IAutoMovieAngleRange): number[] {
  return Object.is(range.min, range.max) ? [range.min] : [range.min, range.max];
}

/** Read fixed trigonometry only at its original boundary-use site. */
function boundary(
  angle: number,
  axis: 0 | 1,
  index: number,
  halfRadians: number,
  prepared?: IBoxState,
): IBoundary {
  const known: IBoundary | undefined = prepared?.trigonometry[axis][index];
  if (known !== undefined) return known;
  const result: IBoundary = {
    cosine: Math.cos(angle * halfRadians),
    sine: Math.sin(angle * halfRadians),
  };
  if (prepared !== undefined) prepared.trigonometry[axis][index] = result;
  return result;
}

/**
 * Fixed-box preparation with query-local matrices, references and candidates.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the unchanged box, lazy endpoints/trigonometry/min-max lift bounds, per-query validation and safe-index refusal, query-local aliases/candidates and release boundary.
 * @evidence contracts/development/design.md#principled-representation Endpoints, their half-angle sine/cosine and first/last turn indices depend only on the fixed box. Reference-nearest turn, final aliases, matrix phases and family projections remain query-local in the one enumeration owner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The prepared callable serves the actual repeated projector queries while the direct function retains independent-call behavior. No candidate getter, target key, global cache or second enumeration algorithm is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Construction reads no boundary. Matrix/reference/range checks keep their order; raw lift prefixes are first read at the original local-alias miss and unsafe values are rechecked each query. Trigonometry stays at its old edge site, absent on a zero matrix. No reference, turn or alias result is shared across queries. The caller keeps ranges unchanged and releases preparation with its operation.
 */
export namespace bilinearAngleBoxCandidates {
  /** A fresh candidate list or refusal for each matrix/reference on this box. */
  export interface IPrepared {
    /** Preserve direct enumeration, candidate order and query-local alias ownership. */
    (
      matrix: Parameters<typeof bilinearAngleBoxCandidates>[0],
      reference: Parameters<typeof bilinearAngleBoxCandidates>[2],
    ): ReturnType<typeof bilinearAngleBoxCandidates>;
  }

  /**
   * Borrow an unchanged rig-angle box for one operation's repeated queries.
   * Retains at most two endpoint arrays, four lazy half-angle readings and four
   * raw endpoint lift bounds; every target owns turn/alias admission and pairs.
   * Standalone direct calls retain no preparation. A one-query preparation
   * pays fixed metadata wrappers; runtime improvement remains unmeasured.
   */
  export function prepare(
    ranges: Parameters<typeof bilinearAngleBoxCandidates>[1],
  ): IPrepared {
    const prepared: IBoxState = { trigonometry: [[], []], aliasBounds: [[], []] };
    return (
      matrix: Parameters<typeof bilinearAngleBoxCandidates>[0],
      reference: Parameters<typeof bilinearAngleBoxCandidates>[2],
    ): ReturnType<typeof bilinearAngleBoxCandidates> =>
      evaluateBox(matrix, ranges, reference, prepared);
  }
}
