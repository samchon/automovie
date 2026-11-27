import type { IAutoMovieAngleRange } from "@automovie/interface";

import { nearestAngleAlias } from "./nearestAngleAlias";

/**
 * Candidate full angles for maximizing the absolute bilinear form
 * `[cos(x/2),sin(x/2)] M [cos(y/2),sin(y/2)]^T` on a degree-valued box. Matrix
 * entries are row-major. Reference coordinates are clipped to the box. The list
 * contains the reference, feasible top singular-vector pair, each boundary's
 * sinusoidal maximum and reference point, and all corners.
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
 * return null so a caller can retain its existing general solver. Repeated
 * queries on one unchanged box may use prepare to share its range admission,
 * endpoint arrays, boundary sine/cosine and range-only bounds; targets keep
 * alias admission, candidate list and reference. On a bounded interval narrower
 * than a half-turn, one nearest alias suffices when the fixed width proves the
 * remaining turns cannot enter. Matrix and reference admission still precede
 * the unchanged range admission result.
 *
 * Method: David Eberly, Constrained Quaternions Using Euler Angles, sections
 * 2.3 and 3.1–3.5:
 * https://www.geometrictools.com/Documentation/ConstrainedQuaternions.pdf The
 * general two-by-two SVD and limiting-family projections are derived below.
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
  if (!admitRanges(ranges, prepared))
    throw new Error("Bilinear angle boxes require finite ordered inputs.");
  return pairsOf(
    enumerateBox(0, 0, 0, 0, ranges, 0, 0, prepared, { matrix, reference }),
  );
}

/**
 * Preserve existing fresh tuple output after the entire shared enumeration
 * finishes.
 */
function pairsOf(flat: number[] | null): [number, number][] | null {
  if (flat === null) return null;
  const pairs: [number, number][] = [];
  for (let offset: number = 0; offset < flat.length; offset += 2)
    pairs.push([flat[offset]!, flat[offset + 1]!]);
  return pairs;
}

/** Shared finite-input enumeration; scalar callers need no argument tuples. */
function enumerateBox(
  m00: number,
  m01: number,
  m10: number,
  m11: number,
  ranges: readonly [IAutoMovieAngleRange, IAutoMovieAngleRange],
  referenceX: number,
  referenceY: number,
  prepared?: IBoxState,
  raw?: IRawInputs,
): number[] | null {
  const anchorX: number = Math.max(
    ranges[0].min,
    Math.min(ranges[0].max, raw === undefined ? referenceX : raw.reference[0]),
  );
  const anchorY: number = Math.max(
    ranges[1].min,
    Math.min(ranges[1].max, raw === undefined ? referenceY : raw.reference[1]),
  );
  const ends: [number[], number[]] | undefined = prepared?.ends;
  const points: number[] = [];
  const tight: readonly [boolean, boolean] | undefined = prepared?.tight;
  // Only prepared unchanged axes share min/max/reference slots and refusals.
  const aliases: (number | null | undefined)[] | undefined =
    prepared === undefined || (tight?.[0] === true && tight[1])
      ? undefined
      : [];
  const bounded: readonly [boolean, boolean] | undefined = prepared?.bounded;
  let representable: boolean = true;

  /** Select the admitted full-turn alias nearest this coordinate's reference. */
  const lift: (angle: number, axis: 0 | 1) => number | null = (
    angle: number,
    axis: 0 | 1,
  ): number | null => {
    const range: IAutoMovieAngleRange = ranges[axis];
    const anchor: number = axis === 0 ? anchorX : anchorY;
    // A box at most 179 degrees wide contains only aliases within 179
    // degrees of the anchor. On these bounded numbers every rounded
    // intermediate is within 2^-39 degrees of its exact value, so any other
    // turn remains more than 179 degrees away. If the nearest turn misses,
    // nearestAngleAlias cannot put a different turn inside. Retain the
    // exact original round, multiply and add, including its zero signs.
    if (tight?.[axis] === true && Math.abs(angle) <= 1024) {
      const shifted: number = angle + 360 * Math.round((anchor - angle) / 360);
      return shifted >= range.min && shifted <= range.max ? shifted : null;
    }
    // Fixed coordinates are keyed by Object.is, unlike pair membership below.
    // A refused cached lift has already applied any unsafe-index refusal.
    const slot: 0 | 1 | 2 | null =
      prepared === undefined
        ? null
        : Object.is(angle, range.min)
          ? 0
          : Object.is(angle, range.max)
            ? 1
            : Object.is(angle, axis === 0 ? anchorX : anchorY)
              ? 2
              : null;
    const known: number | null | undefined =
      slot === null ? undefined : aliases?.[axis * 3 + slot];
    if (known !== undefined) return known;
    // For an angle inside these bounded intervals, all three index numerators
    // have magnitude at most 2*MAX_SAFE_INTEGER. Division by 360 keeps ceil,
    // floor and round strictly inside the safe-integer range. Their admission
    // cannot refuse; retain the original turn/add/nearestAlias arithmetic.
    if (
      bounded?.[axis] === true &&
      (slot !== null || (angle >= range.min && angle <= range.max))
    ) {
      const turn: number = Math.round((anchor - angle) / 360);
      const shifted: number = angle + 360 * turn;
      // A zero turn keeps this admitted angle inside, including either zero
      // sign produced by the original multiplication and addition above.
      const value: number =
        turn === 0 ? shifted : nearestAngleAlias(shifted, range);
      const result: number | null =
        turn === 0 || (value >= range.min && value <= range.max) ? value : null;
      if (slot !== null && aliases !== undefined)
        aliases[axis * 3 + slot] = result;
      return result;
    }
    const bounds: IAliasBounds | undefined =
      slot === 0 || slot === 1 ? prepared?.aliasBounds[axis][slot] : undefined;
    const first: number = bounds?.first ?? Math.ceil((range.min - angle) / 360);
    const last: number = bounds?.last ?? Math.floor((range.max - angle) / 360);
    const turn: number = Math.round((anchor - angle) / 360);
    const safe: boolean = bounds?.safe ?? last <= Number.MAX_SAFE_INTEGER;
    if (
      prepared !== undefined &&
      (slot === 0 || slot === 1) &&
      bounds === undefined
    )
      prepared.aliasBounds[axis][slot] = { first, last, safe };
    let result: number | null;
    if (!safe) {
      representable = false;
      result = null;
    } else {
      const value: number = nearestAngleAlias(angle + 360 * turn, range);
      result = value >= range.min && value <= range.max ? value : null;
    }
    if (slot !== null && aliases !== undefined)
      aliases[axis * 3 + slot] = result;
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
    for (let offset: number = 0; offset < points.length; offset += 2)
      if (points[offset] === a && points[offset + 1] === b) return;
    points.push(a, b);
  };
  append(anchorX, anchorY);
  const scale: number =
    raw === undefined
      ? Math.max(Math.abs(m00), Math.abs(m01), Math.abs(m10), Math.abs(m11))
      : Math.max(...raw.matrix.map(Math.abs));
  if (scale === 0) return representable ? points : null;
  let rawA: number | undefined;
  let rawB: number | undefined;
  let rawC: number | undefined;
  let rawD: number | undefined;
  if (raw !== undefined)
    [rawA, rawB, rawC, rawD] = raw.matrix.map(
      (value: number): number => value / scale,
    );
  const a: number = raw === undefined ? m00 / scale : rawA!;
  const b: number = raw === undefined ? m01 / scale : rawB!;
  const c: number = raw === undefined ? m10 / scale : rawC!;
  const d: number = raw === undefined ? m11 / scale : rawD!;
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
  for (const x of ends?.[0] ?? [ranges[0].min, ranges[0].max])
    for (const y of ends?.[1] ?? [ranges[1].min, ranges[1].max]) append(x, y);

  // A fixed boundary leaves A*cos(variable/2)+B*sin(variable/2).
  // All absolute maxima have atan2(B,A)+k*pi as their half angle.
  const xEnds: number[] = ends?.[0] ?? [ranges[0].min, ranges[0].max];
  for (let index: number = 0; index < xEnds.length; index++) {
    const x: number = xEnds[index]!;
    const { cosine, sine }: IBoundary = boundary(
      x,
      0,
      index,
      halfRadians,
      prepared,
    );
    const A: number = a * cosine + c * sine;
    const B: number = b * cosine + d * sine;
    if (A !== 0 || B !== 0) append(x, 2 * Math.atan2(B, A) * toDegrees);
    append(x, anchorY);
  }
  const yEnds: number[] = ends?.[1] ?? [ranges[1].min, ranges[1].max];
  for (let index: number = 0; index < yEnds.length; index++) {
    const y: number = yEnds[index]!;
    const { cosine, sine }: IBoundary = boundary(
      y,
      1,
      index,
      halfRadians,
      prepared,
    );
    const A: number = a * cosine + b * sine;
    const B: number = c * cosine + d * sine;
    if (A !== 0 || B !== 0) append(2 * Math.atan2(B, A) * toDegrees, y);
    append(anchorX, y);
  }

  /** Add the closest reference point of each feasible orthogonal-family line. */
  const family: (sign: 1 | -1, phase: number) => void = (
    sign: 1 | -1,
    phase: number,
  ): void => {
    const phaseDegrees: number = 2 * phase * toDegrees;
    const known: IFamilyInterval | undefined = prepared?.familyIntervals[sign];
    const minimum: number =
      known?.minimum ??
      ranges[0].min - sign * (sign === 1 ? ranges[1].max : ranges[1].min);
    const maximum: number =
      known?.maximum ??
      ranges[0].max - sign * (sign === 1 ? ranges[1].min : ranges[1].max);
    if (prepared !== undefined && known === undefined)
      prepared.familyIntervals[sign] = { minimum, maximum };
    const first: number = Math.ceil((minimum - phaseDegrees) / 360);
    const last: number = Math.floor((maximum - phaseDegrees) / 360);
    const near: number = (anchorX - sign * anchorY - phaseDegrees) / 360;
    const below: number = Math.floor(near);
    const above: number = Math.ceil(near);
    if (above > Number.MAX_SAFE_INTEGER) {
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
        Math.min(high, (sign * (anchorX - intercept) + anchorY) / 2),
      );
      append(sign * y + intercept, y);
    }
  };
  family(1, rotationPhase);
  family(-1, reflectionPhase);
  return representable ? points : null;
}

/** Keep a one-degree margin from a half-turn and bound all lift intermediates. */
function narrow(range: IAutoMovieAngleRange): boolean {
  return (
    Math.abs(range.min) <= 1024 &&
    Math.abs(range.max) <= 1024 &&
    range.max - range.min <= 179
  );
}

/** Whether the ranges are ordered, read from the preparation when one exists. */
function admitRanges(
  ranges: readonly [IAutoMovieAngleRange, IAutoMovieAngleRange],
  prepared: IBoxState | undefined,
): boolean {
  if (prepared !== undefined) return prepared.admitted;
  return !ranges.some(
    (range: IAutoMovieAngleRange): boolean => range.min > range.max,
  );
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

/** Fixed-box preparation with query-local matrices, references and candidates. */
export namespace bilinearAngleBoxCandidates {
  /** A fresh candidate list or refusal for each matrix/reference on this box. */
  export interface IPrepared {
    /**
     * Preserve direct enumeration, candidate order and query-local alias
     * ownership.
     */
    (
      matrix: Parameters<typeof bilinearAngleBoxCandidates>[0],
      reference: Parameters<typeof bilinearAngleBoxCandidates>[2],
    ): ReturnType<typeof bilinearAngleBoxCandidates>;

    /**
     * Completed [x0,y0,x1,y1,...] list in the same order, without per-pair
     * tuples.
     */
    fromScalarsFlat(
      m00: number,
      m01: number,
      m10: number,
      m11: number,
      referenceX: number,
      referenceY: number,
    ): number[] | null;

    /**
     * Same row-major objective and reference, without allocating argument
     * tuples.
     */
    fromScalars(
      m00: number,
      m01: number,
      m10: number,
      m11: number,
      referenceX: number,
      referenceY: number,
    ): ReturnType<typeof bilinearAngleBoxCandidates>;
  }

  /**
   * Borrow an unchanged rig-angle box for one operation's repeated queries.
   * Retains one range-admission flag, two bounded-index facts, two endpoint
   * arrays, four lazy half-angle readings, four raw endpoint lift bounds and
   * two family intercept intervals; every target owns matrix/reference and
   * turn/alias admission and pairs. Standalone direct calls retain no
   * preparation. A one-query preparation pays fixed metadata wrappers; runtime
   * improvement remains unmeasured.
   */
  export function prepare(
    ranges: Parameters<typeof bilinearAngleBoxCandidates>[1],
  ): IPrepared {
    const prepared: IBoxState = {
      admitted: admitRanges(ranges, undefined),
      bounded: [
        Math.abs(ranges[0].min) <= Number.MAX_SAFE_INTEGER &&
          Math.abs(ranges[0].max) <= Number.MAX_SAFE_INTEGER,
        Math.abs(ranges[1].min) <= Number.MAX_SAFE_INTEGER &&
          Math.abs(ranges[1].max) <= Number.MAX_SAFE_INTEGER,
      ],
      tight: [narrow(ranges[0]), narrow(ranges[1])],
      ends: [endpoints(ranges[0]), endpoints(ranges[1])],
      trigonometry: [[], []],
      aliasBounds: [[], []],
      familyIntervals: {},
    };
    const scalar: IPrepared["fromScalarsFlat"] = (
      m00: number,
      m01: number,
      m10: number,
      m11: number,
      referenceX: number,
      referenceY: number,
    ): number[] | null => {
      if (!admitRanges(ranges, prepared))
        throw new Error("Bilinear angle boxes require finite ordered inputs.");
      return enumerateBox(
        m00,
        m01,
        m10,
        m11,
        ranges,
        referenceX,
        referenceY,
        prepared,
      );
    };
    return Object.assign(
      (
        matrix: Parameters<typeof bilinearAngleBoxCandidates>[0],
        reference: Parameters<typeof bilinearAngleBoxCandidates>[2],
      ): ReturnType<typeof bilinearAngleBoxCandidates> =>
        evaluateBox(matrix, ranges, reference, prepared),
      {
        fromScalars: (
          m00: number,
          m01: number,
          m10: number,
          m11: number,
          referenceX: number,
          referenceY: number,
        ): ReturnType<typeof bilinearAngleBoxCandidates> =>
          pairsOf(scalar(m00, m01, m10, m11, referenceX, referenceY)),
        fromScalarsFlat: scalar,
      },
    );
  }
}

/** Raw tuple adapters keep their original delayed live component reads. */
interface IRawInputs {
  /** Original matrix, read by its two original map operations after anchor lift. */
  matrix: readonly [number, number, number, number];
  /** Original reference, read inside each corresponding anchor expression. */
  reference: readonly [number, number];
}

/** Fixed endpoint data owned by one unchanged box operation, never a target. */
interface IBoxState {
  /** Finite/ordered admission of the fixed ranges. */
  admitted: boolean;

  /** Whether each finite interval fits the exact bounded-index proof. */
  bounded: readonly [boolean, boolean];

  /** Whether each fixed axis proves one possible nearest turn. */
  tight: readonly [boolean, boolean];

  /** Exact endpoint order; signed-zero endpoints remain distinct. */
  ends: [number[], number[]];

  /** At most two lazy boundary readings for each axis. */
  trigonometry: [Array<IBoundary | undefined>, Array<IBoundary | undefined>];

  /** Range-only min/max lift prefixes; reference-nearest turn stays query-local. */
  aliasBounds: [
    Array<IAliasBounds | undefined>,
    Array<IAliasBounds | undefined>,
  ];

  /** Each limiting family's fixed feasible line-intercept interval. */
  familyIntervals: Partial<Record<1 | -1, IFamilyInterval>>;
}

/** Range-only line-intercept limits before the target's phase is subtracted. */
interface IFamilyInterval {
  /** Least x-sign*y on the unchanged rectangle, using the original grouping. */
  minimum: number;

  /** Greatest x-sign*y on the same rectangle, including nonfinite overflow. */
  maximum: number;
}

/** Original raw whole-turn bounds and their unchanged safe-index admission. */
interface IAliasBounds {
  /** Ceil((range.min-fixedAngle)/360), with its original signed zero. */
  first: number;

  /** Floor((range.max-fixedAngle)/360), before the original safe-index guard. */
  last: number;

  /** Exact result of the two range-only safe-integer checks. */
  safe: boolean;
}

/** One fixed full angle's half-angle components, used only as coefficients. */
interface IBoundary {
  /** Cosine, evaluated before the matching sine. */
  cosine: number;

  /** Sine of the same original angle-times-halfRadians expression. */
  sine: number;
}
