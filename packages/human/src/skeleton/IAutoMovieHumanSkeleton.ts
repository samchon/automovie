import {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The resolved skeleton of one person: joint centres in the rest pose, with the axes and range of motion Human declares for each joint.
 *
 * The skeleton is built first, from measurements, and every part, the rig and every later layer read it, so geometry is never reconciled with an independently sourced skeleton afterwards. Bones use the shared `AutoMovieHumanoidBone` names and the canonical T-pose rest frame of the engine (arms abducted 90 degrees), so motion authored for any humanoid plays on the person. Anthropometry is measured with the arms hanging; the skeleton generator converts it into the T-pose, never the reverse.
 *
 * Positions are millimetres in the model frame: origin on the standing surface below the midpoint between the feet, +Y up, +Z to the person's front, +X to the person's left, the right-handed frame of glTF and VRM. Every rest rotation is the identity, so a bone's local frame is the model frame translated to its joint centre, and rest pose proportions live in positions, never in bone scale, which forward kinematics ignores.
 *
 * Axes and constraints are Human's own anatomy: finger, thumb, eye and jaw axes and per-person limits are not taken from engine tables.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkeleton {
  /** Joints ordered so that every parent precedes its children; the first is the root. */
  joints: IAutoMovieHumanSkeleton.IJoint[];
}
export namespace IAutoMovieHumanSkeleton {
  /**
   * One joint: where the bone starts, what it hangs from, and how it may turn.
   *
   * @author Samchon
   */
  export interface IJoint {
    /** The bone that starts at this joint centre. Unique in the skeleton. */
    bone: AutoMovieHumanoidBone;

    /** The bone it hangs from, or null for the root (`hips`). */
    parent: AutoMovieHumanoidBone | null;

    /** Joint centre in the rest pose, model frame, millimetres. */
    position: IAutoMovieVector3;

    /**
     * The clinical rotation axes of this joint at rest, or null to use the engine's default convention for the bone (flexion about X, abduction about Z, twist about Y, with the engine's arm remapping).
     */
    axes: IAxes | null;

    /**
     * Range of motion Human derives for this person's joint, in clinical degrees, or null to fall back to the engine's default humanoid range for the bone.
     */
    constraint: IAutoMovieJointConstraint | null;
  }

  /**
   * The three clinical rotation axes of one joint as unit vectors in its rest frame.
   *
   * A positive angle turns about its axis by the right-hand rule. The three axes are mutually perpendicular. Declaring them per bone is what lets a finger flex across its own length and an eye turn horizontally, which the default convention cannot express for bones lying along X in the T-pose.
   *
   * @author Samchon
   */
  export interface IAxes {
    /** Axis of positive flexion. */
    flexion: IAutoMovieVector3;

    /** Axis of positive abduction. */
    abduction: IAutoMovieVector3;

    /** Axis of positive external rotation, along the bone. */
    twist: IAutoMovieVector3;
  }
}
