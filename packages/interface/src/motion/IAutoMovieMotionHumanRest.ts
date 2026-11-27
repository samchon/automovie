import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanHand } from "./IAutoMovieMotionHumanHand";

/**
 * Standing with the hands at rest places: in the front pockets, on the hips,
 * arms crossed, clasped in front or behind, behind the head, or the chin on a
 * fist, each hand moved there and held.
 *
 * Every rest place is an effector goal on the body's own surface: a hand
 * surface is laid on a region with the palm facing into it; the palm and fist
 * sockets lie on the hand's own collider surface, so a laid hand touches the
 * region rather than sinking into it ({@link HumanHand}). The places, with the
 * surface and region each uses:
 *
 * - `side`: no goal; the arm hangs relaxed as the stand law holds it.
 * - `pocket`: the palm on the front pocket region of the same side's thigh,
 *   fingers down, as a hand slipped into a front pocket shows from outside.
 * - `hip`: the palm on the side of the pelvis midway between the hip region and
 *   the waist, fingers forward and down, elbow out (akimbo).
 * - `crossed`: each palm lies on the front of the other upper arm three quarters
 *   of the way to its elbow, fingers round its outside, so the forearms cross
 *   in front of the lower chest. Each arm's pose depends on the other's goal,
 *   so both upper arms are set first: hanging forward at least 20 degrees
 *   (provisional) and enough for the forearms to clear the chest, the elbows
 *   drawn in until each palm lies one forearm from its own elbow; each elbow's
 *   hint is then that elbow, so the solved arms are the arms the palms were
 *   laid on.
 * - `claspedFront`: the left palm lies on the front of the pelvis, at the height
 *   a slightly flexed arm reaches, and the right palm on the back of the left
 *   hand; each hand continues its forearm (`restClasped`).
 * - `claspedBehind`: the back of the left hand rests on the sacrum, palm facing
 *   back, and the back of the right hand lies in the left palm
 *   (`restClasped`).
 * - `behindHead`: each palm on the back of the head beside the midline, elbows
 *   wide.
 * - `chinRest`: the top of the fist under the chin, fingers up and palm facing
 *   in, the elbow low and forward.
 * - `elbowSupport`: the palm under the other arm's elbow while that hand is at
 *   `chinRest`, the thinking pose.
 *
 * Each arm is carried in joint angles from where the entry left it to its place
 * on a minimum-jerk course (`AutoMovieMotionHumanArm.carry`), the fingers
 * taking the place's shape on the same course, over the free-space time of the
 * hand's distance (`AutoMovieMotionHumanTiming.transport`) and holds there; the
 * place follows the body, so breathing and sway carry the hands with it. A hand
 * at `side` is not moved.
 */
export namespace IAutoMovieMotionHumanRest {
  /** Parameters. */
  export interface IParams {
    /** The left hand's place; `side` when absent. */
    left?: IAutoMovieMotionHumanRest.Place;

    /** The right hand's place; `side` when absent. */
    right?: IAutoMovieMotionHumanRest.Place;

    /** How long, seconds, positive; 2 when absent. */
    hold?: number;
  }

  /** Both hands' rest goals on a posture ({@link restGoals}). A rest place. */
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

  /** A hand's rest goal in world metres. */
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
