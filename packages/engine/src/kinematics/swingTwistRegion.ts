import type {
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
  IAutoMovieJointRotationFrame,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieSwingTwistBasis,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { nearestAngleAlias } from "../math/nearestAngleAlias";
import { positiveModulo } from "../math/positiveModulo";
import { swingConeAngle } from "../rom/swingConeAngle";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { toRigAngle } from "../rom/toRigAngle";
import { swingTwistBasis } from "./swingTwistBasis";
import { swingTwistReachBound } from "./swingTwistReachBound";

/**
 * The swing region of a ball joint: the farthest the limb may point from its
 * rest direction along each great circle, read once off the constraint's
 * flexion and abduction intervals and kept.
 *
 * The region is the star of the directions the intervals reach with no twist
 * (and the constraint's `swingDeg`), widened for a proximal twist by the reach
 * of every twist in its interval, and raised so it turns no faster than `SLOPE`
 * with the azimuth. `swingTwistRange` reads its radius and brings a rotation
 * back into it.
 */
export namespace swingTwistRegion {
  /** A constraint's region on a joint's frame, built once. */
  export interface IRegion {
    /** The constraint this region was built for. */
    readonly constraint: IAutoMovieJointConstraint;

    /** The radius on each of `swingTwistBasis.RAYS` great circles, degrees. */
    readonly table: Float64Array;

    /**
     * The farthest the limb may point from rest on any great circle, the bound
     * every great circle's radius is at most, degrees.
     */
    readonly greatest: number;
  }

  /** A joint frame that carries the region prepared for its constraint. */
  export interface IRegional {
    /** Set by `swingTwistRange.prepare`; absent on an unprepared frame. */
    readonly region?: IRegion;
  }

  /**
   * Build the region of a constraint on a joint's frame.
   *
   * @param constraint The constraint.
   * @param joint The joint's axes and rest frame.
   * @returns The region.
   */
  export function prepare(
    constraint: IAutoMovieJointConstraint,
    joint: IAutoMovieJointRotationFrame,
  ): IRegion {
    const table: Float64Array = build(constraint, joint);
    return { constraint, table, greatest: Math.max(...table) };
  }

  /**
   * The region a prepared frame carries, or one built here for a frame that
   * carries none.
   *
   * @param constraint The constraint.
   * @param joint The joint's axes and rest frame.
   * @returns The region.
   */
  export function of(
    constraint: IAutoMovieJointConstraint,
    joint: IAutoMovieJointRotationFrame & IRegional,
  ): IRegion {
    return joint.region?.constraint === constraint
      ? joint.region
      : prepare(constraint, joint);
  }
}

/**
 * The fastest the region's radius may change with the azimuth, degrees per
 * degree (provisional: three, so a projection's step is at most about three
 * times the azimuth's step).
 */
const SLOPE: number = 3;

/** The step of the scan for the farthest reached swing on a ray, degrees. */
const SCAN: number = 0.5;

/**
 * The bisections that refine it: twenty halve half a degree to under a
 * millionth.
 */
const HALVINGS: number = 20;

/**
 * How far before a grid step, degrees, the closed form's interval of reached
 * swings must begin for the step's cell to count as inside from the step on:
 * far above the interval's own margins (a sine widened by 1e-9 moves an end by
 * up to 0.003 degrees beside a quarter turn), far under the grid's half
 * degree.
 */
const COVERED: number = 0.01;

/** The region's radius on each ray: reached, widened and raised. */
function build(
  constraint: IAutoMovieJointConstraint,
  joint: IAutoMovieJointRotationFrame,
): Float64Array {
  // The limb points no farther from rest than its stated reach, which keeps
  // the rest direction's antipode outside (`ISwingTwist.reach`).
  const cap: number = constraint.swingTwist?.reach ?? 180;
  return raise(widen(reach(constraint, joint), constraint, joint)).map(
    (radius: number): number => Math.min(cap, radius),
  );
}

/**
 * The farthest swing along each ray at which the flexion and abduction
 * intervals reach the direction, found by a scan from the far end in `SCAN`
 * degree steps toward the rest direction and refined by `HALVINGS` bisections.
 */
function reach(
  clinical: IAutoMovieJointConstraint,
  joint: IAutoMovieJointRotationFrame,
): Float64Array {
  const rayBasis: IAutoMovieSwingTwistBasis.IBasis = swingTwistBasis.of(
    joint.axes,
  );
  const flexionFirst: boolean =
    joint.axes.rotationOrder === "flexion-abduction-twist";

  // The reach equations use flexion as the inner factor. Exchange the two
  // swing axes and their clinical ranges for F·A, keeping the ray basis.
  const basis: IAutoMovieSwingTwistBasis.IBasis = flexionFirst
    ? { ...rayBasis, f: rayBasis.a, a: rayBasis.f }
    : rayBasis;
  const constraint: IAutoMovieJointConstraint = flexionFirst
    ? { ...clinical, flexion: clinical.abduction, abduction: clinical.flexion }
    : clinical;
  const frame: IAutoMovieRestFrame | undefined =
    flexionFirst && joint.frame !== undefined
      ? { flexion: joint.frame.abduction, abduction: joint.frame.flexion }
      : joint.frame;
  const table: Float64Array = new Float64Array(swingTwistBasis.RAYS);
  const across: number = Vector3.dot(Vector3.cross(basis.f, basis.u), basis.a);

  // No swing past the intervals' closed-form reach on a ray can be inside
  // (`swingTwistReachBound`), and no grid step past the farthest one an
  // interval of reached swings holds, so the scan starts at that step: the
  // same steps from there on, the same bracket, the same table. An arm's
  // antipode is reached on every great circle, in an interval far narrower
  // than a step, and the scan passed it by a hundred steps on half of them.
  const bound:
    | ((
        cosine: number,
        sine: number,
        span?: swingTwistReachBound.ISpan,
      ) => number)
    | null = swingTwistReachBound.prepare(constraint, frame, basis, across);
  const span: swingTwistReachBound.ISpan = {
    grid: SCAN,
    cell: 0,
    low: NaN,
    high: NaN,
  };

  // Where the swing cone removes no direction the intervals reach, the
  // reached swings on a ray are the closed form's own intervals, so the one
  // that holds the scan's step places the scan's answer (`latticed`).
  const free: boolean = bound !== null && coneFree(constraint);

  // The flexion's turn about the basis's flexion axis, on that one axis for
  // every test of the build: the axis's direction and length prepared once,
  // each angle's quaternion the one Quaternion.fromAxisAngle gives.
  const flexed: (degrees: number) => IAutoMovieQuaternion =
    Quaternion.prepareAxisAngle(basis.f);
  for (let ray: number = 0; ray < swingTwistBasis.RAYS; ++ray) {
    const azimuth: number = (360 * ray) / swingTwistBasis.RAYS;
    const direction: (swing: number) => IAutoMovieVector3 =
      swingTwistBasis.prepareRay(rayBasis, azimuth);
    const inside: (swing: number) => boolean = (swing: number): boolean =>
      reached(constraint, frame, basis, direction(swing), across, flexed, free);
    const angle: number = azimuth / swingTwistBasis.DEG;
    const farthest: number =
      bound === null ? 180 : bound(Math.cos(angle), Math.sin(angle), span);
    if (free) {
      const placed: number | null = latticed(
        inside,
        span.cell,
        span.low,
        span.high,
      );
      if (placed !== null) {
        table[ray] = placed;
        continue;
      }
    }
    const start: number = Math.min(
      180 - SCAN,
      Math.ceil(farthest / SCAN) * SCAN,
      bound === null ? Infinity : span.cell,
    );
    let hi: number = start + SCAN;
    let lo: number = 0;
    for (let swing: number = start; swing > 0; swing -= SCAN) {
      if (inside(swing)) {
        lo = swing;
        break;
      }
      hi = swing;
    }
    for (let i: number = 0; i < HALVINGS && lo > 0; ++i) {
      const mid: number = (lo + hi) / 2;
      if (inside(mid)) lo = mid;
      else hi = mid;
    }
    table[ray] = lo;
  }
  return table;
}

/**
 * The scan's own answer on a ray, placed from the closed form instead of
 * searched for, or null when the closed form does not place it.
 *
 * The scan stops at the farthest grid step inside and bisects the cell above it
 * `HALVINGS` times, so its answer is that step plus a whole number of `SCAN / 2
 * ** HALVINGS`: the farthest point of that lattice that is inside with the next
 * one outside, wherever the cell is inside up to one swing and outside past it.
 * The closed form gives that (`swingTwistReachBound.ISpan`): `cell` is the
 * farthest grid step an interval of reached swings holds, that interval covers
 * the cell from the step when it begins at least `COVERED` before it, nothing
 * is reached past the interval's end `ended` inside the cell, and the cell's
 * top is a grid step no interval holds. The lattice point is sought from the
 * one at or under `ended` downward, by steps that double and a bisection of the
 * lattice between the last point outside and the first inside. Every answer is
 * read off the scan's own test, so it is the scan's.
 */
function latticed(
  inside: (swing: number) => boolean,
  cell: number,
  covered: number,
  ended: number,
): number | null {
  const cells: number = 2 ** HALVINGS;
  if (!(cell > 0) || !(covered + COVERED <= cell) || !(ended >= cell))
    return null;
  if (!inside(cell)) return null;

  // The lattice point known outside: the first past the interval's end, or
  // the cell's top, which the scan takes as outside without reading it.
  let high: number = Math.min(
    cells,
    Math.floor((ended - cell) / (SCAN / cells)) + 1,
  );
  let low: number = 0;
  for (let back: number = 1; high - back > low; back *= 2) {
    if (inside(cell + (high - back) * (SCAN / cells))) {
      low = high - back;
      break;
    }
    high -= back;
  }
  while (high - low > 1) {
    const middle: number = Math.floor((low + high) / 2);
    if (inside(cell + middle * (SCAN / cells))) low = middle;
    else high = middle;
  }
  return cell + low * (SCAN / cells);
}

/**
 * Whether the swing cone removes no direction the flexion and abduction
 * intervals reach: the greatest combined swing over the box, `2 acos(cos(f / 2)
 * cos(a / 2))` at the least product of the two half-angle cosines, is within
 * the cone, or the constraint states none.
 */
function coneFree(constraint: IAutoMovieJointConstraint): boolean {
  if (typeof constraint.swingDeg !== "number") return true;
  const flexion: IAutoMovieAngleRange | null = constraint.flexion;
  const abduction: IAutoMovieAngleRange | null = constraint.abduction;
  if (flexion === null || abduction === null) return false;
  const cosines = (range: IAutoMovieAngleRange): [number, number] => {
    let least: number = Math.min(
      Math.cos(range.min / 2 / swingTwistBasis.DEG),
      Math.cos(range.max / 2 / swingTwistBasis.DEG),
    );
    let most: number = Math.max(
      Math.cos(range.min / 2 / swingTwistBasis.DEG),
      Math.cos(range.max / 2 / swingTwistBasis.DEG),
    );

    // A half angle passing a whole number of half turns reaches 1 or -1: an
    // even turn gives 1 and an odd one -1. Only the first two turns the
    // range holds can change either, since they already hold both parities;
    // reading the rest would walk a range of any width one turn at a time.
    const turn: number = Math.ceil(range.min / 360);
    for (const held of [turn, turn + 1])
      if (held * 360 <= range.max) {
        if (held % 2 === 0) most = 1;
        else least = -1;
      }
    return [least, most];
  };
  const [fLow, fHigh]: [number, number] = cosines(flexion);
  const [aLow, aHigh]: [number, number] = cosines(abduction);
  const product: number = Math.min(
    fLow * aLow,
    fLow * aHigh,
    fHigh * aLow,
    fHigh * aHigh,
  );
  return (
    (Math.acos(swingTwistBasis.clamp(product, -1, 1)) * 360) / Math.PI <=
    constraint.swingDeg
  );
}

/**
 * A proximal twist turns about the rest axis outside the flexion and the
 * abduction, so it carries every reached direction around the rest direction by
 * its own angle: on a hip flexed forward it swings the thigh sideways. The
 * directions its interval reaches are then those of no twist turned by any
 * twist in it, which shifts each ray's reach along the azimuth.
 */
function widen(
  table: Float64Array,
  constraint: IAutoMovieJointConstraint,
  joint: IAutoMovieJointRotationFrame,
): Float64Array {
  const twist: IAutoMovieAngleRange | null = constraint.twist;
  if (
    joint.axes.rotationOrder === "flexion-abduction-twist" ||
    joint.axes.twistPlacement === "distal" ||
    twist === null
  )
    return table;
  const ends: readonly number[] = [
    toRigAngle(twist.min, joint.frame?.twist)!,
    toRigAngle(twist.max, joint.frame?.twist)!,
  ];
  const low: number = Math.min(...ends);
  const high: number = Math.max(...ends);

  // A twist interval of a whole turn carries every reached direction all the
  // way around the rest axis, so every ray reaches the farthest of all; its
  // shifts would visit every ray anyway, one degree at a time over a width
  // that may be any finite size.
  if (high - low >= 360)
    return new Float64Array(swingTwistBasis.RAYS).fill(Math.max(...table));
  const width: number = 360 / swingTwistBasis.RAYS;
  const turned: Float64Array = new Float64Array(swingTwistBasis.RAYS);
  for (let ray: number = 0; ray < swingTwistBasis.RAYS; ++ray) {
    let most: number = table[ray]!;

    // Narrower than a turn, the interval holds at most RAYS + 1 shifts a
    // width apart; the count also ends a walk whose `shift += width` no
    // longer moves a shift of magnitude past 2^53 widths.
    for (
      let shift: number = low, count: number = 0;
      shift <= high + 1e-9 && count <= swingTwistBasis.RAYS;
      shift += width, ++count
    ) {
      const from: number = positiveModulo(
        Math.round(ray - shift / width),
        swingTwistBasis.RAYS,
      );
      most = Math.max(most, table[from]!);
    }
    turned[ray] = most;
  }
  return turned;
}

/**
 * Where the region's edge runs along a ray the farthest reach jumps between two
 * rays, and a projection along the rays would jump with it. So the radius is
 * raised to the least function at or above it that turns no faster than `SLOPE`
 * degrees of radius per degree of azimuth: the region gains a sliver beside
 * such an edge and loses nothing.
 *
 * A ray `apart` rays away lends `table[other] - SLOPE * apart * width`, which
 * is not positive once `SLOPE * apart * width` reaches the table's greatest
 * radius, and the raised radius is never below zero: only the rays nearer than
 * that are read, each by the same expression, so every value is the one all
 * rays would give.
 */
function raise(table: Float64Array): Float64Array {
  const rays: number = swingTwistBasis.RAYS;
  const raised: Float64Array = new Float64Array(rays);
  const width: number = 360 / rays;
  let top: number = 0;
  for (let ray: number = 0; ray < rays; ++ray) top = Math.max(top, table[ray]!);
  for (let ray: number = 0; ray < rays; ++ray) {
    let most: number = 0;
    for (let apart: number = 0; 2 * apart <= rays; ++apart) {
      const drop: number = SLOPE * apart * width;
      if (!(drop < top)) break;
      most = Math.max(
        most,
        table[(ray + apart) % rays]! - drop,
        table[(ray + rays - apart) % rays]! - drop,
      );
    }
    raised[ray] = Math.min(180, most);
  }
  return raised;
}

/**
 * Whether the flexion and abduction intervals, with no twist and within the
 * swing cone, reach a direction in either reading. The caller maps its inner
 * and outer factors to flexion and abduction respectively. The mapped flexion
 * turns `u` within the plane normal to the flexion axis, and the abduction then
 * turns it about its own axis, which keeps the part along that axis, so that
 * part gives the flexion twice and the abduction follows for each.
 */
function reached(
  constraint: IAutoMovieJointConstraint,
  frame: IAutoMovieRestFrame | undefined,
  basis: IAutoMovieSwingTwistBasis.IBasis,
  direction: IAutoMovieVector3,
  across: number,
  flexed: (degrees: number) => IAutoMovieQuaternion,
  free: boolean,
): boolean {
  const flexion: IAutoMovieAngleRange = constraint.flexion!;
  const abduction: IAutoMovieAngleRange = constraint.abduction!;
  const first: number =
    Math.asin(
      swingTwistBasis.clamp(Vector3.dot(direction, basis.a) / across, -1, 1),
    ) * swingTwistBasis.DEG;
  let projected: IAutoMovieVector3 | undefined;
  for (const f of [first, 180 - first]) {
    // A branch outside the flexion interval is unreachable for every abduction.
    const clinical: number = nearestAngleAlias(
      toClinicalAngle(f, frame?.flexion)!,
      flexion,
    );
    if (!(clinical >= flexion.min && clinical <= flexion.max)) continue;
    const swung: IAutoMovieVector3 = Quaternion.rotateVector(
      flexed(f),
      basis.u,
    );
    const from: IAutoMovieVector3 = flat(swung, basis.a);
    const to: IAutoMovieVector3 = (projected ??= flat(direction, basis.a));
    if (Vector3.length(from) < 1e-9 || Vector3.length(to) < 1e-9) {
      // On the abduction axis any abduction keeps the direction.
      for (const a of [
        abduction.min,
        abduction.max,
        (abduction.min + abduction.max) / 2,
      ])
        if (
          admits(
            constraint,
            frame,
            free,
            abduction,
            clinical,
            toRigAngle(a, frame?.abduction)!,
          )
        )
          return true;
      continue;
    }
    const a: number =
      Math.atan2(
        Vector3.dot(basis.a, Vector3.cross(from, to)),
        Vector3.dot(from, to),
      ) * swingTwistBasis.DEG;
    if (admits(constraint, frame, free, abduction, clinical, a)) return true;
  }
  return false;
}

/** Test one clinical reading with the same frame, interval and swing-cone order. */
function admits(
  constraint: IAutoMovieJointConstraint,
  frame: IAutoMovieRestFrame | undefined,
  free: boolean,
  abduction: IAutoMovieAngleRange,
  f: number,
  rigAbduction: number,
): boolean {
  const a: number = nearestAngleAlias(
    toClinicalAngle(rigAbduction, frame?.abduction)!,
    abduction,
  );
  return (
    a >= abduction.min &&
    a <= abduction.max &&
    (free ||
      typeof constraint.swingDeg !== "number" ||
      swingConeAngle(f, a) <= constraint.swingDeg)
  );
}

/** A vector with its part along a unit axis taken off. */
function flat(
  v: IAutoMovieVector3,
  axis: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.subtract(v, Vector3.scale(axis, Vector3.dot(v, axis)));
}
