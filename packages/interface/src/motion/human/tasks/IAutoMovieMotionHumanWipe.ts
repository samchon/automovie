import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanBalance } from "../law/IAutoMovieMotionHumanBalance";

/**
 * Wiping a table, counter or other level surface with the flat palm in
 * circles, standing before it: a household task (#3256) that the composed
 * laws lacked, the palm's circling stroke on a work surface.
 *
 * The goal is the palm flat on the surface, circling its centre with a
 * radius of a quarter of the forearm (provisional) `cycles` times. The hand
 * comes to the surface in the aimed movement time (McIntosh et al. 2018),
 * circles over `PERIOD` seconds a cycle (provisional) with the palm on the
 * surface throughout, and returns. A patch whose far side lies beyond the
 * standing arm is leaned into (`AutoMovieMotionHumanLeanInto`): the trunk
 * tips about the hips by the least pitch that keeps the wrist within `REACH`
 * of the arm's length; one still out of reach at the lean's limit is
 * refused, since it is walked up to first. The preferred working height lies
 * 200 to 250 mm below the elbow (Li, Chang and Zhang 2024, Sensors 24:7056);
 * the law accepts any reachable height and the author places the surface.
 * Events: the phrase's `ready` (palm down), `strokeStart`, `strokeEnd`,
 * `relax` (palm lifted).
 *
 * Not yet: leaning on the counter with the free hand (Iwakiri et al. 2007),
 * a held cloth as a prop, and the task sequences (dishwashing, laundry, bed
 * making) that chain this with the grasp, affordance and bend laws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation hand: The hand; `right` when absent. cycles: How many circles; 3 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation hand: The hand; `right` when absent. cycles: How many circles; 3 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainManual.ts (HumanChainManual.wipe, params); tasks/wipe.ts (wipe.plan, context); executable/cases/householdCases.ts (householdCases).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionTarget, AutoMovieHumanSide, IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanWipe {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its default.
   * @evidence contracts/development/design.md#principled-representation The surface's centre, the hand and the count.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No hand place is typed.
   */
  export interface IParams {
    /**
     * A balancing shift (`IAutoMovieMotionHumanBalance`): one closed-form shift
     * of its part, scaled by its weight between its two event-named instants,
     * each field absent taking the law's recommendation. Absent, none: the
     * posture is the law's own kinematic one with no balance shift or
     * centre-of-mass reading.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /** The middle of the patch wiped, on the surface's top. */
    on: IAutoMovieMotionTarget;

    /** The hand; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** How many circles, a whole number of at least 1; 3 when absent. */
    cycles?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }
}
