import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";

/**
 * Prepare the measured two-bone geometry and fixed heading of a stepping shank.
 *
 * @param body The fixed body's thigh and shank lengths, metres.
 * @param heading The fixed heading toward which its knee bends, degrees.
 * @returns The forward shank lean, degrees, for each world-metre hip and ankle.
 */
export function prepareWalkLegLean(
  body: IAutoMovieMotionHumanBody,
  heading: number,
): (hip: IAutoMovieVector3, ankle: IAutoMovieVector3) => number {
  const fixed: IGeometry = geometry(body, heading);
  return (hip: IAutoMovieVector3, ankle: IAutoMovieVector3): number =>
    fixed.at(hip, ankle, Vector3.distance(ankle, hip));
}

/** The same shank geometry behind the rocker's reach screen. */
export namespace prepareWalkLegLean {
  /**
   * The shank lean behind a reach screen: bind the body's total leg length and
   * heading, then compute each hip-to-ankle length once.
   *
   * @param body The body's thigh and shank lengths, metres.
   * @param heading The heading toward which its knee bends, degrees.
   * @returns For a world-metre hip and ankle, undefined beyond thigh plus
   *   shank, else the forward shank lean in degrees.
   */
  export function bounded(
    body: IAutoMovieMotionHumanBody,
    heading: number,
  ): (hip: IAutoMovieVector3, ankle: IAutoMovieVector3) => number | undefined {
    const fixed: IGeometry = geometry(body, heading);
    return (
      hip: IAutoMovieVector3,
      ankle: IAutoMovieVector3,
    ): number | undefined => {
      const d: number = Vector3.distance(ankle, hip);
      return d > fixed.span ? undefined : fixed.at(hip, ankle, d);
    };
  }
}

/** Private measured prerequisites and one knee-circle calculation. */
interface IGeometry {
  /** The thigh and the shank end to end, metres. */
  span: number;

  /**
   * The shank's forward lean, degrees, for a hip, an ankle and their distance,
   * metres.
   */
  at: (
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    distance: number,
  ) => number;
}

/** An angle, radians, as its principal value in (-pi, pi]. */
function wrap(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

/** A full turn, radians. */
const TURN: number = 2 * Math.PI;

/**
 * How far apart, radians, two swings' magnitudes read by `x - 2 pi round(x / 2
 * pi)` must lie for that reading to decide which of their exact wraps
 * (`atan2(sin x, cos x)`) is nearer zero: each reading of an angle within three
 * half turns (the middle's atan2 plus the half's acos) is within a few rounding
 * units, about 1e-15, of the exact wrap, far under this.
 */
const DECIDED: number = 1e-9;

/**
 * Prepare a body's and heading's fixed terms; joint vectors and distances stay
 * call-local.
 *
 * @param body The body's thigh and shank lengths, metres.
 * @param heading The heading toward which the knee bends, degrees.
 * @returns The total leg length and the knee-circle reader.
 */
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
  // The guards below are numeric: a micrometre of reach and 1e-9 of a unit
  // vector lie far under any posed leg, and only keep the divisions finite.
  const at: IGeometry["at"] = (
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    d: number,
  ): number => {
    if (d < 1e-6) return 0;

    // The hip-to-ankle axis, and the knee circle's centre and radius on it.
    const inverse: number = 1 / d;
    const ux: number = (ankle.x - hip.x) * inverse;
    const uy: number = (ankle.y - hip.y) * inverse;
    const uz: number = (ankle.z - hip.z) * inverse;
    const along: number = (aa - bb + d * d) / (2 * d);

    // The no-twist constraint below fixes the knee's lateral coordinate.
    // Intersect the thigh and shank spheres in that vertical cross section
    // and take the knee further toward the projected forward axis.
    const fore: number = -d * (fx * ux + fz * uz);
    const up: number = -d * uy;
    const lateral: number = -(lx * ux + lz * uz);
    const planeSquared: number = fore * fore + up * up;
    if (planeSquared > 1e-12 && Math.abs(up) > 1e-6 && d - along > 1e-9) {
      // Substituting the original no-twist cosine into the knee circle gives
      // this lateral component of the ankle-to-knee vector.
      const slip: number = (lateral * bb) / (d - along);
      const thigh: number = aa - (slip - lateral * d) ** 2;
      const shank: number = bb - slip * slip;
      const projection: number =
        (shank - thigh + planeSquared) / (2 * planeSquared);
      const radial: number = shank / planeSquared - projection * projection;
      // Keep the general knee-circle branch at tangencies, at a lateral
      // constraint outside the circle, and where the two knees tie.
      if (radial > 1e-12) {
        const side: number = Math.sign(up) * Math.sqrt(radial);
        return (
          (Math.atan2(
            projection * fore + side * up,
            projection * up - side * fore,
          ) *
            180) /
          Math.PI
        );
      }
    }

    const across: number = Math.sqrt(Math.max(0, aa - along * along));

    // The forward axis's part perpendicular to that axis, as a unit. Both
    // axes are units, so its squared length `1 - ahead^2` lies in [0, 1]; a
    // leg along the forward axis leaves no plane to bend in.
    const ahead: number = fx * ux + fy * uy + fz * uz;
    const rx: number = fx - ux * ahead;
    const ry: number = fy - uy * ahead;
    const rz: number = fz - uz * ahead;
    const norm: number = Math.sqrt(rx * rx + ry * ry + rz * rz);
    if (norm < 1e-9) return 0;
    const scale: number = 1 / norm;
    const px: number = rx * scale;
    const py: number = ry * scale;
    const pz: number = rz * scale;

    // The shank's forward axis must be perpendicular to the foot's lateral
    // axis; choose the nearer of the two knee-circle intersections.
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
        Math.min(
          1,
          Math.max(
            -1,
            (across * (ux * lx + uy * ly + uz * lz)) / ((along - d) * size),
          ),
        ),
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
    const kx: number =
      hip.x + (ux * along + (px * cosine + sx * sine) * across);
    const ky: number =
      hip.y + (uy * along + (py * cosine + sy * sine) * across);
    const kz: number =
      hip.z + (uz * along + (pz * cosine + sz * sine) * across);
    const shankX: number = kx - ankle.x;
    const shankY: number = ky - ankle.y;
    const shankZ: number = kz - ankle.z;
    return (
      (Math.atan2(shankX * fx + shankY * fy + shankZ * fz, shankY) * 180) /
      Math.PI
    );
  };
  return { span: a + b, at };
}
