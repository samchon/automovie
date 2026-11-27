/**
 * A fall onto the floor on purpose from a stance: a goalkeeper's dive to the
 * side, or a sliding tackle forward on the hip.
 *
 * Every second the body is a set of joint angles blended from the entry's
 * toward the kind's (`SHAPES`, provisional), turned about one axis of its own
 * (the dive about its forward axis, so it lands on its side; the slide about
 * its lateral axis, leaning back), and placed with its root on a path:
 *
 * - `dive`: a crouch with the feet planted and the knees bending under the
 *   lowered root (`AutoMovieMotionHumanTrunk.planted`), then a flight whose
 *   hips move `REACH` statures to the side on a parabola `APEX` statures above
 *   the line from take-off to landing, the body turning a quarter about its
 *   forward axis on the way while its joints extend from the crouch's solved
 *   angles into the shape, then lying on its side where it landed. The flight
 *   is the one airborne part, on that one axis.
 * - `slide`: the body leans back and sinks onto its hip while its hips slide
 *   `REACH` statures forward and slowing to rest, the lead leg reaching ahead
 *   and the trailing one bent under, never off the floor.
 *
 * Landed, the root is placed so the lowest joint centre lies at the ankle's
 * standing height above the floor, as on the feet.
 *
 * Contact windows: the feet plant through the crouch; landed, the seat lies on
 * the floor (the hip) and, in a dive, the lower hand plants beside it.
 *
 * First pass: the take-off is not driven by the legs' push, the landing does
 * not absorb the fall through the arm, and a slide from a run starts from the
 * run's posture at rest, not its speed.
 */
export namespace IAutoMovieMotionHumanDive {
  /** The kinds. */
  export type Kind = "dive" | "slide";

  /** Parameters. */
  export interface IParams {
    /** A dive to the side or a slide forward; `dive` when absent. */
    kind?: IAutoMovieMotionHumanDive.Kind;

    /** The side a dive goes to; `left` when absent; unread by a slide. */
    side?: "left" | "right";
  }
}
