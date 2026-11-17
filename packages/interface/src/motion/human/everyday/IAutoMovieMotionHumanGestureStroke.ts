import type { IAutoMovieMotionHumanBend } from "./IAutoMovieMotionHumanBend";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanTarget } from "../compose/IAutoMovieMotionHumanTarget";
import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * The stroke of each gesture: where each hand surface goes, turned which
 * way and in which shape, as a function of the stroke's progress, and which
 * joints a gesture moves directly.
 *
 * Hand gestures are effector goals. Each names a hand surface, a world
 * point and a hand rotation; the gesture law transports the hand there in the
 * preparation phase and back in the retraction, and the arm is solved by
 * inverse kinematics ({@link HumanHand}). Points are built in the performer's
 * own frame (`x` left, `y` up, `z` forward from the root) from the body's
 * measure, or on a target or on the body's own face, so every gesture fits
 * any stature and proportion. A place of the air is written in the names of
 * {@link IAutoMovieMotionHumanTargetGrid.Place} (a height, a lateral and a
 * distance, with a nudge in arm lengths where the stroke moves about it), a
 * hand's turn in the axes of {@link IAutoMovieMotionHumanHand.Direction}, and a joint angle
 * as a level of {@link AutoMovieMotionHumanRange}:
 *
 * - `wave`: the open palm faces forward beside the head, at eye height,
 *   outside the shoulder and near; the hand swings side to side `0.06` arm
 *   lengths, tilting as the forearm turns about the elbow, about 2.5 cycles a
 *   second (provisional).
 * - `raiseHand`: the open palm forward, raised from the shoulder to overhead
 *   by the extent; `cheer` raises both fists and pumps them `0.08` arm
 *   lengths.
 * - `stopPalm`: the open palm faces forward at shoulder height, inside the
 *   shoulder and far, pushed `0.05` arm lengths further in the stroke.
 * - `point`: the index fingertip on the line from the eye on the pointing
 *   side to the target, as people point (Henriques and Crawford 2002, J
 *   Neurophysiol 87:1677, found the fingertip placed on the line from the
 *   dominant eye; the side's eye is the provisional choice), at the distance
 *   where the arm reaches with `0.95` of its length, the fingers along the
 *   line and the palm down.
 * - `palmsUp`: both open palms up, forearms forward at the waist, the
 *   offering and not-knowing gesture; `shrug` adds it under raised shoulders.
 * - `beckon`: the palm up at chest height while the fingers curl and open,
 *   about 1.7 cycles a second (provisional).
 * - `clap`: both palms face each other ahead of the chest and meet at
 *   the midpoint on each beat, three beats a second (provisional; free
 *   applause is faster than the near-2 Hz synchronised rhythm, Neda et al.
 *   2000, Nature 403:849).
 * - `thumbsDown`: the fist ahead of the chest, the palm outward and the
 *   knuckles ahead and 45 degrees down, so a straight thumb, which leans
 *   toward the knuckles, points down; the elbow is asked out at the
 *   shoulder's height, which leaves the forearm a quarter turn instead of a
 *   half (provisional place, tip and elbow).
 * - `rubHands`: the palms together, sliding opposite ways along the fingers.
 * - `palmsTogether`: the palms pressed together ahead of the chest, the
 *   fingers up and forward, held: the clap's hand pose without its parting
 *   (a prayer, a wai or gassho greeting).
 * - `touchFace`: the index fingertip, hand flat, on a face region with the
 *   palm toward the face and the fingers up, held; `pushGlasses` slides it
 *   12 mm up the nose bridge; `scratchHead` rubs it 15 mm on the head's side
 *   four times a second (provisional).
 *
 * Gestures of the head, shoulders and trunk are joint angles, stated by
 * {@link gestureJoints}; pointing and self-touch read the posed trunk in
 * {@link gestureTouch}; the strokes ride the signals of {@link gestureSignal}.
 * Amplitudes and distances that express the gesture's size scale with the
 * Effort extent; contact points and the pointing line do not.
 *
 * @evidence contracts/development/common.md#meaningful-documentation vary: This repeat's variation of a named place, for `wave` and `stopPalm`; absent, the place is as named. point: World point, metres. out: Extra outward elbow share.
 * @evidence contracts/development/design.md#principled-representation vary: This repeat's variation of a named place, for `wave` and `stopPalm`; absent, the place is as named. point: World point, metres. out: Extra outward elbow share.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/gesture.ts (gesture.plan.input, return); everyday/gestureStroke.ts (gestureStroke.hand, input); everyday/gestureTouch.ts (gestureTouch.point, input); everyday/gestureTouch.ts (gestureTouch.touch, input); everyday/gestureHands.ts (gestureHands.hand, goal); everyday/gestureStroke.ts (gestureStroke.hand, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanHand.Side, IAutoMovieVector3, IAutoMovieMotionHumanTarget.IDefault, IAutoMovieMotionHumanHand.Surface identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanGestureStroke {
  /**
   * A gesture: the hand gestures, whose strokes are hand goals, and the head,
   * shoulder and trunk gestures, whose strokes are joint angles; `bow` is
   * the trunk's pitch, which the gesture law applies.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two families of gesture and where `bow` is handled; the namespace doc describes each gesture's goal.
   * @evidence contracts/development/design.md#principled-representation A closed union of the communicative gestures supported; `gestureStrokeTables.RHYTHM` and `gestureStrokeTables.HANDS` are total records over it, so every kind has a timing and a hand count by type.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here and read by the gesture law's parameters, the capture cases, the gesture verdicts and the CI breath and gaze test that walks the tables.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Variation enters as table rows keyed by the union and exhaustive switches, not as per-gesture members.
   */
  export type Kind =
    | "wave"
    | "raiseHand"
    | "cheer"
    | "stopPalm"
    | "point"
    | "palmsUp"
    | "beckon"
    | "clap"
    | "rubHands"
    | "palmsTogether"
    | "thumbsDown"
    | "touchFace"
    | "pushGlasses"
    | "scratchHead"
    | "shrug"
    | "nod"
    | "shakeHead"
    | "bow"
    | "chinLift"
    | "squareShoulders"
    | "slump";

  /**
   * A face region a self-touch reaches: the subset of the body's surface
   * regions on the head that `touchFace` may name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which gesture names it and that its members are the head's surface regions.
   * @evidence contracts/development/design.md#principled-representation A closed union whose every member is a humanoid surface region name, so a value is always a region the body's surfaces define and `touch` passes it straight to the region lookup.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here and read by the gesture law's `region` parameter and `IInput`; the region names themselves are owned by the interface package's region union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Narrows the interface's region union to the head instead of redeclaring regions; `pushGlasses` and `scratchHead` choose their own regions and ignore it.
   */
  export type FaceRegion =
    | "forehead"
    | "noseBridge"
    | "mouth"
    | "chin"
    | "templeLeft"
    | "templeRight"
    | "earLeft"
    | "earRight"
    | "nape";

  /**
   * What a stroke is computed from at one instant: the body, its posture
   * without the gesture's arms, the target and face region, and the Effort
   * extent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each field states its role, unit or frame, and the gesture that reads it.
   * @evidence contracts/development/design.md#principled-representation The posture is the instant's world posture the goals are built in; the target is a world point in metres; the extent is a dimensionless multiplier; a missing target for `point` is refused when the goal is built.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here and built by the gesture law once per hand per instant; body, posture, hand side and region types are imported from their owners.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Remaining violation: `side` is written by the gesture law but read by no stroke, since `hand` takes the side as its own parameter; the member can go in a follow-up.
   */
  export interface IInput {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The body's posture at the instant, without the gesture's arms. */
    base: IAutoMovieMotionHumanPosture;

    /** The gesturing hand of a one-hand gesture. */
    side: IAutoMovieMotionHumanHand.Side;

    /** The pointing target's world point, for `point`. */
    target?: IAutoMovieVector3;

    /** The touched region, for `touchFace`. */
    region: IAutoMovieMotionHumanGestureStroke.FaceRegion;

    /** Effort extent multiplier. */
    extent: number;

    /**
     * This repeat's variation of a named place, for `wave` and `stopPalm`;
     * absent, the place is as named.
     *
     * @param record The named place's share record.
     * @returns The varied share record.
     */
    vary?(
      record: IAutoMovieMotionHumanTarget.IDefault,
    ): IAutoMovieMotionHumanTarget.IDefault;
  }

  /**
   * One hand's goal: which hand surface goes to which world point, turned
   * how, in which shape, with an outward elbow share and an optional finger
   * curl.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each field states its role, unit and frame, and the curl's absent meaning (no extra flexion).
   * @evidence contracts/development/design.md#principled-representation An effector goal: a named hand surface, a world point in metres and a world rotation from rest, the form the shared hand solver takes; the shape and surface are closed unions from HumanHand.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here and read by the gesture law, which turns it into a hand request; surface, shape and rotation types are imported from their owners.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `curl` is optional because only the beckon flexes the fingers over its shape; every other field is always set, so no combination is meaningless.
   */
  export interface IHand {
    /** The surface brought to the point. */
    surface: IAutoMovieMotionHumanHand.Surface;

    /** The hand shape. */
    shape: IAutoMovieMotionHumanHand.Shape;

    /** World point, metres. */
    point: IAutoMovieVector3;

    /** The hand's world rotation from rest. */
    rotation: IAutoMovieQuaternion;

    /** Extra outward elbow share. */
    out: number;

    /** Where the elbow is asked to lie, as shares of the upper arm from the shoulder; where an unloaded arm hangs when absent. */
    elbow?: IAutoMovieMotionHumanBend.IShares;

    /** Extra finger flexion added to the shape, degrees (the beckon's curl). */
    curl?: number;
  }
}
