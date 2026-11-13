import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { gestureJoints } from "./gestureJoints";
import { gestureSignal } from "./gestureSignal";
import { gestureStrokeTables } from "./gestureStrokeTables";
import { gestureTouch } from "./gestureTouch";

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
 * {@link AutoMovieMotionHumanTarget.Place} (a height, a lateral and a
 * distance, with a nudge in arm lengths where the stroke moves about it), a
 * hand's turn in the axes of {@link HumanHand.Direction}, and a joint angle
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
 * @evidence contracts/development/common.md#meaningful-documentation States the law, its sources, its units and frames, and which values are provisional.
 * @evidence contracts/development/design.md#principled-representation Pure functions and constants over the interface's vectors and the engine's streams.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The functions and constants the everyday laws and their tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses engine and interface types; no consumer is special-cased.
 */
export namespace gestureStroke {
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
    body: IHumanBody;

    /** The body's posture at the instant, without the gesture's arms. */
    base: IHumanPosture;

    /** The gesturing hand of a one-hand gesture. */
    side: HumanHand.Side;

    /** The pointing target's world point, for `point`. */
    target?: IAutoMovieVector3;

    /** The touched region, for `touchFace`. */
    region: FaceRegion;

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
      record: AutoMovieMotionHumanTarget.IDefault,
    ): AutoMovieMotionHumanTarget.IDefault;
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
    surface: HumanHand.Surface;

    /** The hand shape. */
    shape: HumanHand.Shape;

    /** World point, metres. */
    point: IAutoMovieVector3;

    /** The hand's world rotation from rest. */
    rotation: IAutoMovieQuaternion;

    /** Extra outward elbow share. */
    out: number;

    /** Where the elbow is asked to lie, as shares of the upper arm from the shoulder; where an unloaded arm hangs when absent. */
    elbow?: AutoMovieMotionHumanBend.IShares;

    /** Extra finger flexion added to the shape, degrees (the beckon's curl). */
    curl?: number;
  }

  /** Each gesture's timing (`gestureStrokeTables.RHYTHM`), read here with its kind. */
  export const RHYTHM: typeof gestureStrokeTables.RHYTHM =
    gestureStrokeTables.RHYTHM;

  /** Which hands each gesture moves (`gestureStrokeTables.HANDS`), read here with its kind. */
  export const HANDS: typeof gestureStrokeTables.HANDS =
    gestureStrokeTables.HANDS;
  /**
   * A hand's goal at a share of the stroke.
   *
   * @param kind The gesture.
   * @param side The hand.
   * @param u Stroke share in [0, 1]; 0 is the goal the preparation reaches.
   * @param cycles Stroke cycles.
   * @param input The instant's inputs.
   * @returns The goal.
   * @throws {Error} For a gesture that moves no hand, or `point` without a target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result, the stroke share's range and meaning, and the refusals; the namespace doc gives each gesture's goal and its provisional values.
   * @evidence contracts/development/implementation.md#principled-implementation Builds each goal in the performer's frame from the body's own measure (arm length, shoulder and waist heights), on the eye-to-target line for pointing (Henriques and Crawford 2002, the reach solved as a ray-sphere intersection from the shoulder), or on the body's face regions offset by the finger's collider radius for self-touch, so every gesture fits any stature; periodic strokes ride {@link gestureSignal.oscillation}.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One exhaustive switch over the kind; pointing and self-touch, which need the posed trunk, live in {@link gestureTouch}; joint gestures live in {@link gestureJoints}.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The arm-length shares, swing sizes and outward elbow shares are documented provisional values; no body or scene is special-cased.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work for the frame gestures; pointing and self-touch add one trunk forward-kinematics pass.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function of the instant's input; the gesture law calls it once per hand per evaluated posture, since the base posture changes each instant.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new goal and retains nothing.
   */
  export function hand(
    kind: Kind,
    side: HumanHand.Side,
    u: number,
    cycles: number,
    input: IInput,
  ): IHand {
    const { body } = input;
    const m = body.measure;
    const sign: number = side === "left" ? 1 : -1;
    const L: number = m.upperArm + m.forearm;
    const frame: HumanFrame.IFrame = {
      origin: input.base.root,
      yaw: input.base.yaw,
    };
    const at = (x: number, y: number, z: number): IAutoMovieVector3 =>
      HumanFrame.point(frame, { x, y, z });
    const dir = (x: number, y: number, z: number): IAutoMovieVector3 =>
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: frame.yaw },
        { x, y, z },
      );
    // A place of the air by its names, in the performer's own frame: the
    // shares times the stature, the half shoulder width and the arm, ahead
    // of the root, which a lowered posture carries down with it. `reach`
    // scales the distance ahead. `named` is the place without its nudge: when
    // given and the repeat varies, the named place's offset is added, so the
    // offset is one value through the stroke whatever the nudge does.
    const put = (
      place: AutoMovieMotionHumanTarget.Place,
      reach: number = 1,
      named?: AutoMovieMotionHumanTarget.Place,
    ): IAutoMovieVector3 => {
      const shares: AutoMovieMotionHumanTarget.IDefault =
        AutoMovieMotionHumanTarget.place(body, side, place);
      const base: AutoMovieMotionHumanTarget.IDefault | undefined =
        named === undefined || input.vary === undefined
          ? undefined
          : AutoMovieMotionHumanTarget.place(body, side, named);
      const varied: AutoMovieMotionHumanTarget.IDefault | undefined =
        base === undefined ? undefined : input.vary!(base);
      const offset = (key: "lateral" | "height" | "range"): number =>
        base === undefined || varied === undefined
          ? 0
          : (varied[key] ?? 0) - (base[key] ?? 0);
      return at(
        ((shares.lateral ?? 0) + offset("lateral")) * m.shoulderHalfWidth,
        (shares.height + offset("height")) * m.stature,
        (shares.range + offset("range")) * L * reach,
      );
    };
    const facing = (
      fingers: HumanHand.Direction,
      palm: HumanHand.Direction,
    ): IAutoMovieQuaternion =>
      HumanHand.facing(side, frame.yaw, { fingers, palm });
    const wave: number = gestureSignal.oscillation(u, cycles);
    const e: number = input.extent;
    switch (kind) {
      case "wave": {
        // The swing is the same way for either hand, so it is `out` for the
        // left hand and `in` for the right.
        const swing: number = 0.06 * e * wave;
        const tilt: number = Math.atan2(swing * L, m.forearm);
        return {
          surface: "palm",
          shape: "flat",
          point: put(
            {
              at: { height: "eye", lateral: "outside", distance: "near" },
              nudge: { out: sign * swing },
            },
            1,
            { height: "eye", lateral: "outside", distance: "near" },
          ),
          rotation: HumanHand.rotation(side, {
            fingers: dir(Math.sin(tilt), Math.cos(tilt), 0),
            palm: HumanHand.direction(side, frame.yaw, "forward"),
          }),
          out: 0.3,
        };
      }
      case "raiseHand":
      case "cheer":
        return {
          surface: kind === "cheer" ? "fist" : "palm",
          shape: kind === "cheer" ? "fist" : "flat",
          point: put({
            between: [
              { height: "shoulder", lateral: "shoulder", distance: "close" },
              { height: "overhead", lateral: "shoulder", distance: "close" },
            ],
            share: Math.min(1, e),
            nudge: { up: kind === "cheer" ? 0.08 * e * Math.max(0, wave) : 0 },
          }),
          rotation: facing("up", "forward"),
          out: 0.2,
        };
      case "stopPalm":
        return {
          surface: "palm",
          shape: "flat",
          point: put(
            {
              at: { height: "shoulder", lateral: "inside", distance: "far" },
              nudge: { forward: 0.05 * gestureSignal.bump(u) },
            },
            Math.min(1, e),
            { height: "shoulder", lateral: "inside", distance: "far" },
          ),
          rotation: facing("up", "forward"),
          out: 0,
        };
      case "thumbsDown":
        // The fist ahead of the chest, the palm outward, so the thumb's side
        // is down. Under a hanging elbow that is half a turn of the forearm;
        // with the elbow out at the shoulder's height the arm itself gives a
        // quarter of it and the forearm turns the other quarter. A straight
        // thumb leans toward the knuckles (55 degrees from the thumb side's
        // own direction on the polygon man), so the knuckles are tipped 45
        // degrees down for the thumb to point down, the forearm sloping
        // down from the raised elbow with them.
        return {
          surface: "fist",
          shape: "fist",
          point: put(
            { height: "chest", lateral: "shoulder", distance: "mid" },
            Math.min(1, e),
          ),
          rotation: HumanHand.rotation(side, {
            fingers: dir(0, -Math.SQRT1_2, Math.SQRT1_2),
            palm: dir(sign, 0, 0),
          }),
          out: 0,
          elbow: { out: 0.9, up: 0, forward: 0.3 },
        };
      case "point":
        return gestureTouch.point(input, side);
      case "palmsUp":
      case "shrug":
        return {
          surface: "palm",
          shape: "flat",
          point: put({
            at: { height: "waist", lateral: "shoulder", distance: "near" },
            nudge: {
              out: 0.15 * e,
              up: 0.03 * e * gestureSignal.bump(u),
              forward: 0.15,
            },
          }),
          rotation: facing({ between: ["forward", "out"], share: 0.25 }, "up"),
          out: 0.2,
        };
      case "beckon":
        return {
          surface: "palm",
          shape: "flat",
          point: put({
            at: { height: "chest", lateral: "inside", distance: "mid" },
            nudge: { up: -0.05, forward: -0.05 },
          }),
          rotation: facing("forward", "up"),
          out: 0,
          curl:
            gestureJoints.ANGLES.beckon *
            e *
            (0.5 - 0.5 * Math.cos(2 * Math.PI * cycles * u)),
        };
      case "clap":
      case "rubHands":
      case "palmsTogether": {
        // The palms meet ahead of the chest, the fingers up and forward; a
        // clap parts them, a rub slides them opposite ways along the
        // fingers, and palms together stay as they meet.
        const apart: number =
          kind === "clap"
            ? 0.09 * e * (0.5 + 0.5 * Math.cos(2 * Math.PI * cycles * u))
            : 0;
        const slide: number = kind === "rubHands" ? sign * 0.03 * e * wave : 0;
        return {
          surface: "palm",
          shape: "flat",
          point: put({
            at: { height: "chest", lateral: "centre", distance: "near" },
            nudge: {
              out: apart,
              up: -0.1 + PRAYER.up * slide,
              forward: 0.17 + PRAYER.forward * slide,
            },
          }),
          rotation: facing(
            { explicit: PRAYER, source: "provisional: everyday-gesture-clap" },
            "in",
          ),
          out: 0.1,
        };
      }
      case "touchFace":
      case "pushGlasses":
      case "scratchHead":
        return gestureTouch.touch(kind, input, side, u, cycles);
      case "nod":
      case "shakeHead":
      case "bow":
      case "chinLift":
      case "squareShoulders":
      case "slump":
        throw new Error(`The gesture ${kind} moves no hand`);
    }
  }

  /**
   * Where the fingers of two palms held together point: up and forward, 30
   * degrees above the horizontal (provisional).
   */
  const PRAYER: { out: number; up: number; forward: number } = {
    out: 0,
    up: 0.5,
    forward: 0.866,
  };
}
