import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The floor frame every set and body shares: world metres with +Y up, +X
 * east and +Z south, so north is -Z; a heading is the facing direction on
 * the floor as a bearing in radians from +Z toward +X, the engine zone's
 * bearing convention (0 faces south, π/2 east, π north, -π/2 west).
 *
 * ```ts
 * BodyFrame.forward(Math.PI); // { x: 0, y: 0, z: -1 }: facing north
 * BodyFrame.toWorld(origin, heading, { forward: 0.4, left: 0.1, up: 1.0 });
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the axes, units and heading convention every other module reads.
 * @evidence contracts/development/design.md#principled-representation Headings are radians on the floor; points are world metres; the person's own left is the side a heading turned by +π/2 faces.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The conversions the laws, bodies, sets and cameras read; vector arithmetic stays the engine's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No set or body is named.
 */
export namespace BodyFrame {
  /** A point in a body's floor frame: metres forward, to its own left and up from its floor origin. */
  export interface ILocal {
    /** Metres along the heading. */
    forward: number;

    /** Metres to the person's own left. */
    left: number;

    /** Metres above the floor origin. */
    up: number;
  }

  /**
   * The unit facing direction of a heading.
   *
   * @param heading Radians from +Z toward +X.
   * @returns A horizontal unit vector.
   * @evidence contracts/development/common.md#meaningful-documentation States the convention.
   * @evidence contracts/development/implementation.md#principled-implementation The bearing's sine and cosine.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws A frame convention, not a practice law.
   * @evidence contracts/development/behaviors.md#relational-goals Reads no position.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function forward(heading: number): IAutoMovieVector3 {
    return { x: Math.sin(heading), y: 0, z: Math.cos(heading) };
  }

  /**
   * The unit direction to the person's own left: facing south (+Z) with +Y
   * up, east (+X) is on the left.
   *
   * @param heading Radians from +Z toward +X.
   * @returns A horizontal unit vector.
   * @evidence contracts/development/common.md#meaningful-documentation States which side is left.
   * @evidence contracts/development/implementation.md#principled-implementation In a right-handed frame with +Y up the left of a facing f is up × f.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws A frame convention.
   * @evidence contracts/development/behaviors.md#relational-goals Reads no position.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function left(heading: number): IAutoMovieVector3 {
    return { x: Math.cos(heading), y: 0, z: -Math.sin(heading) };
  }

  /**
   * A body-frame point in world metres.
   *
   * @param origin The floor origin in the world.
   * @param heading The body's heading.
   * @param local The point in the body's frame.
   * @returns The world point.
   * @evidence contracts/development/common.md#meaningful-documentation States the frames.
   * @evidence contracts/development/implementation.md#principled-implementation Origin plus the forward, left and up components.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws A frame conversion.
   * @evidence contracts/development/behaviors.md#relational-goals Converts the caller's point.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function toWorld(
    origin: IAutoMovieVector3,
    heading: number,
    local: ILocal,
  ): IAutoMovieVector3 {
    const f: IAutoMovieVector3 = forward(heading);
    const l: IAutoMovieVector3 = left(heading);
    return {
      x: origin.x + f.x * local.forward + l.x * local.left,
      y: origin.y + local.up,
      z: origin.z + f.z * local.forward + l.z * local.left,
    };
  }

  /**
   * The heading that faces from one floor point toward another.
   *
   * @param from Observer.
   * @param to Target.
   * @returns Radians, or 0 when the points coincide on the floor.
   * @evidence contracts/development/common.md#meaningful-documentation States the degenerate value.
   * @evidence contracts/development/implementation.md#principled-implementation The two-argument arctangent of the floor offset in the bearing convention.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Coincident points give 0 rather than NaN.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws A frame conversion.
   * @evidence contracts/development/behaviors.md#relational-goals Reads both supplied points.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function headingTo(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ): number {
    const dx: number = to.x - from.x;
    const dz: number = to.z - from.z;
    return dx === 0 && dz === 0 ? 0 : Math.atan2(dx, dz);
  }

  /**
   * The signed smallest turn from one heading to another.
   *
   * @param from Radians.
   * @param to Radians.
   * @returns Radians in (-π, π].
   * @evidence contracts/development/common.md#meaningful-documentation States the range.
   * @evidence contracts/development/implementation.md#principled-implementation Wraps the difference into one turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws An angle convention.
   * @evidence contracts/development/behaviors.md#relational-goals Reads no position.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function turn(from: number, to: number): number {
    const d: number = (((to - from) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI);
    return d - Math.PI === -Math.PI ? Math.PI : d - Math.PI;
  }

  /**
   * The world rotation of a Human evaluator frame (forward +X, up +Y) facing a
   * heading, optionally pitched (nose up positive) and rolled (toward the
   * body's left positive) about the body's own axes, as a rider's broom does.
   *
   * @param heading Radians.
   * @param pitch Radians, positive raising the front.
   * @param roll Radians, positive lowering the left side.
   * @returns A unit quaternion.
   * @evidence contracts/development/common.md#meaningful-documentation States the angle signs and the frame.
   * @evidence contracts/development/implementation.md#principled-implementation Yaw by heading - π/2 maps the evaluator's +X onto the facing direction; pitch and roll are applied in the body frame after it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Composes three axis rotations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws A frame conversion.
   * @evidence contracts/development/behaviors.md#relational-goals Reads no position.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function rotation(
    heading: number,
    pitch: number = 0,
    roll: number = 0,
  ): IAutoMovieQuaternion {
    const degrees = (r: number): number => (r * 180) / Math.PI;
    const yaw: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      degrees(heading - Math.PI / 2),
    );
    const up: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 0, z: 1 },
      degrees(pitch),
    );
    const bank: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 1, y: 0, z: 0 },
      degrees(-roll),
    );
    return Quaternion.normalize(
      Quaternion.multiply(yaw, Quaternion.multiply(up, bank)),
    );
  }
}
