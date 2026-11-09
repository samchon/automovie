import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * What a body does at one instant, as the motion laws state it: where its
 * pelvis stands and how the body frame is turned, how the trunk leans and
 * twists, where the head looks, and world goals for both ankles and both
 * hand centres that the student body reaches by two-bone limb fitting.
 *
 * The body frame faces `heading` on the floor, tilted by `pitch` (front up)
 * and `roll` (left side down) for a rider; `pelvis` is the hip-joint centre
 * in world metres. Angles are radians; points world metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, units and every member.
 * @evidence contracts/development/design.md#principled-representation World metres for points, radians for angles, one goal per limb so a limb always has a target.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs the student body solves; every motion law writes only these.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No person or action is named.
 */
export interface IBodyPosture {
  /** Hip-joint centre, world metres. */
  pelvis: IAutoMovieVector3;

  /** Facing on the floor, radians from +Z toward +X. */
  heading: number;

  /** Body-frame pitch, front up, radians (riders); 0 standing. */
  pitch: number;

  /** Body-frame roll, own left side down, radians (riders); 0 standing. */
  roll: number;

  /** Trunk flexion forward from the pelvis, radians. */
  lean: number;

  /** Trunk twist toward the own left, radians. */
  twist: number;

  /** Head yaw toward the own left relative to the chest, radians. */
  headYaw: number;

  /** Head pitch down, radians. */
  headPitch: number;

  /** Ankle goals, world metres, with the direction the toes point. */
  feet: Record<"left" | "right", IBodyPosture.IFoot>;

  /** Hand-centre goals, world metres, with an elbow aim. */
  hands: Record<"left" | "right", IBodyPosture.IHand>;
}
export namespace IBodyPosture {
  /** An ankle goal. */
  export interface IFoot {
    /** Ankle centre. */
    point: IAutoMovieVector3;

    /** Unit direction the toes point, horizontal when planted. */
    toes: IAutoMovieVector3;

    /** World point the knee leans toward. */
    knee: IAutoMovieVector3;
  }

  /** A hand goal. */
  export interface IHand {
    /** Hand centre. */
    point: IAutoMovieVector3;

    /** World point the elbow leans toward. */
    elbow: IAutoMovieVector3;

    /** Palm direction, world unit vector: down for a hanging arm, up for an open palm. */
    palm: IAutoMovieVector3;
  }
}
