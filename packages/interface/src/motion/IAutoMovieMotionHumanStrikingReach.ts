import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The goal maths of bringing a weapon surface onto a target point: where a
 * two-segment limb's middle joint (elbow or knee) and end joint (wrist or
 * ankle) must be for a point on its distal segment to sit on the target, the
 * flexion that takes, and the declared rule when the target is out of reach.
 *
 * Only goals are computed here: the end joint's point and the middle joint's
 * position become an `IAutoMovieMotionHumanPosture` limb goal (`point` and a
 * `bend` hint beside the middle joint), and the engine's `fitChainToTarget`
 * solves the joint angles within the range of motion from an effector goal and
 * a bend goal, the swivel of Tolani, Goswami and Badler (2000). The placement is the triangle of the two segment lengths and the
 * root-to-point distance (law of cosines), in the plane through the root and
 * the point that contains the preferred bend direction.
 *
 * Reachability is decided against a flexion band at contact (a straight punch
 * lands nearly extended, a hook near a right angle, a kick's knee not locked):
 * within the band the point is met exactly; beyond the band's longest reach the
 * limb extends along the line toward the target at that reach and stops short,
 * the declared miss-at-maximum-reach rule, and the shortfall is reported;
 * inside the shortest reach either the contact slides along the distal segment
 * toward the middle joint (a jammed kick lands with the upper shin or the knee)
 * or, where the surface is rigid with the end joint (a fist), the middle joint
 * flexes past the band up to {@link JAM_FLEXION}.
 */
export namespace IAutoMovieMotionHumanStrikingReach {
  /** One limb solve's input; every point in world metres. */
  export interface IChain {
    /** The root joint (shoulder or hip). */
    root: IAutoMovieVector3;

    /** Where the distal segment's chosen point must go. */
    point: IAutoMovieVector3;

    /** Root to middle joint, metres. */
    upper: number;

    /**
     * Middle joint to the chosen point along the distal segment, metres; the
     * wrist or ankle itself when equal to `lower`.
     */
    along: number;

    /** Middle joint to end joint, metres. */
    lower: number;

    /**
     * A direction the middle joint bends toward (the elbow down, the knee
     * leading); any non-zero vector not parallel to root-to-point.
     */
    bend: IAutoMovieVector3;

    /** The flexion band at contact, degrees `[least, most]`, 0 straight. */
    flexion: readonly [number, number];

    /**
     * Whether contact may slide along the distal segment when too close (a
     * shin), or the surface is rigid with the end joint (a fist, a sole).
     */
    slide: boolean;
  }

  /** One limb solve's result. */
  export interface ISolution {
    /** The middle joint, world metres. */
    middle: IAutoMovieVector3;

    /** The end joint (wrist or ankle), world metres. */
    end: IAutoMovieVector3;

    /**
     * Where the chosen point lands, world metres: the target, or the nearest
     * point of the line toward it when short.
     */
    point: IAutoMovieVector3;

    /** The middle joint's flexion, degrees. */
    flexion: number;

    /** The distance from the middle joint at which the contact sits, metres. */
    along: number;

    /**
     * `reached`, `short` (miss at maximum reach) or `jammed` (closer than the
     * band).
     */
    status: "reached" | "short" | "jammed";

    /**
     * How far the point falls short of the target, metres: positive when short,
     * negative when jammed past it, otherwise 0.
     */
    gap: number;
  }
}
