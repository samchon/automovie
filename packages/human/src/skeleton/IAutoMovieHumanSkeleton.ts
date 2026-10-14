import {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";

/**
 * The resolved skeleton of one person: joint centres in the rest pose, the axes and range of motion Human declares for each joint, and the palpable landmarks later parts are placed through.
 *
 * The skeleton is built first, from measurements, and every part, the rig and every later layer read it, so geometry is never reconciled with an independently sourced skeleton afterwards. Bones use the shared `AutoMovieHumanoidBone` names, all 55 of them, and the canonical T-pose rest of the engine's `HUMANOID_REST_FRAME`: the upper arms abducted 90 degrees with the palms down, the shoulder girdle, spine, legs and fingers at clinical neutral, so motion authored for any humanoid plays on the person. Anthropometry is measured with the arms hanging; the generator solves every joint centre in that posture and turns the arms up about their shoulder joint centres into the T-pose, never the reverse.
 *
 * Positions are millimetres in the model frame: origin on the standing surface below the midpoint between the feet, +Y up, +Z to the person's front, +X to the person's left, the right-handed frame of glTF and VRM. Every rest rotation is the identity, so a bone's local frame is the model frame translated to its joint centre, and rest proportions live in positions, never in bone scale, which forward kinematics ignores.
 *
 * Axes and constraints are Human's own anatomy. `IAutoMovieBone` has no field for declared axes yet (core issue #2807 adds it), so they are kept here and not emitted; until then films pose every bone on the engine's default axes.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkeleton {
  /** Joints ordered so that every parent precedes its children; the first is the root. */
  joints: IAutoMovieHumanSkeleton.IJoint[];

  /** Palpable landmarks at rest, each riding its bone. */
  landmarks: IAutoMovieHumanLandmarks;
}
export namespace IAutoMovieHumanSkeleton {
  /**
   * One joint: where the bone starts and ends, what it hangs from, and how it may turn.
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
     * End of the bone in the rest pose, millimetres: the joint centre of its principal child (the spine for the hips, the neck for the upper chest, the middle finger for the hand), or for a bone without children the landmark it ends at (the vertex, the menton, a fingertip, a toe tip, the front of the eye).
     */
    tail: IAutoMovieVector3;

    /**
     * The clinical rotation axes of this joint at rest. Every bone declares them; posing honours them once core carries per-bone axes.
     */
    axes: IAxes;

    /**
     * Range of motion Human derives for this person's joint, in clinical degrees about `axes`, or null where no source was read and the engine's default humanoid range applies.
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
