import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A performer's own horizontal frame: an origin on the floor and a heading.
 *
 * Local coordinates follow the canonical body: `x` toward the performer's
 * left, `y` up and `z` forward. A heading of 0 degrees faces world +Z and 90
 * faces world +X, a right-handed turn about +Y, so the left of a performer at
 * heading `h` is world `(cos h, 0, -sin h)` and the forward is
 * `(sin h, 0, cos h)`.
 */
export namespace HumanFrame {
  /** A frame: a floor origin and a heading. */
  export interface IFrame {
    /** Origin, world metres. */
    origin: IAutoMovieVector3;

    /** Heading about +Y, degrees. */
    yaw: number;
  }

  /**
   * A local point in world metres.
   *
   * @param frame The frame.
   * @param local `x` left, `y` up, `z` forward, metres.
   * @returns The world point.
   */
  export function point(
    frame: IFrame,
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const r: number = (frame.yaw * Math.PI) / 180;
    const c: number = Math.cos(r);
    const s: number = Math.sin(r);
    return {
      x: frame.origin.x + local.x * c + local.z * s,
      y: frame.origin.y + local.y,
      z: frame.origin.z - local.x * s + local.z * c,
    };
  }

  /**
   * A world point in the frame's local coordinates.
   *
   * @param frame The frame.
   * @param world The world point.
   * @returns `x` left, `y` up, `z` forward, metres.
   */
  export function local(
    frame: IFrame,
    world: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const r: number = (frame.yaw * Math.PI) / 180;
    const c: number = Math.cos(r);
    const s: number = Math.sin(r);
    const dx: number = world.x - frame.origin.x;
    const dz: number = world.z - frame.origin.z;
    return {
      x: dx * c - dz * s,
      y: world.y - frame.origin.y,
      z: dx * s + dz * c,
    };
  }

  /**
   * The rotation of a heading about +Y.
   *
   * @param yaw Degrees.
   * @returns The rotation.
   */
  export function turn(yaw: number): IAutoMovieQuaternion {
    return Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw);
  }

  /**
   * The heading of a world rotation's forward (+Z) projected on the floor.
   *
   * @param rotation A world rotation.
   * @returns Degrees about +Y.
   */
  export function heading(rotation: IAutoMovieQuaternion): number {
    const f: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    return (Math.atan2(f.x, f.z) * 180) / Math.PI;
  }
}
