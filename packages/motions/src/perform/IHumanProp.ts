import type {
  IAutoMovieAffordance,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A prop actions can aim at and hands can hold: a subject id, its world
 * frame at rest, and its named points in that frame, such as a heavy bag's
 * striking surface, a pad's face or a cup's handle.
 *
 * The prop stays at its rest frame until a hand grips it; while gripped it
 * rides the hand, and it stays where the last grip released it (see
 * `HumanPerformance.prop`). A point's normal points out of the prop's
 * surface.
 */
export interface IHumanProp {
  /** Subject id, unique in the performance. */
  subject: string;

  /** The prop's world frame before any grip. */
  frame: IHumanProp.IFrame;

  /** Named points in the prop's frame, metres, with outward unit normals. */
  points: Readonly<
    Record<string, { point: IAutoMovieVector3; normal: IAutoMovieVector3 }>
  >;

  /**
   * The prop's world frame at a film second, for a prop that moves by
   * itself: a vehicle on its course, a horse at its gait, a lift. While
   * set, the prop is where this says and no grip carries it; what bears on
   * it (a rider's seat, a hand on its wheel) is carried with it.
   *
   * @param seconds Film seconds.
   * @returns The frame.
   */
  motion?(seconds: number): IHumanProp.IFrame;

  /**
   * A named point in the world at a film second, for a prop whose parts
   * move within it: a pedal on its crank, a stirrup on a trotting horse, a
   * handle on a door that swings. `points` holds a point where it is in the
   * prop at rest, and the prop's frame alone carries it rigidly; a point
   * this knows is read here instead, so a foot or a hand aimed at it follows
   * the part and not the place the part had at rest.
   *
   * @param id The point's name, one of `points`.
   * @param seconds Film seconds.
   * @returns The point and its outward unit normal, world metres; undefined for a point that only moves with the prop's frame.
   */
  point?(
    id: string,
    seconds: number,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } | undefined;

  /** Contact frames in the prop's frame (a handle's `+Y` approach and `+X` wrapped axis), which a grasp plans from by id. */
  affordances?: readonly IAutoMovieAffordance[];

  /** Colliders in the prop's frame, for finger closure until contact and penetration audits. */
  shapes?: readonly IAutoMoviePhysicalProfile.IShape[];
}
/**
 * Companion types of {@link IHumanProp}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's frame.
 * @evidence contracts/development/design.md#principled-representation A rigid frame of position and rotation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the performance and laws read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses interface vectors and quaternions.
 */
export namespace IHumanProp {
  /** A rigid world frame. */
  export interface IFrame {
    /** Origin, world metres. */
    position: IAutoMovieVector3;

    /** Rotation from the prop's own axes to the world. */
    rotation: IAutoMovieQuaternion;
  }
}
