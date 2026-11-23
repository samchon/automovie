import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionClock } from "../compose/IAutoMovieMotionClock";
import type { IAutoMovieMotionHumanActionContext } from "../law/IAutoMovieMotionHumanActionContext";
import type { IAutoMovieHumanLimbGoal } from "../posture/IAutoMovieHumanLimbGoal";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanGrasp } from "./IAutoMovieMotionHumanGrasp";
import type { IAutoMovieMotionHumanGraspUse } from "./IAutoMovieMotionHumanGraspUse";

/**
 * A held tool used as the grasp it was taken up by presents it: the act
 * that works with it keeps the hand's rotation the grasp was chosen to hold
 * at the place of use (`HumanGraspUse.presented`), so it asks the wrist only
 * what the grip was taken for, and a second hand that steadies the tool (a
 * camera's other end) is laid on the tool's other handle where the first
 * hand carries it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation context: Borrowed action body, entry and subject/prop resolvers for the assisting hand. clock: Action-relative clock shared with the primary hand's use. goal: Retained synchronous callback for the PRIMARY hand's goal at a displayed posture and action-relative second. This goal places the tool and thus the assisting handle; exceptions propagate during evaluation.
 * @evidence contracts/development/design.md#principled-representation context: Borrowed action body, entry and subject/prop resolvers for the assisting hand. clock: Action-relative clock shared with the primary hand's use. goal: Retained synchronous callback for the PRIMARY hand's goal at a displayed posture and action-relative second. This goal places the tool and thus the assisting handle; exceptions propagate during evaluation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/HumanHeldUse.ts (HumanHeldUse.kept, kept); handling/HumanHeldUse.ts (HumanHeldUse.key, grasp); handling/HumanHeldUse.ts (HumanHeldUse.second, props).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanGraspUse.IUse, IAutoMovieMotionHumanActionContext, IAutoMovieMotionClock, AutoMovieHumanSide, IAutoMovieMotionHumanGrasp.IKey identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanHeldUse {
  /**
   * The grasp a held tool was taken up by for its use (`pickUp`'s `handle` and `use.line`), which an act that uses it keeps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation handle: The handle the tool was taken by. line: The line its use names (`IAutoMovieMotionHumanGraspUse.IUse.line`).
   * @evidence contracts/development/design.md#principled-representation handle: The handle the tool was taken by. line: The line its use names (`IAutoMovieMotionHumanGraspUse.IUse.line`).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/HumanHeldUse.ts (HumanHeldUse.key, grasp).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanGraspUse.IUse identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IGrasp {
    /** The handle the tool was taken by. */
    handle: string;

    /** The line its use names (`IAutoMovieMotionHumanGraspUse.IUse.line`). */
    line: IAutoMovieMotionHumanGraspUse.IUse["line"];
  }

  /**
   * What an act states of the held tool it uses: the prop, its working point, the grasp kept and the other hand's handle, each absent when unused.
   *
   * @evidence contracts/development/common.md#meaningful-documentation prop: The held prop's subject id. point: The prop's working point, one of its affordance ids. grasp: The grasp the prop was taken up by for its use.
   * @evidence contracts/development/design.md#principled-representation prop: The held prop's subject id. point: The prop's working point, one of its affordance ids. grasp: The grasp the prop was taken up by for its use.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/HumanHeldUse.ts (HumanHeldUse.kept, kept).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHeldUse.IGrasp identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IKept {
    /** The held prop's subject id. */
    prop?: string;

    /** The prop's working point, one of its affordance ids. */
    point?: string;

    /** The grasp the prop was taken up by for its use. */
    grasp?: IAutoMovieMotionHumanHeldUse.IGrasp;

    /** The prop's handle the other hand takes. */
    other?: string;
  }

  /**
   * The other hand on a held tool's other handle: its reach, hold and return planned as one trajectory over the span the act's own weight states (`AutoMovieMotionHumanArm.stated`), from its entry angles to the grasp of that handle where the holding hand's goal puts the tool at each second, so it meets the tool as the tool arrives and leaves it as it goes. The turn about the handle is chosen once, the one the arm reaches best with the tool at its use (`HumanGrasp.reachable`), and the arm is held to that solution. Input props of HumanHeldUse.second. The act's context and clock, the holding hand and its goal, the tool, the other handle, the tool's pose at its use and the weight.
   *
   * @evidence contracts/development/common.md#meaningful-documentation context: Borrowed action body, entry and subject/prop resolvers for the assisting hand. clock: Action-relative clock shared with the primary hand's use. goal: Retained synchronous callback for the PRIMARY hand's goal at a displayed posture and action-relative second. This goal places the tool and thus the assisting handle; exceptions propagate during evaluation.
   * @evidence contracts/development/design.md#principled-representation context: Borrowed action body, entry and subject/prop resolvers for the assisting hand. clock: Action-relative clock shared with the primary hand's use. goal: Retained synchronous callback for the PRIMARY hand's goal at a displayed posture and action-relative second. This goal places the tool and thus the assisting handle; exceptions propagate during evaluation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/HumanHeldUse.ts (HumanHeldUse.second, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanActionContext, IAutoMovieMotionClock, AutoMovieHumanSide, IAutoMovieMotionHumanGrasp.IKey, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type ISecondProps = {
    /** Borrowed action body, entry and subject/prop resolvers for the assisting hand. */
    context: Pick<
      IAutoMovieMotionHumanActionContext,
      "body" | "entry" | "prop" | "start" | "subject"
    >;
    /** Action-relative clock shared with the primary hand's use. */
    clock: IAutoMovieMotionClock;
    /** Primary holding-hand side; the planned assisting hand is the opposite side. */
    side: AutoMovieHumanSide;
    /** Scene subject id of the prop held by the primary hand. */
    prop: string;
    /** Affordance id grasped by the assisting hand. */
    handle: string;
    /** Primary hand's solved use key; its wrist places the tool while the assisting hand's grasp is chosen. */
    key: IAutoMovieMotionHumanGrasp.IKey;
    /**
     * Retained synchronous callback for the PRIMARY hand's goal at a displayed posture and action-relative second. This goal places the tool and thus the assisting handle; exceptions propagate during evaluation.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanHeldUse.ISecondProps.goal: Retained synchronous callback for the PRIMARY hand's goal at a displayed posture and action-relative second. This goal places the tool and thus the assisting handle; exceptions propagate during evaluation.
     */
    goal: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ) => IAutoMovieHumanLimbGoal;
    /**
     * Retained synchronous blend-weight callback in action-relative seconds; returns the assisting hand's dimensionless contribution.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanHeldUse.ISecondProps.weight: Retained synchronous blend-weight callback in action-relative seconds; returns the assisting hand's dimensionless contribution.
     */
    weight: (seconds: number) => number;
  };
}
