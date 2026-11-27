import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanActionPlan } from "./IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanLadder } from "./IAutoMovieMotionHumanLadder";

/**
 * Climbing a vertical fixed ladder from the floor before it, in the four-beat
 * ipsilateral pattern: right hand, right foot, left hand, left foot, one limb
 * moving at a time, so three limbs always hold the ladder (Jensen and Holland
 * 2020, Int J Environ Res Public Health 17:2897).
 *
 * The goals are rungs: the ladder is a prop of the scene, a fixture
 * (`IAutoMovieMotionHumanProp.fixed`) that the hands grip and never carry, and
 * its rungs are its own `rung1` upward (`createLadder`'s affordances), read
 * where the ladder stands at the action's start. The rungs' spacing must lie in
 * OSHA 1910.23(b)(2)'s 25 to 36 cm and their line be upright; the climber
 * stands before the ladder, facing it within `FACING` degrees, the toes within
 * `NEAR` of the rungs and between the rails. A ladder that is no fixture,
 * leans, has too few rungs above the hands, or one the climber stands away
 * from, is refused. Each foot stands with its ball on a rung's top, and each
 * hand grips a rung (Jensen and Holland found rungs used in 59 of 80 tasks) at
 * the rung nearest the shoulder's height above the feet. First both hands reach
 * their rungs, then every beat moves one limb up one rung: a foot on a
 * minimum-jerk arc that clears the rung below by `CLEARANCE`, a hand on a
 * minimum-jerk path. The pelvis stays `BACK` leg lengths behind the rungs and
 * rises with the feet, lowered wherever a planted leg could not reach. Each
 * beat takes `BEAT` seconds (provisional), scaled by the manner's tempo.
 * Events: `handsOn`, then per beat `<limb>Release<n>` and `<limb>Contact<n>`,
 * the limb one of `rightHand`, `rightFoot`, `leftHand`, `leftFoot`.
 *
 * An optional `landing` joins the floor and a fixed upper surface over the same
 * rungs and side rails, up or down (`planLadderAccess`): the feet change
 * between the floor or landing and the rungs one at a time while the hands
 * hold, and the hands take the side rails before the feet cross the upper edge.
 * Then `rungs` must match the rungs below the landing.
 *
 * Not yet: the two-beat patterns, and hanging, traversing, mantling and
 * vaulting (not yet staged).
 */
export namespace IAutoMovieMotionHumanClimbLadder {
  /** Parameters. */
  export interface IParams {
    /** The ladder's prop subject: a fixture whose rungs are its `rung1` upward. */
    ladder: string;

    /**
     * How many rungs the feet climb, a whole number of at least 1; 3 when
     * absent.
     */
    rungs?: number;

    /**
     * The upper surface the route joins to the floor; the climb ends on the
     * rungs when absent.
     */
    landing?: ILanding;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /** A limb of the climb. */
  export type Limb = "leftHand" | "rightHand" | "leftFoot" | "rightFoot";

  /** A climb's plan: an action plan with the ladder it resolved. */
  export interface IPlan extends IAutoMovieMotionHumanActionPlan {
    /** The ladder. */
    ladder: IAutoMovieMotionHumanLadder.ILadder;
  }

  /**
   * Which way a landing route runs: `up` from the floor to the landing, `down`
   * from the landing to the floor.
   */
  export type Direction = "up" | "down";

  /** The surface at the upper end of a fixed ladder route. */
  export interface ILanding {
    /** Subject of the fixed prop that bears the performer at the top. */
    prop: string;

    /** Id of its level `surface` affordance, its near edge at the ladder. */
    point: string;

    /** The route's direction; `up` when absent. */
    direction?: Direction;
  }
}
