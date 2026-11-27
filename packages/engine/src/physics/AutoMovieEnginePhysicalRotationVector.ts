import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../math/AutoMovieEngineVector3";

/**
 * SO(3) exponential coordinates and their left-Jacobian inverse retain the
 * actual angular derivative at a pose handoff, including compound rotations.
 */
export namespace AutoMovieEnginePhysicalRotationVector {
  /** Shortest rotation vector in radians, canonical across quaternion sign. */
  export function log(rotation: IAutoMovieQuaternion): IAutoMovieVector3 {
    const norm: number = Math.hypot(rotation.x, rotation.y, rotation.z);
    const sign: number = rotation.w < 0 ? -1 : 1;
    const scale: number =
      norm > 1e-12
        ? (2 * Math.atan2(norm, Math.abs(rotation.w)) * sign) / norm
        : 2 * sign;
    return {
      x: rotation.x * scale,
      y: rotation.y * scale,
      z: rotation.z * scale,
    };
  }
  /**
   * Exponentiate a finite rotation vector, without an Euler-angle
   * decomposition.
   */
  export function exp(vector: IAutoMovieVector3): IAutoMovieQuaternion {
    const angle: number = AutoMovieEngineVector3.length(vector);
    const scale: number = angle > 1e-12 ? Math.sin(angle / 2) / angle : 0.5;
    return {
      x: vector.x * scale,
      y: vector.y * scale,
      z: vector.z * scale,
      w: Math.cos(angle / 2),
    };
  }
  /**
   * Convert a spatial angular velocity into the derivative of a shortest
   * rotation vector. The cot(theta/2) form stays finite at pi.
   */
  export function derivative(
    vector: IAutoMovieVector3,
    velocity: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const angle: number = AutoMovieEngineVector3.length(vector);
    const factor: number =
      angle > 1e-5
        ? (1 - angle / (2 * Math.tan(angle / 2))) / (angle * angle)
        : 1 / 12 + (angle * angle) / 720;
    const cross: IAutoMovieVector3 = AutoMovieEngineVector3.cross(vector, velocity);
    return AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.subtract(velocity, AutoMovieEngineVector3.scale(cross, 0.5)),
      AutoMovieEngineVector3.scale(AutoMovieEngineVector3.cross(vector, cross), factor),
    );
  }
  /**
   * Left-Jacobian action converts exponential-coordinate derivatives back to
   * spatial angular velocity.
   */
  export function velocity(
    vector: IAutoMovieVector3,
    derivative: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const angle: number = AutoMovieEngineVector3.length(vector);
    const first: number =
      angle > 1e-5
        ? (1 - Math.cos(angle)) / (angle * angle)
        : 0.5 - (angle * angle) / 24;
    const second: number =
      angle > 1e-5
        ? (angle - Math.sin(angle)) / angle ** 3
        : 1 / 6 - (angle * angle) / 120;
    const cross: IAutoMovieVector3 = AutoMovieEngineVector3.cross(vector, derivative);
    return AutoMovieEngineVector3.add(
      derivative,
      AutoMovieEngineVector3.add(
        AutoMovieEngineVector3.scale(cross, first),
        AutoMovieEngineVector3.scale(AutoMovieEngineVector3.cross(vector, cross), second),
      ),
    );
  }
}
