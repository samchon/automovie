import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";

/**
 * Prepare the measured two-bone geometry and fixed heading of a stepping shank.
 *
 * @param body The unchanged body's thigh and shank lengths, metres.
 * @param heading The unchanged heading toward which its knee bends, degrees.
 * @returns The original forward shank lean, degrees, for each actual world-metre hip and ankle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed body/heading, world-metre varying joints, forward-positive degree result and unchanged-body lifetime; bounded additionally reports an actual reach outside the body's total leg length before knee geometry.
 * @evidence contracts/development/implementation.md#principled-implementation Retains the cosine-law knee circle and the original least-absolute swing satisfying the foot's no-twist condition, followed by the same shank forward-angle projection. The bounded companion compares the same actual hip-to-ankle length against thigh+shank before this shared geometry, as the rocker room rule already does. The geometry is evaluated on the points' components with each original product, sum and quotient in its original order; the engine's `Vector3.distance` is its `length(subtract(a, b))`, and a perpendicular whose square sum lies in `[2^-1000, 2^1000]` has the engine's ordinary square-root length, any other being read by the engine's `length` and `normalize` themselves.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One private measured/axis preparation owns the full knee geometry; raw and bounded readers differ only by the original reach screen before invoking it with their actual points and distance.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original multiply/add grouping, degeneracy thresholds, cosine clamp, first equal-swing choice and knee construction; no probe, range or sampled result changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation shares two length squares and the heading/lateral axes; each trial retains the full bounded two-bone geometry without repeating fixed trigonometry, wraps only the nearer of the two knee-circle intersections where their principal readings decide which it is (both within DECIDED), and builds no vector record on a perpendicular of ordinary size. A bounded rocker room trial computes its actual length once for both the original reach screen and knee geometry instead of twice. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller binds one unchanged measured body and heading for its rocker or stance; changing either requires another reader, while every actual hip/ankle is evaluated.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One caller-owned closure retains fixed lengths and private axes until its stance/search releases it, with no hip, ankle, angle or time history; a reader borrows its two points for the call and keeps neither.
 */
export function prepareWalkLegLean(
  body: IAutoMovieMotionHumanBody,
  heading: number,
): (hip: IAutoMovieVector3, ankle: IAutoMovieVector3) => number {
  const fixed: IGeometry = geometry(body, heading);
  return (hip: IAutoMovieVector3, ankle: IAutoMovieVector3): number =>
    fixed.at(hip, ankle, Vector3.distance(ankle, hip));
}

/**
 * The same shank geometry with the rocker's original actual reach screen.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the unchanged body/heading and outside-total-leg-length result used by heel-rise room evaluation.
 * @evidence contracts/development/design.md#principled-representation One actual joint reader returns either the original shank lean or an explicit outside-reach absence; it does not claim a fitted limb or relaxed bound.
 * @evidence contracts/development/design.md#minimal-and-owned-surface bounded serves actual heel-rise room trials and shares this module's one knee geometry owner with ordinary lean.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the exact original greater-than thigh+shank comparison, followed by unchanged knee arithmetic; no supplied distance or solved-result token can bypass the actual world-joint reading.
 */
export namespace prepareWalkLegLean {
  /**
   * Bind the body's total length and heading, then compute each actual joint
   * length once. Return undefined only beyond the same thigh+shank
   * reach the rocker room rejected; otherwise evaluate ordinary lean. Release
   * fixed geometry with the synchronous stance/search, without query history.
   */
  export function bounded(
    body: IAutoMovieMotionHumanBody,
    heading: number,
  ): (hip: IAutoMovieVector3, ankle: IAutoMovieVector3) => number | undefined {
    const fixed: IGeometry = geometry(body, heading);
    return (hip: IAutoMovieVector3, ankle: IAutoMovieVector3): number | undefined => {
      const d: number = Vector3.distance(ankle, hip);
      return d > fixed.span ? undefined : fixed.at(hip, ankle, d);
    };
  }
}

/** Private measured prerequisites and one actual knee-circle calculation. */
interface IGeometry {
  /** The thigh and the shank end to end, metres. */
  span: number;

  /** The shank's forward lean, degrees, for a hip, an ankle and their distance, metres. */
  at: (hip: IAutoMovieVector3, ankle: IAutoMovieVector3, distance: number) => number;
}

/** An angle, radians, as its principal value in (-pi, pi]. */
function wrap(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

/** A full turn, radians. */
const TURN: number = 2 * Math.PI;

/**
 * How far apart, radians, two swings' magnitudes read by `x - 2 pi round(x / 2 pi)`
 * must lie for that reading to decide which of their exact wraps
 * (`atan2(sin x, cos x)`) is nearer zero: each reading of an angle within
 * three half turns (the middle's atan2 plus the half's acos) is within a
 * few rounding units, about 1e-15, of the exact wrap, far under this.
 */
const DECIDED: number = 1e-9;

/** The least and the greatest square sum whose square root is the engine's ordinary vector length (`Vector3.distance`'s own bounds). */
const ORDINARY_MIN: number = 2 ** -1000;
const ORDINARY_MAX: number = 2 ** 1000;

/** Prepare fixed terms only; actual joint vectors/distances remain call-local. */
function geometry(body: IAutoMovieMotionHumanBody, heading: number): IGeometry {
  const a: number = body.measure.thigh;
  const b: number = body.measure.shank;
  const aa: number = a * a;
  const bb: number = b * b;
  const forward: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw: heading },
    { x: 0, y: 0, z: 1 },
  );
  const fx: number = forward.x;
  const fy: number = forward.y;
  const fz: number = forward.z;

  // The lateral axis: the forward axis turned a quarter about +Y.
  const lx: number = forward.z;
  const ly: number = 0;
  const lz: number = -forward.x;
  const at: IGeometry["at"] = (hip: IAutoMovieVector3, ankle: IAutoMovieVector3, d: number): number => {
    if (d < 1e-6) return 0;

    // The hip-to-ankle axis, and the knee circle's centre and radius on it.
    const inverse: number = 1 / d;
    const ux: number = (ankle.x - hip.x) * inverse;
    const uy: number = (ankle.y - hip.y) * inverse;
    const uz: number = (ankle.z - hip.z) * inverse;
    const along: number = (aa - bb + d * d) / (2 * d);
    const across: number = Math.sqrt(Math.max(0, aa - along * along));

    // The forward axis's part perpendicular to that axis, as a unit.
    const ahead: number = fx * ux + fy * uy + fz * uz;
    let px: number = fx - ux * ahead;
    let py: number = fy - uy * ahead;
    let pz: number = fz - uz * ahead;
    const squared: number = px * px + py * py + pz * pz;
    if (squared >= ORDINARY_MIN && squared <= ORDINARY_MAX) {
      const norm: number = Math.sqrt(squared);
      if (norm < 1e-9) return 0;
      const scale: number = 1 / norm;
      px *= scale;
      py *= scale;
      pz *= scale;
    } else {
      // Outside the ordinary range the engine's own length and unit are read.
      const perpendicular: IAutoMovieVector3 = { x: px, y: py, z: pz };
      if (Vector3.length(perpendicular) < 1e-9) return 0;
      const unit: IAutoMovieVector3 = Vector3.normalize(perpendicular);
      px = unit.x;
      py = unit.y;
      pz = unit.z;
    }

    // The shank's forward axis must be perpendicular to the foot's lateral
    // axis; choose the same nearer of the two knee-circle intersections.
    const sx: number = uy * pz - uz * py;
    const sy: number = uz * px - ux * pz;
    const sz: number = ux * py - uy * px;
    const p: number = px * lx + py * ly + pz * lz;
    const q: number = sx * lx + sy * ly + sz * lz;
    const size: number = Math.hypot(p, q);
    let swing: number = 0;
    if (size > 1e-9 && d - along > 1e-9) {
      const middle: number = Math.atan2(q, p);
      const half: number = Math.acos(
        Math.min(1, Math.max(-1, (across * (ux * lx + uy * ly + uz * lz)) / ((along - d) * size))),
      );
      // The nearer of the two is read off principal values first: where
      // their magnitudes differ by more than `DECIDED` the choice is that of
      // the exact wraps, and only that one is wrapped; within it both are.
      const near: number = middle + half;
      const far: number = middle - half;
      const gap: number =
        Math.abs(near - TURN * Math.round(near / TURN)) -
        Math.abs(far - TURN * Math.round(far / TURN));
      if (gap < -DECIDED) swing = wrap(near);
      else if (gap > DECIDED) swing = wrap(far);
      else {
        const one: number = wrap(near);
        const other: number = wrap(far);
        swing = Math.abs(one) <= Math.abs(other) ? one : other;
      }
    }

    // The knee on its circle at that swing, and the shank from the ankle to it.
    const cosine: number = Math.cos(swing);
    const sine: number = Math.sin(swing);
    const kx: number = hip.x + (ux * along + (px * cosine + sx * sine) * across);
    const ky: number = hip.y + (uy * along + (py * cosine + sy * sine) * across);
    const kz: number = hip.z + (uz * along + (pz * cosine + sz * sine) * across);
    const shankX: number = kx - ankle.x;
    const shankY: number = ky - ankle.y;
    const shankZ: number = kz - ankle.z;
    return (Math.atan2(shankX * fx + shankY * fy + shankZ * fz, shankY) * 180) / Math.PI;
  };
  return { span: a + b, at };
}
