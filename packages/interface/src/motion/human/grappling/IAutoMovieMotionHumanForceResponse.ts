import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";

/**
 * A partner's response to a pull through grips (#3439), the outcomes of
 * `perturb` a sustained force decides: `resist`, `yield` and `thrown`.
 *
 * The pull is the horizontal sum of the sustained forces on the performer
 * open at the action's start (`IAutoMovieMotionHumanActionContext.forces`), lasting until
 * the first of them ends. Its mechanics are `HumanForceExchange`'s:
 *
 * - **resist**: the body leans away from the pull about the ankles until
 *   its centre has moved back by the moment balance's shift, over the
 *   body's own time constant `1 / ω` on a minimum-jerk profile, and holds
 *   for the pull. A pull whose shift passes the base behind is refused with
 *   the force range that can be resisted.
 * - **yield**: the body tips along the pull about the ankles as its centre
 *   travels by the linear inverted pendulum under the pull, until its
 *   extrapolated centre leaves the base (`kuzushi`, the plan's end). A pull
 *   that ends first is refused with the force that breaks the base within it.
 * - **thrown**: the yield to `kuzushi`, then the body, frozen in that pose,
 *   turns about the thrower's fulcrum (`fulcrum`, a region of `by`) by the
 *   swing's law from the momentum the pull left, leaves it at `release`
 *   where its centre comes level with the fulcrum, and flies, its centre on
 *   the parabola from the release and its orientation from the conserved
 *   angular momentum (#3426, `integrateAirborneRotation`), until its lowest
 *   joint reaches the floor (`land`). A throw with no fulcrum, or whose
 *   swing stops before the vertical, is refused. The composition cuts into
 *   the fall or the breakfall at `land`.
 *
 * The centre moves as standing balance moves it with the feet side by side
 * (Winter 1995): along the facing by the whole body's tip about the ankles,
 * across it by the pelvis carried sideways over the planted legs.
 *
 * First pass: the grip sites are not held to the puller's hands by a root
 * solve while the body tips, and the body is rigid through the swing and
 * the flight.
 *
 * @evidence contracts/development/common.md#meaningful-documentation on: The thrown body's region that lies on the fulcrum; `abdomen` when absent, a hip throw's front over the thrower's hip.
 * @evidence contracts/development/design.md#principled-representation on: The thrown body's region that lies on the fulcrum; `abdomen` when absent, a hip throw's front over the thrower's hip.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/HumanForceResponse.ts (HumanForceResponse.plan, context); grappling/HumanForceThrow.ts (HumanForceThrow.plan, context); grappling/HumanForceResponse.ts (HumanForceResponse.plan, chosen).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidRegion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanForceResponse {
  /**
   * A response a pull can be met with.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A response a pull can be met with.
   * @evidence contracts/development/design.md#principled-representation Closed choices "resist", "yield", "thrown" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/HumanForceResponse.ts (HumanForceResponse.plan, chosen).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanForceResponse.plan.
   */
  export type Outcome = "resist" | "yield" | "thrown";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The author's outcome and, for a throw, the thrower and the fulcrum region it turns over.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members; the outcome is the author's through `perturb`, and the pull is the force input, never a parameter.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A throw's fulcrum is named, not guessed from the bodies.
   */
  export interface IParams {
    /** The thrower's subject id, for `thrown`. */
    partner?: string;

    /** The thrower's region the body turns over (a hip, a shoulder), for `thrown`. */
    fulcrum?: AutoMovieHumanoidRegion;

    /** The thrown body's region that lies on the fulcrum; `abdomen` when absent, a hip throw's front over the thrower's hip. */
    on?: AutoMovieHumanoidRegion;
  }
}
