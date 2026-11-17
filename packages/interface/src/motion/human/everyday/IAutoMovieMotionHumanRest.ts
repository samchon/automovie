import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";

/**
 * Standing with the hands at rest places: in the front pockets, on the hips,
 * arms crossed, clasped in front or behind, behind the head, or the chin on
 * a fist, each hand moved there and held.
 *
 * Every rest place is an effector goal on the body's own surface: a hand
 * surface is laid on a region with the palm facing into it; the palm and
 * fist sockets lie on the hand's own collider surface, so a laid hand touches
 * the region rather than sinking into it ({@link HumanHand}). The places, with
 * the surface and region each uses:
 *
 * - `side`: no goal; the arm hangs relaxed as the stand law holds it.
 * - `pocket`: the palm on the front pocket region of the same side's thigh,
 *   fingers down, as a hand slipped into a front pocket shows from outside.
 * - `hip`: the palm on the side of the pelvis midway between the hip
 *   region and the waist, fingers forward and down, elbow out (akimbo).
 * - `crossed`: each palm lies on the front of the other upper arm three
 *   quarters of the way to its elbow, fingers round its outside, so the
 *   forearms cross in front of the lower chest. Each arm's pose depends on
 *   the other's goal, so both upper arms are set first: hanging forward at
 *   least 20 degrees (provisional) and enough for the forearms to clear the
 *   chest, the elbows drawn in until each palm lies one forearm from its own
 *   elbow; each elbow's hint is then that elbow, so the solved arms are the
 *   arms the palms were laid on.
 * - `claspedFront`: the left palm lies on the front of the pelvis, at the
 *   height a slightly flexed arm reaches, and the right palm on the back of
 *   the left hand; each hand continues its forearm (`restClasped`).
 * - `claspedBehind`: the back of the left hand rests on the sacrum, palm
 *   facing back, and the back of the right hand lies in the left palm
 *   (`restClasped`).
 * - `behindHead`: each palm on the back of the head beside the midline,
 *   elbows wide.
 * - `chinRest`: the top of the fist under the chin, fingers up and palm
 *   facing in, the elbow low and forward.
 * - `elbowSupport`: the palm under the other arm's elbow while that hand is
 *   at `chinRest`, the thinking pose.
 *
 * Each arm is carried in joint angles from where the entry left it to its
 * place on a minimum-jerk course (`AutoMovieMotionHumanArm.carry`), the
 * fingers taking the place's shape on the same course, over the free-space
 * time of the hand's distance
 * (`AutoMovieMotionHumanTiming.transport`) and holds there; the place follows the body,
 * so breathing and sway carry the hands with it. A hand at `side` is not
 * moved.
 *
 * @evidence contracts/development/common.md#meaningful-documentation left: The left hand's place; `side` when absent. right: The right hand's place; `side` when absent. seconds: How long, seconds; 2 when absent. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation left: The left hand's place; `side` when absent. right: The right hand's place; `side` when absent. seconds: How long, seconds; 2 when absent. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainManual.ts (HumanChainManual.rest, params); everyday/rest.ts (rest.plan, context); everyday/rest.ts (rest.goals, places); everyday/restGoals.ts (restGoals, places); everyday/rest.ts (rest.goals, return); everyday/restClasped.ts (restClasped.front, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHand.Surface, IAutoMovieMotionHumanHand.Shape, IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanRest {
  /**
   * Parameters.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation left: The left hand's place; `side` when absent. right: The right hand's place; `side` when absent. seconds: How long, seconds; 2 when absent. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
   * @evidence contracts/development/design.md#principled-representation left: The left hand's place; `side` when absent. right: The right hand's place; `side` when absent. seconds: How long, seconds; 2 when absent. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainManual.ts (HumanChainManual.rest, params); everyday/rest.ts (rest.plan, context).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanRest.Place identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IParams {
    /** The left hand's place; `side` when absent. */
    left?: IAutoMovieMotionHumanRest.Place;

    /** The right hand's place; `side` when absent. */
    right?: IAutoMovieMotionHumanRest.Place;

    /** How long, seconds; 2 when absent.
     * Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    seconds?: number;
  }

  /**
   * Both hands' rest goals on a posture ({@link restGoals}). A rest place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both hands' rest goals on a posture ({@link restGoals}). A rest place.
   * @evidence contracts/development/design.md#principled-representation Closed choices "side", "pocket", "hip", "crossed", "claspedFront", "claspedBehind", "behindHead", "chinRest", "elbowSupport" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/rest.ts (rest.goals, places); everyday/restGoals.ts (restGoals, places); everyday/rest.ts (rest.PAIRED); everyday/rest.ts (rest.plan); everyday/restGoals.ts (restGoals); everyday/restGoals.ts (restGoals.BENDS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in rest.goals.
   */
  export type Place =
    | "side"
    | "pocket"
    | "hip"
    | "crossed"
    | "claspedFront"
    | "claspedBehind"
    | "behindHead"
    | "chinRest"
    | "elbowSupport";

  /**
   * A hand's rest goal in world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: Where the surface goes, world metres. elbow: The elbow's bend hint, world metres.
   * @evidence contracts/development/design.md#principled-representation point: Where the surface goes, world metres. elbow: The elbow's bend hint, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/rest.ts (rest.goals, return); everyday/restClasped.ts (restClasped.front, return); everyday/restClasped.ts (restClasped.front.goals, return); everyday/restClasped.ts (restClasped.behind, return); everyday/restClasped.ts (laid, return); everyday/restClasped.ts (stacked, left).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHand.Surface, IAutoMovieMotionHumanHand.Shape, IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IGoal {
    /** The surface laid on the place. */
    surface: IAutoMovieMotionHumanHand.Surface;

    /** The hand shape. */
    shape: IAutoMovieMotionHumanHand.Shape;

    /** Where the surface goes, world metres. */
    point: IAutoMovieVector3;

    /** The hand's world rotation from rest. */
    rotation: IAutoMovieQuaternion;

    /** The elbow's bend hint, world metres. */
    elbow: IAutoMovieVector3;
  }
}
