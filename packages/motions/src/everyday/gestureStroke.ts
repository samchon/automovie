import type {
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanGestureStroke,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTargetGrid,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTargetGrid } from "../compose/AutoMovieMotionHumanTargetGrid";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
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
 * {@link AutoMovieMotionHumanTargetGrid.Place} (a height, a lateral and a
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
    kind: IAutoMovieMotionHumanGestureStroke.Kind,
    side: IAutoMovieMotionHumanHand.Side,
    u: number,
    cycles: number,
    input: IAutoMovieMotionHumanGestureStroke.IInput,
  ): IAutoMovieMotionHumanGestureStroke.IHand {
    const { body } = input;
    const m = body.measure;
    const sign: number = side === "left" ? 1 : -1;
    const L: number = m.upperArm + m.forearm;
    const frame: IAutoMovieMotionHumanFrame.IFrame = {
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
      place: IAutoMovieMotionHumanTargetGrid.Place,
      reach: number = 1,
      named?: IAutoMovieMotionHumanTargetGrid.Place,
    ): IAutoMovieVector3 => {
      const shares: IAutoMovieMotionHumanTarget.IDefault =
        AutoMovieMotionHumanTargetGrid.place(body, side, place);
      const base: IAutoMovieMotionHumanTarget.IDefault | undefined =
        named === undefined || input.vary === undefined
          ? undefined
          : AutoMovieMotionHumanTargetGrid.place(body, side, named);
      const varied: IAutoMovieMotionHumanTarget.IDefault | undefined =
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
      fingers: IAutoMovieMotionHumanHand.Direction,
      palm: IAutoMovieMotionHumanHand.Direction,
    ): IAutoMovieQuaternion =>
      HumanHand.facing(side, frame.yaw, { fingers, palm });
    const wave: number = gestureSignal.oscillation(u, cycles);
    const e: number = input.extent;
    switch (kind) {
      case "wave": {
        // The swing is drawn in the waving hand's own frame, inward first
        // for either hand, so a left wave is the mirror of a right one; the
        // fingers lean with the hand the way it swings.
        const swing: number = 0.06 * e * wave;
        const tilt: number = Math.atan2(swing * L, m.forearm);
        return {
          surface: "palm",
          shape: "flat",
          point: put(
            {
              at: { height: "eye", lateral: "outside", distance: "near" },
              nudge: { out: -swing },
            },
            1,
            { height: "eye", lateral: "outside", distance: "near" },
          ),
          rotation: HumanHand.rotation(side, {
            fingers: dir(-sign * Math.sin(tilt), Math.cos(tilt), 0),
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
