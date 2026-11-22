import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanActionContext } from "../law/IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanActionLaw } from "../law/IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";

/**
 * Catching an object thrown by another action: the hands meet it where its
 * path enters the reach, give with it, and bring it to the chest.
 *
 * The goal is an interception. The throw's plan carries its launch
 * (`throwObject.of`), so the path is known in closed form, drag-free. The
 * catch point is where the path first comes within `REACH` arm lengths
 * ahead of the catcher's root along its heading (provisional), and the
 * contact instant the path's time there; a path that never comes so near,
 * or a point the arms cannot reach from the shoulders, is refused. With two
 * hands the palms take the object from both sides, each palm on its surface
 * across the catcher's left-right axis; with one the palm takes it from
 * behind, facing the way it comes, or with a worn glove (`glove`) the hand
 * turned as that palm would be and moved so the glove's pocket meets it. The
 * fingers take the turn about the palm's normal (`ROLLS`, upward first) the
 * arm holds at the contact with the least strain
 * (`AutoMovieMotionHumanBend.strain`), so the wrist's range decides it. The ball's size is the
 * ball's own (`ball`, `HumanBall`). The hands travel there on minimum-jerk
 * progress over the aimed movement time to an object of its size (McIntosh
 * et al. 2018, `AutoMovieMotionHumanTiming.aimed`), arriving at contact;
 * the anticipatory `prepare` instant is 100 ms before impact (Lacquaniti and
 * Maioli 1989, J Neurosci 9:134). After contact the hands give `GIVE` along
 * the object's velocity over `GIVE_TIME` (the issue's 0.05 to 0.15 m,
 * provisional), which is `secured`, then carry it to before the sternum and
 * hold it. Events: `reach`, `prepare`, `contact`, `secured`, `held`.
 *
 * Not yet: hand closure timed by optical expansion (Savelsbergh et al.
 * 1991), a running catch (McLeod and Dienes 1996), a fumble, the catch
 * against the chest, and a held prop handed from the throw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation hands: One hand or two; `two` when absent. side: The catching hand when one; `right` when absent. glove: A glove worn on the one catching hand, its prop subject: the ball meets its `pocket`, the hand turned as its bare palm would be (`createGlove`'s contacts). A bare hand when absent.
 * @evidence contracts/development/design.md#principled-representation hands: One hand or two; `two` when absent. side: The catching hand when one; `right` when absent. glove: A glove worn on the one catching hand, its prop subject: the ball meets its `pocket`, the hand turned as its bare palm would be (`createGlove`'s contacts). A bare hand when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/HumanMutual.ts (HumanMutual.pass, params); chain/HumanChainMutual.ts (HumanChainMutual.catchObject, params); throwing/catchObject.ts (catchObject.plan, context); throwing/catchObject.ts (catchObject.plan, return); actions/HumanMutual.ts (HumanMutual.pass); executable/cases/throwCases.ts (throwCases.object).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanSide, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanCatchObject {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The source anchor, prop and hand configuration identify the catch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Ordinary and staged catch share the same hand options.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The referenced throw and ball supply the ordinary approach.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The anchor of the throw caught. */
    from: string;

    /** One hand or two; `two` when absent. The hands reach the object in the aimed movement time to its size (McIntosh et al. 2018), give 0.05 to 0.15 m with it (provisional) and hold it at the sternum. */
    hands?: "one" | "two";

    /** The catching hand when one; `right` when absent. */
    side?: AutoMovieHumanSide;

    /** The ball caught, its prop subject: its `grip` contact's aperture is its diameter (`createBall`'s contacts). */
    ball: string;

    /** A glove worn on the one catching hand, its prop subject: the ball meets its `pocket`, the hand turned as its bare palm would be (`createGlove`'s contacts). A bare hand when absent. */
    glove?: string;
  }

  /**
   * Staged catch parameters, using the prop's actual placed trajectory.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the stage-only interception time and its placement bounds.
   * @evidence contracts/development/design.md#principled-representation The ordinary hand parameters and optional positive elapsed time identify the capture on the anchored flight.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only stageCatch admits the explicit interception time.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Performance supplies the contact point even for a specified interception time.
   */
  export interface IStageParams extends IParams {
    /**
     * Seconds after the anchored prop release at which `stageCatch` reads the realized interception. Absent, use the ordinary throw's approach.
     * Exclusive minimum: 0. Unit: s. `stageCatch` admits this only inside the source action's surviving window.
     */
    intercept?: number;
  }

  /**
   * A catch's plan: an action plan with the object's place over time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation object: The object's centre at a second of the action.
   * @evidence contracts/development/design.md#principled-representation object: The object's centre at a second of the action.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: throwing/catchObject.ts (catchObject.plan, return); executable/cases/throwCases.ts (throwCases.object).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPlan extends IAutoMovieMotionHumanActionPlan {
    /**
     * The object's centre at a second of the action.
     *
     * @param seconds Seconds since the action's start.
     * @returns World metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanCatchObject.IPlan.object: The object's centre at a second of the action.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanCatchObject.IPlan.object is used through packages/motions/src/actions/HumanMutual.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanCatchObject.IPlan.object is used through packages/motions/src/actions/HumanMutual.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanCatchObject.IPlan.object is used through packages/motions/src/actions/HumanMutual.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanCatchObject.IPlan.object is used through packages/motions/src/actions/HumanMutual.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanCatchObject.IPlan.object is used through packages/motions/src/actions/HumanMutual.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanCatchObject.IPlan.object is used through packages/motions/src/actions/HumanMutual.ts.
     */
    object(seconds: number): IAutoMovieVector3;
  }

  /**
   * The staged catch law: a catch law whose plan publishes its object path (`IPlan`), so a law built on it reads the path.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the law takes staged parameters and that its plan publishes the object path.
   * @evidence contracts/development/design.md#principled-representation An action law over `IStageParams` whose `plan` narrows the result to `IPlan`, so the object path is part of the law's type.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One override of the action law's `plan`; `stageCatch` implements it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: every other member is the action law's own.
   */
  export interface IStageLaw extends IAutoMovieMotionHumanActionLaw<IStageParams> {
    /**
     * Plan a staged catch.
     *
     * @param context The action's context.
     * @returns The plan with its object path.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the input context and that the result carries the object path.
     * @evidence contracts/development/implementation.md#principled-implementation stageCatch reads the anchored action's one launch of the ball, plans the arms with the base catch law at the realized or authored interception, and admits the hold only when the recorded flight's centre matches the plan's within the 1e-6 m flight parity.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The base catch law owns arm goals and timing; the staged plan adds only the launch check and the capture-bearing holds.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing, foreign or missed launch is refused; no second trajectory or grip proxy replaces the recorded flight.
     * @evidence contracts/development/implementation.md#efficient-algorithms One base plan and a constant number of flight reads per call, beyond the base catch law's own cost.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The base catch law's plan is reused rather than recomputed; the interception is read from the performance's prop reader.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned plan retains the base plan, the capture's launch reference and its match closure for as long as the performance holds the plan.
     */
    plan(context: IAutoMovieMotionHumanActionContext<IStageParams>): IPlan;
  }
}
