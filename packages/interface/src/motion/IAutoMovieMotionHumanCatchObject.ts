import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanActionContext } from "./IAutoMovieMotionHumanActionContext";
import type { IAutoMovieMotionHumanActionLaw } from "./IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanActionPlan } from "./IAutoMovieMotionHumanActionPlan";

/**
 * Catching an object thrown by another action: the hands meet it where its path
 * enters the reach, give with it, and bring it to the chest.
 *
 * The goal is an interception. The throw's plan carries its launch
 * (`throwObject.of`), so the path is known in closed form, drag-free. The catch
 * point is where the path first comes within `REACH` arm lengths ahead of the
 * catcher's root along its heading (provisional), and the contact instant the
 * path's time there; a path that never comes so near, or a point the arms
 * cannot reach from the shoulders, is refused. With two hands the palms take
 * the object from both sides, each palm on its surface across the catcher's
 * left-right axis; with one the palm takes it from behind, facing the way it
 * comes, or with a worn glove (`glove`) the hand turned as that palm would be
 * and moved so the glove's pocket meets it. The fingers take the turn about the
 * palm's normal (`ROLLS`, upward first) the arm holds at the contact with the
 * least strain (`AutoMovieMotionHumanBend.strain`), so the wrist's range
 * decides it. The ball's size is the ball's own (`ball`, `HumanBall`). The
 * hands travel there on minimum-jerk progress over the aimed movement time to
 * an object of its size (McIntosh et al. 2018,
 * `motionHumanTiming.aimed`), arriving at contact; the anticipatory
 * `prepare` instant is 100 ms before impact (Lacquaniti and Maioli 1989, J
 * Neurosci 9:134). After contact the hands give `GIVE` along the object's
 * velocity over `GIVE_TIME` (the issue's 0.05 to 0.15 m, provisional), which is
 * `secured`, then carry it to before the sternum and hold it. Events: `reach`,
 * `prepare`, `contact`, `secured`, `held`.
 *
 * Not yet: hand closure timed by optical expansion (Savelsbergh et al. 1991), a
 * running catch (McLeod and Dienes 1996), a fumble, the catch against the
 * chest, and a held prop handed from the throw.
 */
export namespace IAutoMovieMotionHumanCatchObject {
  /** How many hands take the object: `one` or `two`. */
  export type Hands = "one" | "two";

  /** Parameters. */
  export interface IParams {
    /** The anchor of the throw caught. */
    partner: string;

    /**
     * One hand or two; `two` when absent. The hands reach the object in the
     * aimed movement time to its size (McIntosh et al. 2018), give 0.05 to 0.15
     * m with it (provisional) and hold it at the sternum.
     */
    hands?: IAutoMovieMotionHumanCatchObject.Hands;

    /** The catching hand when one; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /**
     * The ball caught, its prop subject: its `grip` contact's aperture is its
     * diameter (`createBall`'s contacts).
     */
    ball: string;

    /**
     * A glove worn on the one catching hand, its prop subject: the ball meets
     * its `pocket`, the hand turned as its bare palm would be (`createGlove`'s
     * contacts). A bare hand when absent.
     */
    glove?: string;
  }

  /** Staged catch parameters, using the prop's actual placed trajectory. */
  export interface IStageParams extends IParams {
    /**
     * Seconds, positive, after the anchored prop's release at which
     * `stageCatch` reads the realized interception; `stageCatch` admits it only
     * inside the source action's surviving window. The ordinary throw's
     * approach when absent.
     */
    intercept?: number;
  }

  /** A catch's plan: an action plan with the object's place over time. */
  export interface IPlan extends IAutoMovieMotionHumanActionPlan {
    /**
     * The object's centre at a second of the action.
     *
     * @param seconds Seconds since the action's start.
     * @returns World metres.
     */
    object(seconds: number): IAutoMovieVector3;

    /** The same path, offered by the catch's family. */
    offers: IAutoMovieMotionHumanActionPlan.ICaught;
  }

  /**
   * The staged catch law: a catch law whose plan publishes its object path
   * (`IPlan`), so a law built on it reads the path.
   */
  export interface IStageLaw extends IAutoMovieMotionHumanActionLaw<IStageParams> {
    /**
     * Plan a staged catch.
     *
     * @param context The action's context.
     * @returns The plan with its object path.
     */
    plan(context: IAutoMovieMotionHumanActionContext<IStageParams>): IPlan;
  }
}
