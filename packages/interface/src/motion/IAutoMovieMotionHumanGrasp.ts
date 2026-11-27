import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieGripKind } from "../model/AutoMovieGripKind";
import type { IAutoMovieCurlChainUntilContact } from "../pose/IAutoMovieCurlChainUntilContact";
import type { IAutoMoviePose } from "../pose/IAutoMoviePose";
import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieHumanLimbGoal } from "./IAutoMovieHumanLimbGoal";
import type { IAutoMovieHumanLimbReference } from "./IAutoMovieHumanLimbReference";
import type { IAutoMovieMotionHumanHand } from "./IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";

/**
 * A prop's grip affordance as a grasp target, and the hand that grasps it:
 * where the grip socket goes, how the hand turns, how wide it opens on the way
 * and how its digits close.
 *
 * The affordance frame follows the one convention of `AutoMovieAffordanceKind`:
 * `+Y` points out of the contact, so the hand arrives along `-Y` with its palm
 * facing into the object, and the wrapped axis runs along `+X`, the thumb side
 * toward `+X`. The grasp lays the hand's grip socket (the centre of a power
 * grip, 25 mm out from the palm) on the affordance point with the socket's palm
 * normal along `-Y` and its thumb-side forward along `+X` (`HumanHand.reach`),
 * which fixes the hand's rotation, and then sets the palm on the grasped part's
 * near surface, half the grasped width back from the affordance point on the
 * part's axis, so a thick part is not entered by a palm placed for the socket's
 * nominal 50 mm handle; the arm is then solved by inverse kinematics for an
 * effector frame laid on the object's authored grip marker.
 *
 * The grasped width is the affordance's `aperture`, or else the extent along
 * the approach axis of the prop's collider nearest the grip point (the span the
 * closing hand must clear), read from the engine's `physicalShapeSpan`.
 * `HumanPreshape` opens the hand for it on the way.
 */
export namespace IAutoMovieMotionHumanGrasp {
  /**
   * A prop affordance as a target at a film second, from its displayed frame. A
   * grasp target in the world.
   */
  export interface ITarget {
    /** The grip point, world metres. */
    point: IAutoMovieVector3;

    /**
     * The unit direction the hand arrives along, into the object (the
     * affordance's `-Y`).
     */
    approach: IAutoMovieVector3;

    /** The unit wrapped axis (the affordance's `+X`). */
    axis: IAutoMovieVector3;

    /** The grip kind. */
    grip: AutoMovieGripKind;

    /** The grasped width, metres. */
    width: number;

    /** The prop's colliders in the world. */
    colliders: IAutoMovieCurlChainUntilContact.ICollider[];
  }

  /**
   * A key pose of a stroke: the posture the arm is fitted in, the wrist goal
   * and the elbow hint.
   */
  export interface IKey {
    /** The posture's other limbs and trunk at the key. */
    posture: IAutoMovieMotionHumanPosture;

    /** The wrist goal at the key. */
    wrist: IAutoMovieMotionHumanHand.IWrist;

    /** The elbow hint at the key, world metres. */
    bend: IAutoMovieVector3;

    /**
     * How far what the key places strays from its place once the arm is fitted
     * to the key within its ranges, metres: a held tool's working point off
     * where its use asks it, a worn thing's socket off its region. Absent, the
     * key places nothing but the hand.
     *
     * @param bones The fitted body's bones.
     * @returns Metres, not negative.
     */
    judge?(
      bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ): number;

    /**
     * The most the judgement may be, metres: the bound the action that asks the
     * key holds the pose to. The caller's own bound when absent.
     */
    bound?: number;

    /**
     * The limb goal the key is fitted by, as the action that asks it fits its
     * own pose (its effector's kept point, its elbow); the wrist at `wrist`
     * with `bend`, the elbow left to the body, when absent.
     */
    goal?: IAutoMovieHumanLimbGoal;

    /**
     * False for a key another action asks, which that action fits on its own
     * arm solution: the key is fitted without the grasp's (`reachable`'s
     * reference). Fitted on the grasp's when absent.
     */
    reference?: false;
  }

  /** The reachable grip {@link reachable} chose. */
  export interface IReach {
    /** Degrees of the chosen turn. */
    turn: number;

    /** Degrees of the chosen tilt. */
    tilt: number;

    /** The wrist goal of that turn and tilt. */
    wrist: IAutoMovieMotionHumanHand.IWrist;

    /** The hand the arm achieves for it. */
    shown: IAutoMovieMotionHumanHand.IWrist;

    /** The arm's solution at the grasp, the reference of the whole stroke. */
    reference: IAutoMovieHumanLimbReference;

    /**
     * The error the arm leaves over the grasp and its stroke: degrees of
     * rotation plus millimetres of position.
     */
    miss: number;

    /**
     * How far the fitted elbow turns from its hint about the shoulder-to-wrist
     * line, worst over the grasp and its stroke, degrees.
     */
    departure: number;

    /**
     * The error the arm leaves at the grasp and then at each key of its stroke,
     * in the stroke's order, counted as `miss` is.
     */
    keys: readonly number[];

    /**
     * Each of those keys' own judgement (`IKey.judge`), metres, in the same
     * order; `NaN` for a key that has none, the grasp's always: what a law
     * reads to say which pose of a use the grasp cannot hold.
     */
    judged: readonly number[];

    /**
     * The bound each of those keys holds its judgement to (`IKey.bound`),
     * metres, in the same order; `NaN` where none.
     */
    bounds: readonly number[];

    /** The posed body at the grasp. */
    pose: IAutoMoviePose;
  }

  /**
   * The reachable variant of a symmetric hand goal: among the goals a family of
   * turns produces (about a grasped part's own axis, where any azimuth wraps it
   * alike, or about the palm's normal, where the palm's contact is unchanged),
   * the one the arm can actually take from a posture, by the error left after
   * the arm's fit over its three goals: the hand's rotation in degrees, the
   * wrist's position in millimetres and the elbow's turn from its hint about
   * the shoulder-to-wrist line in degrees, the one freedom a placed wrist
   * leaves the elbow (Tolani, Goswami and Badler 2000). The fit gives up the
   * elbow hint before the hand, so a hand turn the wrist's range cannot hold
   * with the hinted elbow is reached by the other arm pose, the elbow raised;
   * counting that turn as error ranks the grip the arm takes as the law asked
   * above one it takes by leaving its bend. The authored turn wins ties by a
   * hundredth of a degree per degree of turn. Grasp planners rank a part's
   * symmetric grasps by reachability the same way (Miller et al. 2003,
   * Automatic grasp planning using shape primitives), since an authored grip
   * frame alone may ask the wrist for more deviation than it has. Input
   * required of HumanGrasp.reachable. What a grip must hold before its cost
   * counts: a measure of its per-key errors, judgements and the bounds the keys
   * hold their judgements to (the grasp's, then each stroke key's; `NaN` where
   * none) and the most it may be. A grip within the bound is chosen before any
   * beyond it; with none within, the one nearest the bound is returned for the
   * caller to refuse. Absent, the least cost alone decides.
   */
  export type IReachableRequired = {
    /**
     * Largest accepted score in the caller's measure units. pickUpSearch uses a
     * dimensionless maximum residual-to-bound ratio and bound 1. Acceptance is
     * prioritised before cost; if no candidate passes, reachable returns the
     * least measured candidate for its caller to reject.
     */
    bound: number;
    /**
     * Synchronous candidate score over aligned grasp-then-stroke arrays. keys
     * contains the existing composite degree/millimetre arm-fit scores; judged
     * and bounds are metres, with NaN where no explicit judge/bound exists
     * (including the first grasp). The caller defines score units and must
     * handle sentinels and validity. Its result is compared with bound;
     * callback exceptions propagate, and the borrowed arrays are call-local.
     */
    measure: (
      keys: readonly number[],
      judged: readonly number[],
      bounds: readonly number[],
    ) => number;
  };
}
