import type {
  IAutoMovieClosestSegmentPoints,
  IAutoMovieVector3,
  IAutoMovieSweptCapsuleCollision as Sweep,
} from "@automovie/interface";

import { closestPointsBetweenSegments } from "../math/closestPointsBetweenSegments";

/** A closed, outward-rounded binary64 interval. */
interface IRange {
  /** Lower bound. */
  low: number;
  /** Upper bound. */
  high: number;
}

/** One bounded point at a normalized sample time. */
interface IPoint {
  /** Approximate point, used only to find useful candidates. */
  value: IAutoMovieVector3;
  /** Enclosures of the actual affine point. */
  bounds: Record<keyof IAutoMovieVector3, IRange>;
}

/** The two endpoint pairs at one sample of the uninterrupted affine law. */
interface ISample {
  /** Normalized parameter in the originally supplied interval. */
  at: number;
  /** First capsule's axis endpoints. */
  first: readonly [IPoint, IPoint];
  /** Second capsule's axis endpoints. */
  second: readonly [IPoint, IPoint];
}

/** Sampled contact whose axis-point distance is independently bounded. */
interface IWitness {
  /** Rounded signed gap between the selected axis points, less both radii. */
  separation: number;
  /** Rounded world point inside the ideal overlap, weighted by radius. */
  point: IAutoMovieVector3;
}

/** A queued time cell whose endpoint geometry can serve both child cells. */
interface ICell {
  /** Included opening sample. */
  start: ISample;
  /** Included closing sample. */
  end: ISample;
}

/** Fixed read order for bounds and witness coordinates. */
const AXES: readonly (keyof IAutoMovieVector3)[] = ["x", "y", "z"];

/** One private scratch cell for synchronous binary64 successor reads. */
const BITS: DataView = new DataView(new ArrayBuffer(8));

/**
 * Find a sampled depth violation or prove clearance for a certified affine
 * capsule pair, with explicit work and numerical limits.
 *
 * The swept centreline bounds use both endpoints at each end of a cell. Every
 * point of an affine moving segment is a convex combination of those four
 * inputs. Separation of the resulting axis-aligned boxes supplies a lower
 * distance bound. Each ambiguous cell can contribute a sampled witness and
 * split into two cells. The existing segment query only chooses points to
 * verify. Its rounded distance cannot certify a clear interval.
 *
 * @param props A single admitted source interval with no interior trajectory or
 *   allowance knot.
 * @returns Clearance, one sampled violation with its local bracket, or
 *   explicitly incomplete coverage.
 */
export function measureAutoMovieSweptCapsuleCollision(
  props: Sweep.IProps,
): Sweep.IResult {
  if (
    !(props.endSeconds > props.startSeconds) ||
    props.maxPenetration < 0 ||
    props.maxIntervals < 0
  )
    throw new Error("Invalid swept collision clock or work limit");

  const { first, second } = props;
  if (first === null || second === null)
    return { status: "deferred", reason: "unsupported-motion", compared: 0 };
  if (!admissible(first) || !admissible(second))
    throw new Error("Invalid affine collision capsule");

  const basis: "displayed" | "proxy" =
    first.basis === "displayed" && second.basis === "displayed"
      ? "displayed"
      : "proxy";
  const radius: number = first.radius + second.radius;

  const upper: number = up(up(radius) - props.maxPenetration);
  const lower: number = Math.max(0, down(down(radius) - props.maxPenetration));
  if (upper <= 0) return { status: "clear", basis, compared: 0 };

  const cells: ICell[] = [
    {
      start: sample(first, second, 0),
      end: sample(first, second, 1),
    },
  ];
  let compared: number = 0;
  for (let index: number = 0; index < cells.length; ++index) {
    if (compared === props.maxIntervals)
      return { status: "deferred", reason: "budget", compared };

    const cell: ICell = cells[index]!;
    ++compared;
    if (squaredBoxGap(cell) > up(upper * upper)) continue;

    const fraction: number = (cell.start.at + cell.end.at) / 2;
    const startSeconds: number = blend(
      props.startSeconds,
      props.endSeconds,
      cell.start.at,
    );
    const endSeconds: number = blend(
      props.startSeconds,
      props.endSeconds,
      cell.end.at,
    );
    const seconds: number = blend(
      props.startSeconds,
      props.endSeconds,
      fraction,
    );
    if (!(seconds > startSeconds && seconds < endSeconds))
      return { status: "deferred", reason: "precision", compared };

    const middle: ISample = sample(first, second, fraction);
    let witness: IWitness | null;
    try {
      const nearest: IAutoMovieClosestSegmentPoints =
        closestPointsBetweenSegments(
          middle.first[0].value,
          middle.first[1].value,
          middle.second[0].value,
          middle.second[1].value,
        );
      witness = measureWitness(
        middle,
        nearest,
        lower,
        radius,
        first.radius / radius,
      );
    } catch (_error) {
      return { status: "deferred", reason: "precision", compared };
    }

    if (witness !== null)
      return {
        status: basis === "displayed" ? "confirmed" : "proxy",
        seconds,
        startSeconds,
        endSeconds,
        ...witness,
        compared,
      };

    cells.push(
      { start: cell.start, end: middle },
      { start: middle, end: cell.end },
    );
  }
  return { status: "clear", basis, compared };
}

/** Check the finite, positive-radius geometry supplied by the source. */
function admissible(span: Sweep.ISpan): boolean {
  return (
    (span.basis === "displayed" || span.basis === "proxy") &&
    span.radius > 0
  );
}

/** Enclose an affine read once for both endpoints of each segment. */
function sample(first: Sweep.ISpan, second: Sweep.ISpan, at: number): ISample {
  return {
    at,
    first: [
      samplePoint(first.a0, first.a1, at),
      samplePoint(first.b0, first.b1, at),
    ],
    second: [
      samplePoint(second.a0, second.a1, at),
      samplePoint(second.b0, second.b1, at),
    ],
  };
}

/** Read approximate and bounded values for a world point. */
function samplePoint(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  at: number,
): IPoint {
  return {
    value: {
      x: blend(a.x, b.x, at),
      y: blend(a.y, b.y, at),
      z: blend(a.z, b.z, at),
    },
    bounds: {
      x: blendBounds({ low: a.x, high: a.x }, { low: b.x, high: b.x }, at),
      y: blendBounds({ low: a.y, high: a.y }, { low: b.y, high: b.y }, at),
      z: blendBounds({ low: a.z, high: a.z }, { low: b.z, high: b.z }, at),
    },
  };
}

/** A candidate-only read with exact endpoint ownership. */
function blend(a: number, b: number, at: number): number {
  return at === 0 ? a : at === 1 ? b : a * (1 - at) + b * at;
}

/** Round every coefficient, multiplication and addition outward. */
function blendBounds(a: IRange, b: IRange, at: number): IRange {
  if (at === 0) return a;
  if (at === 1) return b;
  const lo: number = Math.max(0, down(1 - at));
  const hi: number = Math.min(1, up(1 - at));
  const lowA: number = down(a.low * (a.low < 0 ? hi : lo));
  const highA: number = up(a.high * (a.high < 0 ? lo : hi));
  return {
    low: down(lowA + down(b.low * at)),
    high: up(highA + up(b.high * at)),
  };
}

/**
 * Accumulate an outward-rounded lower squared distance between both swept
 * boxes.
 */
function squaredBoxGap(cell: ICell): number {
  let squared: number = 0;
  for (const axis of AXES) {
    const a: IRange = spanAxis(cell.start.first, cell.end.first, axis);
    const b: IRange = spanAxis(cell.start.second, cell.end.second, axis);
    const gap: number = Math.max(0, down(b.low - a.high), down(a.low - b.high));
    if (gap > 0) squared = Math.max(0, down(squared + down(gap * gap)));
  }
  return squared;
}

/** Enclose the projection of a moving segment using its four corners. */
function spanAxis(
  start: ISample["first"],
  end: ISample["first"],
  axis: keyof IAutoMovieVector3,
): IRange {
  const a: IRange = start[0].bounds[axis];
  const b: IRange = start[1].bounds[axis];
  const c: IRange = end[0].bounds[axis];
  const d: IRange = end[1].bounds[axis];
  return {
    low: Math.min(a.low, b.low, c.low, d.low),
    high: Math.max(a.high, b.high, c.high, d.high),
  };
}

/**
 * Verify a candidate using two genuine axis points and a distance upper bound.
 * Candidate fractions are reconstructed and clamped, so errors in the nearest
 * point search can only weaken this proof, never create a violating point.
 */
function measureWitness(
  middle: ISample,
  nearest: IAutoMovieClosestSegmentPoints,
  lower: number,
  radius: number,
  weight: number,
): IWitness | null {
  if (lower <= 0) return null;
  const a: number = along(middle.first, nearest.pointA);
  const b: number = along(middle.second, nearest.pointB);
  let squared: number = 0;
  for (const axis of AXES) {
    const x: IRange = blendBounds(
      middle.first[0].bounds[axis],
      middle.first[1].bounds[axis],
      a,
    );
    const y: IRange = blendBounds(
      middle.second[0].bounds[axis],
      middle.second[1].bounds[axis],
      b,
    );
    const gap: number = Math.max(up(x.high - y.low), up(y.high - x.low));
    squared = up(squared + up(gap * gap));
  }
  if (!(squared < down(lower * lower))) return null;
  const first: IAutoMovieVector3 = pointAlong(middle.first, a);
  const second: IAutoMovieVector3 = pointAlong(middle.second, b);
  return {
    separation:
      Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z) -
      radius,
    point: {
      x: blend(first.x, second.x, weight),
      y: blend(first.y, second.y, weight),
      z: blend(first.z, second.z, weight),
    },
  };
}

/** Read the rounded position of the same axis point whose distance was bounded. */
function pointAlong(segment: ISample["first"], at: number): IAutoMovieVector3 {
  const [first, second]: [IAutoMovieVector3, IAutoMovieVector3] = [
    segment[0].value,
    segment[1].value,
  ];
  return {
    x: blend(first.x, second.x, at),
    y: blend(first.y, second.y, at),
    z: blend(first.z, second.z, at),
  };
}

/** Recover a candidate fraction from the widest represented component. */
function along(segment: ISample["first"], point: IAutoMovieVector3): number {
  let width: number = 0;
  let chosen: keyof IAutoMovieVector3 = "x";
  for (const axis of AXES) {
    const span: number = segment[1].value[axis] - segment[0].value[axis];
    if (Math.abs(span) > Math.abs(width)) {
      width = span;
      chosen = axis;
    }
  }
  if (width === 0) return 0;
  const fraction: number = (point[chosen] - segment[0].value[chosen]) / width;
  return Math.max(0, Math.min(1, fraction));
}

/** Return the next larger binary64 value, including at zero and overflow. */
function up(value: number): number {
  if (value === Infinity) return value;
  if (value === 0) return Number.MIN_VALUE;
  BITS.setFloat64(0, value);
  const bits: bigint = BITS.getBigUint64(0);
  BITS.setBigUint64(0, value > 0 ? bits + 1n : bits - 1n);
  return BITS.getFloat64(0);
}

/** Return the previous binary64 value by reversing order through negation. */
function down(value: number): number {
  return -up(-value);
}
