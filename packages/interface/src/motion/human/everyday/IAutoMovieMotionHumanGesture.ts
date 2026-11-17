import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanHandShape } from "../posture/IAutoMovieMotionHumanHandShape";
import type { IAutoMovieMotionHumanEffort } from "./IAutoMovieMotionHumanEffort";
import type { IAutoMovieMotionHumanGestureStroke } from "./IAutoMovieMotionHumanGestureStroke";

/**
 * A communicative gesture while standing: the hand, head or trunk moves
 * through Kendon's phases (Kendon 1980; McNeill 1992, Hand and Mind):
 * preparation from rest to the stroke's start, the stroke that carries the
 * meaning, an optional post-stroke hold, and retraction to rest.
 *
 * The feet stay planted and the body stands as the stand law places it;
 * performed over a carrier (a walk, a seat, a ride) the body is the
 * carrier's, instant by instant, and the gesture takes only the parts it
 * moves. Each moving hand is an effector goal ({@link gestureStroke}),
 * solved by inverse kinematics with a natural elbow hint widened by the
 * gesture and the Effort; the moving arms are planned over the whole
 * gesture as one trajectory (`gestureHands.planned`): from what the entry
 * left to the stroke's goals in the preparation, on them through the
 * stroke, and back to the relaxed hanging arm's in the retraction, while
 * the fingers take the gesture's shape and leave it on the same share. Head, shoulder and trunk gestures add their joint angles under an
 * envelope that rises in the preparation and falls in the retraction; a bow
 * pitches the whole trunk about the hips by its depth (15, 30 or 45 degrees
 * are the conventional light, ordinary and deep bows) while the hips move
 * back to keep the body balanced over the feet ({@link HumanBalance}).
 *
 * Transport time is the free-space time of the distance moved
 * (`AutoMovieMotionHumanTiming.transport`),
 * 0.3 s for head and shoulder gestures and one second per 30 degrees of a
 * bow (provisional). The Effort's tempo scales every phase, its extent the
 * gesture's size and its elbow term the arm's width ({@link HumanEffort}).
 *
 * The plan names the hands it moves (`hands`), so a gesture with a hand that
 * holds a prop is refused, naming the free hand.
 *
 * Events: `prepare`, `strokeStart`, `strokeEnd`, `retract`. A gesture may be
 * cut into another during its retraction, making a gesture unit, and into
 * standing or moving before its stroke or after it; its stroke is never cut,
 * since a cut stroke loses the gesture's meaning.
 *
 * @evidence contracts/development/common.md#meaningful-documentation side: The hand of a one-hand gesture; `right` when absent. region: The face region a `touchFace` reaches; `forehead` when absent. count: Stroke repetitions (waves, nods, claps); the gesture's own count when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation side: The hand of a one-hand gesture; `right` when absent. region: The face region a `touchFace` reaches; `forehead` when absent. count: Stroke repetitions (waves, nods, claps); the gesture's own count when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainManual.ts (HumanChainManual.gesture, params); everyday/gesture.ts (gesture.plan, context); everyday/gestureHands.ts (gestureHands.hand, p); everyday/gesture.ts (gesture.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanGestureStroke.Kind, IAutoMovieMotionHumanHand.Side, IAutoMovieMotionTarget, IAutoMovieMotionHumanGestureStroke.FaceRegion, IAutoMovieMotionHumanEffort.IEffort, IAutoMovieMotionHumanHandShape.Emblem identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanGesture {
  /**
   * Parameters of a gesture: which gesture, which hand, what it points at or
   * touches, how many strokes, the hold, a bow's depth and the movement
   * quality.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each field states its meaning, unit, the gestures it applies to and the default an absent value takes.
   * @evidence contracts/development/design.md#principled-representation The kind is gestureStroke's closed union; the target is the shared motion target union, read at each instant so pointing follows a moving target; count, hold and depth are a whole number, seconds and degrees, validated at plan time (positive whole count, non-negative hold, a bow in (0, 60]) since the types cannot express those ranges.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by this law and read only by its plan; the kind, face region, hand and Effort types are imported from their owners.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The fields that apply to only some kinds (target, region, depth) stay optional on one record rather than a union per kind: a field a kind does not read is ignored, and the one required pairing, `point` with a target, is refused at plan time. A per-kind discriminated union would rule that state out by type.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The gesture. */
    kind: IAutoMovieMotionHumanGestureStroke.Kind;

    /** The hand of a one-hand gesture; `right` when absent. */
    side?: IAutoMovieMotionHumanHand.Side;

    /** What to point at; required by `point`. */
    target?: IAutoMovieMotionTarget;

    /** The face region a `touchFace` reaches; `forehead` when absent. */
    region?: IAutoMovieMotionHumanGestureStroke.FaceRegion;

    /** Stroke repetitions (waves, nods, claps); the gesture's own count when absent.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    count?: number;

    /** Post-stroke hold, seconds; 0 when absent.
     * Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    hold?: number;

    /** A bow's depth, degrees in (0, 60], refused outside that range only for a bow, so it carries no schema bound; 30 when absent. */
    depth?: number;

    /** Movement quality. */
    effort?: IAutoMovieMotionHumanEffort.IEffort;

    /** Degrees the moving hands are turned in the plane of their own palms from the gesture's attitude, the thumb's side rising for a positive turn (provisional sign, held by `test_human_motion_emblem_thumbs`): a quarter turn stands a held-out fist's thumb up, the opposite one points it down. No turn when absent. */
    turn?: number;

    /** A hand shape with a meaning of its own, taken by the moving hands in place of the gesture's working shape: a thumbs up, an OK ring, a V, a count; the gesture's own shape when absent. */
    shape?: IAutoMovieMotionHumanHandShape.Emblem;

    /** A digit of `shape` aimed straight at the world's up or down: the moving hands turn by the least rotation from the gesture's attitude, after `turn`, that points the digit's own direction (`HumanHandShape.digit`) there, since a straight digit does not lie along the hand's axes (a thumbs up's thumb stands about 35 degrees off the knuckle line). Requires `shape`; no aim when absent. */
    aim?: {
      /** Digit extended for the directed hand gesture. */
      digit: "thumb" | "forefinger";
      /** Whether that digit points upward or downward. */
      toward: "up" | "down";
    };

    /**
     * How much repeats of the gesture differ: `variation` in [0, 1] scales
     * the spread of the preparation's length and of where a `wave` or a
     * `stopPalm` holds the hand within its named place, and `proficiency`
     * replaces the performer's skill for those spreads. Absent or 0, every
     * repeat is the same.
     */
    manner?: Pick<IAutoMovieMotionManner.IManner, "variation" | "proficiency">;
  }
}
