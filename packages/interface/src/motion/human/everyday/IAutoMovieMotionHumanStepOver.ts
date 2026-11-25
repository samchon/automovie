import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanCrossing } from "../next/IAutoMovieMotionHumanCrossing";

/**
 * Stepping over a low obstacle placed in the scene, a kerb or a hurdle
 * (`HumanObstacle`), from standing in front of it: the lead foot lifts over it
 * and lands beyond, then the trail foot follows and lands beside it, both feet
 * clearing the obstacle's top.
 *
 * The goals are footprints and clearance: each swinging foot takes the shortest
 * path from its footprint to its landing that keeps every sole point over the
 * obstacle at least `MARGIN` above its top and every other one on or above the
 * floor, the taut string over the obstacle (`AutoMovieMotionHumanClearance`),
 * travelled on minimum-jerk progress. Patla and Rietdyk (1993, Gait Posture
 * 1:45) found that the lead toe clears an obstacle by a roughly constant margin
 * whatever its height, so the lift grows with the obstacle and the margin does
 * not; 0.1 m is the margin used (provisional, of the order they report). The
 * lead foot lifts its toes by up to `TOE_UP` as they pass over the near side
 * and is level again once its heel does, so the toe clears the edge with the
 * ankle and the knee lower than a level foot would need; where the ankle cannot
 * take the planned pitch and the toes droop, the ankle is raised until every
 * sole point clears. The lead foot lands so the obstacle's middle falls at
 * mid-swing, at least one tenth of a foot length beyond the far side and no
 * farther than the legs' stride allows; the trail foot lands beside it at the
 * body's rest separation. Both land on the floor the step leaves, or on the
 * level surface `onto` names, such as a tub's floor inside its rim, the pelvis
 * coming down or up with them.
 *
 * While the lead foot swings, the trail foot rises on its ball by `PUSH`, the
 * forefoot rocker of a stance foot the body passes over (Perry and Burnfield),
 * and the pelvis rises with it as far as it lifts that ankle, so the lead hip
 * stands higher over the obstacle; the trail foot later leaves from that pitch
 * and levels by the time its toe reaches the near side. The pelvis stays back
 * over the trail foot until the lead foot is crossing, moves halfway between
 * the feet by the double support and over the landed feet while the trail foot
 * swings, each leg on a minimum-jerk path. It is lowered wherever a planted leg
 * could not reach its foot, and over the second half of each swing toward where
 * the swinging leg will reach its landing, so it has come down when the foot
 * lands instead of dropping at the contact.
 *
 * Time scales with leg length by dynamic similarity (Alexander 1984): the whole
 * action takes `2.4 sqrt(l / 0.93)` seconds for a hip height `l` (provisional:
 * a deliberate two-step crossing near 1 s a step for an adult) times the
 * manner's tempo, the lead swinging over 8 to 42 % and the trail over 50 to 82
 * %, the pelvis staying between the feet until 70 % so the trail limb crosses
 * with the hip above the obstacle, where hip and knee flexion can lift its toe
 * (trail-limb clearance comes from hip and knee flexion, Chou and Draganich
 * 1997, J Biomech 30:331), then moving over the landed feet.
 *
 * The obstacle lies ahead along the performer's heading; its near side must be
 * within one leg length of the feet and its height at most 0.55 of the hip
 * height (provisional, near the hip flexion a standing step can use), otherwise
 * the step is refused with the limits. Events: `leadToeOff`, `leadContact`,
 * `trailToeOff`, `trailContact`.
 */
export namespace IAutoMovieMotionHumanStepOver {
  /** Parameters. */
  export interface IParams {
    /**
     * The obstacle's prop subject: a kerb or a hurdle, whose near edge, height
     * and depth its contacts declare (`HumanObstacle`).
     */
    obstacle: string;

    /** The leading foot; `right` when absent. */
    lead?: "left" | "right";

    /**
     * How it is performed: the manner's tempo scales the whole crossing's time,
     * every phase keeping its share; neutral when absent.
     */
    manner?: IAutoMovieMotionManner;

    /**
     * The level surface beyond the obstacle both feet land on, such as a
     * bathtub's floor inside its rim, higher or lower than the floor the step
     * leaves; the feet land at the starting floor's height when absent. The
     * landing must lie on it, or the step is refused.
     */
    onto?: IAutoMovieMotionHumanCrossing.ISurface;
  }
}
