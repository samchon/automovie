import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanPosture } from "./IHumanPosture";

/**
 * Compose the existing world-Y yaw, local-X pitch and local-Z roll using
 * three private fixed-axis readers. Angle reads and product grouping remain
 * yaw, then pitch, then roll, followed by the original final normalization.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States degree axes, original evaluation/product order, private fixed geometry, fresh quaternion ownership and angles' original forward/left/up atan2/asin inverse.
 * @evidence contracts/development/implementation.md#principled-implementation The existing heading is Ry(yaw) multiplied by Rx(pitch) times Rz(roll), then normalized. Quaternion.prepareAxisAngle performs the same half-angle arithmetic while reusing each immutable unit axis's direction and length.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This numerical owner contains the original heading and inverse formulas; resolver facades/rigid source consumers share them while clinical/goal admission remains with the resolver.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No angle wrapping, projection, tolerance, multiplication regrouping or target substitution is added. All original angle values, signed zero and nonfinite arithmetic still reach the same quaternion owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three fixed-axis preparations occur lazily once; heading retains original trigonometry/products/normalization without rebuilding axis geometry. angles retains its three vector rotations and original scalar inverse formulas. Both operations are constant work and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Unit-axis literals remain private and unchanged, proving reusable direction/length independently of every current yaw/pitch/roll input; each call reads angles in original order and returns fresh numerical output.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The module owns exactly three tiny axis-reader states for its lifetime. No body, authoring record, completed quaternion, reader loan, result history or handle is retained.
 */
export function humanPostureHeading(posture: Pick<IHumanPosture, "yaw" | "pitch" | "roll">): IAutoMovieQuaternion {
  return Quaternion.normalize(Quaternion.multiply(YAW(posture.yaw), Quaternion.multiply(PITCH(posture.pitch), ROLL(posture.roll))));
}

/**
 * Original numerical inverse of the shared heading convention.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines angles' unit root input, degree output, original forward/left/up readings and unchanged asin clamp.
 * @evidence contracts/development/design.md#principled-representation Rotated unit axes determine the same yaw/pitch/roll readings as the existing resolver formula; no source or result state is represented.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the resolver's angles facade consumes this inverse; the function half owns heading composition and its private fixed-axis preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Adds no gimbal branch, angle convention, rounding or quaternion normalization to the original inverse.
 */
export namespace humanPostureHeading {
  /** Read the original three world axes, then apply the same degree atan2/asin formulas in order. */
  export function angles(rotation: IAutoMovieQuaternion): Pick<IHumanPosture, "yaw" | "pitch" | "roll"> {
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(rotation, { x: 0, y: 0, z: 1 });
    const left: IAutoMovieVector3 = Quaternion.rotateVector(rotation, { x: 1, y: 0, z: 0 });
    const up: IAutoMovieVector3 = Quaternion.rotateVector(rotation, { x: 0, y: 1, z: 0 });
    const degrees: number = 180 / Math.PI;
    return { yaw: Math.atan2(forward.x, forward.z) * degrees,
      pitch: -Math.asin(Math.max(-1, Math.min(1, forward.y))) * degrees,
      roll: Math.atan2(left.y, up.y) * degrees };
  }
}

/** Private world-up yaw geometry. */
const YAW: ReturnType<typeof Quaternion.prepareAxisAngle> = Quaternion.prepareAxisAngle({ x: 0, y: 1, z: 0 });
/** Private intrinsic left-axis pitch geometry. */
const PITCH: ReturnType<typeof Quaternion.prepareAxisAngle> = Quaternion.prepareAxisAngle({ x: 1, y: 0, z: 0 });
/** Private intrinsic forward-axis roll geometry. */
const ROLL: ReturnType<typeof Quaternion.prepareAxisAngle> = Quaternion.prepareAxisAngle({ x: 0, y: 0, z: 1 });
