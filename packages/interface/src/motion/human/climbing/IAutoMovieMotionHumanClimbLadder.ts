import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanLadder } from "./IAutoMovieMotionHumanLadder";

/**
 * Climbing a vertical fixed ladder from the floor before it, in the
 * four-beat ipsilateral pattern: right hand, right foot, left hand, left
 * foot, one limb moving at a time, so three limbs always hold the ladder
 * (Jensen and Holland 2020, Int J Environ Res Public Health 17:2897).
 *
 * The goals are rungs: the ladder is a prop of the scene, a fixture
 * (`IAutoMovieMotionHumanProp.fixed`) that the hands grip and never carry, and its rungs are
 * its own `rung1` upward (`createLadder`'s affordances), read where the
 * ladder stands at the action's start. The rungs' spacing must lie in OSHA
 * 1910.23(b)(2)'s 25 to 36 cm and their line be upright; the climber stands
 * before the ladder, facing it within `FACING` degrees, the toes within
 * `NEAR` of the rungs and between the rails. A ladder that is no fixture,
 * leans, has too few rungs above the hands, or one the climber stands away
 * from, is refused. Each foot stands with its ball on a rung's top,
 * and each hand grips a rung (Jensen and Holland found rungs used in 59 of
 * 80 tasks) at the rung nearest the shoulder's height above the feet. First
 * both hands reach their rungs, then every beat moves one limb up one rung:
 * a foot on a minimum-jerk arc that clears the rung below by `CLEARANCE`, a
 * hand on a minimum-jerk path. The pelvis stays `BACK` leg lengths behind
 * the rungs and rises with the feet, lowered wherever a planted leg could
 * not reach. Each beat takes `BEAT` seconds (provisional), scaled by the
 * manner's tempo. Events: `handsOn`, then per beat `<limb>Release<n>` and
 * `<limb>Contact<n>`, the limb one of `rightHand`, `rightFoot`, `leftHand`,
 * `leftFoot`.
 *
 * An optional `landing` joins the floor and a fixed upper surface over the
 * same rungs and side rails, up or down (`planLadderAccess`): the feet
 * change between the floor or landing and the rungs one at a time while
 * the hands hold, and the hands take the side rails before the feet cross
 * the upper edge. Then `rungs` must match the rungs below the landing.
 *
 * Not yet: the two-beat patterns, and hanging, traversing, mantling and
 * vaulting (the rest of #3238).
 *
 * @evidence contracts/development/common.md#meaningful-documentation rungs: How many rungs the feet climb; 3 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation rungs: How many rungs the feet climb; 3 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainTravel.ts (HumanChainTravel.climbLadder, params); climbing/climbLadder.ts (climbLadder.plan, context); climbing/climbLadder.ts (climbLadder.plan, limb); climbing/climbLadder.ts (climbLadder.plan.level, limb); climbing/climbLadder.ts (climbLadder.plan, return); executable/cases/climbCases.ts (climbCases).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner, IAutoMovieMotionHumanLadder.ILadder identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanClimbLadder {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and default.
   * @evidence contracts/development/design.md#principled-representation The ladder as the scene's prop, and how far to climb.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hold is typed.
   */
  export interface IParams {
    /** The ladder's prop subject: a fixture whose rungs are its `rung1` upward. */
    ladder: string;

    /** How many rungs the feet climb, a whole number of at least 1; 3 when absent. */
    rungs?: number;

    /** The upper surface the route joins to the floor; the climb ends on the rungs when absent. */
    landing?: ILanding;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * A limb of the climb.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A limb of the climb.
   * @evidence contracts/development/design.md#principled-representation Closed choices "leftHand", "rightHand", "leftFoot", "rightFoot" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: climbing/climbLadder.ts (climbLadder.plan, limb); climbing/climbLadder.ts (climbLadder.plan.level, limb); climbing/climbLadder.ts (climbLadder.ORDER); climbing/climbLadder.ts (climbLadder.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in climbLadder.plan.
   */
  export type Limb = "leftHand" | "rightHand" | "leftFoot" | "rightFoot";

  /**
   * A climb's plan: an action plan with the ladder it resolved.
   *
   * @evidence contracts/development/common.md#meaningful-documentation ladder: The ladder.
   * @evidence contracts/development/design.md#principled-representation ladder: The ladder.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: climbing/climbLadder.ts (climbLadder.plan, return); executable/cases/climbCases.ts (climbCases).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanLadder.ILadder identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPlan extends IAutoMovieMotionHumanActionPlan {
    /** The ladder. */
    ladder: IAutoMovieMotionHumanLadder.ILadder;
  }

  /**
   * Which way a landing route runs: `up` from the floor to the landing,
   * `down` from the landing to the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both directions.
   * @evidence contracts/development/design.md#principled-representation A closed choice; down replays the same stances in reverse order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by planLadderAccess.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
   */
  export type Direction = "up" | "down";

  /**
   * The surface at the upper end of a fixed ladder route.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the placed surface and the direction, with its default.
   * @evidence contracts/development/design.md#principled-representation The prop's level surface affordance supplies the height, width and depth in world metres; the direction orders the same contact route.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by planLadderAccess only when the author requests a complete route.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The landing names a real surface, without an invented endpoint; a moving, sloped, misaligned or unreachable one is refused at runtime.
   */
  export interface ILanding {
    /** Subject of the fixed prop that bears the performer at the top. */
    prop: string;

    /** Id of its level `surface` affordance, its near edge at the ladder. */
    point: string;

    /** The route's direction; `up` when absent. */
    direction?: Direction;
  }
}
