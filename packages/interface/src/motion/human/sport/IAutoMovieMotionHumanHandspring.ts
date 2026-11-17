import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";

/**
 * A front handspring (#3377): from standing, the body reaches forward into
 * a lunge, turns head over heels in pitch over its hands, leaves them and
 * flies to its feet, landing arched and rising to stand.
 *
 * Two phases, each turning about one axis, the body's left one:
 *
 * 1. Supported: the body rolls as a wheel (`GymnasticsWheel`) over its feet,
 *    its leading foot and its two hands, its shape going from standing to
 *    the lunge `lunged` by the angle `REACH` and from there to the arched
 *    line `arched` by `RELEASE`, where the hands leave. The angle grows
 *    with constant angular acceleration from rest, so it arrives at the
 *    release with the rate the flight keeps.
 * 2. Flight: the centre of mass follows the parabola of the velocity the
 *    wheel gave it at the release, and the arched body keeps turning at the
 *    release's rate, its kept angular momentum, until the centre comes down
 *    to the height it has standing arched at `LAND`. That rate is the one
 *    whose turn over that flight time brings the body from `RELEASE` to
 *    `LAND`, found by bisection, since the flight time itself grows with the
 *    rate the wheel throws the centre at.
 *
 * Landing, the feet are planted where they came down, the body absorbs and
 * rises to stand over the jump's `ABSORB` and `RISE` seconds while its tip
 * comes up from `LAND`, the arched landing of the skill, with the root
 * carrying the touchdown velocity out.
 *
 * A rate past the salto's bound (`salto.RATE`) is refused. With the hands
 * on a prop's `surface` the same law is the vault (`vault`).
 *
 * First pass: the body is rigid through the flight (no repulsion from the
 * shoulders, no change of shape), so its pitch rate and its centre's speed
 * are tied by the wheel's radius and the flight is longer and faster than a
 * gymnast's, who shortens the body and pushes off the hands; the hands and
 * feet are carried by the shape and not laid flat by a solve.
 *
 * Events: `handsDown`, `release` (the hands leave), `touchdown`, `settled`
 * and `relax`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation lead: The leg that lunges; `left` when absent. height: The surface's height, world metres.
 * @evidence contracts/development/design.md#principled-representation lead: The leg that lunges; `left` when absent. height: The surface's height, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/handspring.ts (handspring.plan, context); sport/handspring.ts (handspring.over, context); sport/handspring.ts (handspring.over, surface).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanContactWindow.Support, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanHandspring {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The leading leg.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The value the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The leg that lunges; `left` when absent. */
    lead?: "left" | "right";
  }

  /**
   * What the hands land on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation A height, a support frame and a check of the place.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the vault gives the plan.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISurface {
    /** The surface's height, world metres. */
    height: number;

    /** What the hands bear on. */
    support: IAutoMovieMotionHumanContactWindow.Support;

    /**
     * Refuse a place for the hands' middle off the surface.
     *
     * @param point The hands' middle as they come down, world metres.
     * @throws {HumanRefusal} When the point is off the surface.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanHandspring.ISurface.within: Refuse a place for the hands' middle off the surface.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHandspring.ISurface.within is used through packages/motions/src/sport/handspring.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHandspring.ISurface.within is used through packages/motions/src/sport/handspring.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHandspring.ISurface.within is used through packages/motions/src/sport/handspring.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHandspring.ISurface.within is used through packages/motions/src/sport/handspring.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHandspring.ISurface.within is used through packages/motions/src/sport/handspring.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHandspring.ISurface.within is used through packages/motions/src/sport/handspring.ts.
     */
    within(point: IAutoMovieVector3): void;
  }
}
