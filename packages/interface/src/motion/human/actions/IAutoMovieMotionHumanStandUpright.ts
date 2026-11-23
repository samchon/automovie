import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";

/**
 * The upright alignment of a body's quiet stance, solved from the body's own
 * joints by forward kinematics, once per body.
 *
 * Clinical standing alignment puts the ear, the shoulder joint and the hip
 * joint on one vertical line, the plumb line of Kendall (Kendall, McCreary and
 * Provance, Muscles: Testing and Function), with the head level so the gaze is
 * horizontal, and the whole body inclines slightly forward at the ankles so the
 * centre of mass lies a few centimetres in front of the ankle joints (Winter
 * 1995, "Human balance and posture control during standing and walking", Gait &
 * Posture 3). A rig's rest column need not stand so: the polygon man's
 * shoulders rest behind its hips. The alignment therefore fits the plumb line:
 * equal spine and chest flexion (golden-section search within ±15°) and neck
 * flexion (bisection within a comfortable ±20°) that minimise the squared
 * horizontal distances of the shoulder joints' midpoint and the head joint, the
 * ear's proxy, from the hip joints' vertical, since a simplified neck need not
 * let all three stack exactly; head flexion that levels the head's forward
 * axis; and the forward lean that brings the centre of mass 4 cm in front of
 * the ankles' midpoint for a 0.93 m hip height, scaled with it (a provisional
 * value inside Winter's few centimetres).
 */
export namespace IAutoMovieMotionHumanStandUpright {
  /** The alignment of a body, solved once and kept per body. A body's alignment. */
  export interface IAlignment {
    /** Spine, chest, neck and head flexion, clinical degrees. */
    joints: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    >;

    /**
     * Forward lean of the centre of mass ahead of the ankles, metres in the
     * body frame.
     */
    lean: number;
  }
}
