import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

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
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHand.Side, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanCatchObject {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The throw's anchor, the hands and the object's size.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No catch point is typed by the author.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The anchor of the throw caught. */
    from: string;

    /** One hand or two; `two` when absent. */
    hands?: "one" | "two";

    /** The catching hand when one; `right` when absent. */
    side?: IAutoMovieMotionHumanHand.Side;

    /** The ball caught, its prop subject: its `grip` contact's aperture is its diameter (`createBall`'s contacts). */
    ball: string;

    /** A glove worn on the one catching hand, its prop subject: the ball meets its `pocket`, the hand turned as its bare palm would be (`createGlove`'s contacts). A bare hand when absent. */
    glove?: string;
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
     */
    object(seconds: number): IAutoMovieVector3;
  }
}
