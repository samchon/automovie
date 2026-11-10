import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanTrunk } from "./HumanTrunk";

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
 * any stature and proportion:
 *
 * - `wave`: the open palm faces forward beside the head, the wrist
 *   `0.55` upper arms above the shoulder and `0.25` arm lengths ahead; the
 *   hand swings side to side `0.06` arm lengths, tilting as the forearm turns
 *   about the elbow, about 2.5 cycles a second (provisional).
 * - `raiseHand`: the open palm forward above the shoulder, the arm nearly
 *   straight (`0.92` arm lengths up); `cheer` raises both fists and pumps them.
 * - `stopPalm`: the open palm faces forward at shoulder height `0.85` arm
 *   lengths ahead, pushed `0.05` further in the stroke.
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
 * - `rubHands`: the palms together, sliding opposite ways along the fingers.
 * - `touchFace`: the index fingertip, hand flat, on a face region with the
 *   palm toward the face and the fingers up, held; `pushGlasses` slides it
 *   12 mm up the nose bridge; `scratchHead` rubs it 15 mm on the head's side
 *   four times a second (provisional).
 *
 * Gestures of the head, shoulders and trunk are joint angles because no body
 * point is brought anywhere; the movement is the segment's own rotation:
 * `nod` flexes the head 12 degrees and back twice a second (head nods in
 * conversation are small and quick, Hadar et al. 1985, J Nonverbal Behav
 * 9:214; values provisional), `shakeHead` turns it 20 degrees either way
 * about 2.2 cycles a second (provisional), `shrug` raises both shoulder
 * girdles 18 degrees (provisional, inside the 30 degree elevation range),
 * `chinLift` extends the head 15 degrees, `squareShoulders` retracts the
 * girdles 10 and extends the chest 4, `slump` flexes the chest 12, the spine
 * 6, the head 10 and protracts the girdles 10 (display postures,
 * provisional). `bow` is the trunk's pitch, handled by the gesture law.
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
   * @evidence contracts/development/design.md#principled-representation A closed union of the communicative gestures supported; `RHYTHM` and `HANDS` are total records over it, so every kind has a timing and a hand count by type.
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

    /** Extra finger flexion added to the shape, degrees (the beckon's curl). */
    curl?: number;
  }

  /** A gesture's timing: cycles in the stroke and seconds per cycle. */
  export const RHYTHM: Readonly<
    Record<Kind, { cycles: number; period: number }>
  > = {
    wave: { cycles: 3, period: 0.4 },
    raiseHand: { cycles: 1, period: 0.5 },
    cheer: { cycles: 2, period: 0.5 },
    stopPalm: { cycles: 1, period: 0.35 },
    point: { cycles: 1, period: 0.5 },
    palmsUp: { cycles: 1, period: 0.6 },
    beckon: { cycles: 2, period: 0.6 },
    clap: { cycles: 4, period: 1 / 3 },
    rubHands: { cycles: 3, period: 0.35 },
    touchFace: { cycles: 1, period: 0.8 },
    pushGlasses: { cycles: 1, period: 0.3 },
    scratchHead: { cycles: 4, period: 0.25 },
    shrug: { cycles: 1, period: 0.7 },
    nod: { cycles: 2, period: 0.5 },
    shakeHead: { cycles: 3, period: 0.45 },
    bow: { cycles: 1, period: 0.6 },
    chinLift: { cycles: 1, period: 0.8 },
    squareShoulders: { cycles: 1, period: 0.8 },
    slump: { cycles: 1, period: 0.8 },
  };

  /** Which hands each gesture moves: `one` the chosen side, `both`, or `none`. */
  export const HANDS: Readonly<Record<Kind, "one" | "both" | "none">> = {
    wave: "one",
    raiseHand: "one",
    cheer: "both",
    stopPalm: "one",
    point: "one",
    palmsUp: "both",
    beckon: "one",
    clap: "both",
    rubHands: "both",
    touchFace: "one",
    pushGlasses: "one",
    scratchHead: "one",
    shrug: "both",
    nod: "none",
    shakeHead: "none",
    bow: "none",
    chinLift: "none",
    squareShoulders: "none",
    slump: "none",
  };

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
   * @evidence contracts/development/implementation.md#principled-implementation Builds each goal in the performer's frame from the body's own measure (arm length, shoulder and waist heights), on the eye-to-target line for pointing (Henriques and Crawford 2002, the reach solved as a ray-sphere intersection from the shoulder), or on the body's face regions offset by the finger's collider radius for self-touch, so every gesture fits any stature; periodic strokes ride `oscillation`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One exhaustive switch over the kind; pointing and self-touch, which need the posed trunk, are private helpers; joint gestures live in `joints`.
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
    const turn = (
      fingers: IAutoMovieVector3,
      palm: IAutoMovieVector3,
    ): IAutoMovieQuaternion => HumanHand.rotation(side, { fingers, palm });
    const wave: number = oscillation(u, cycles);
    const e: number = input.extent;
    switch (kind) {
      case "wave": {
        const dx: number = 0.06 * L * e * wave;
        const tilt: number = Math.atan2(dx, m.forearm);
        return {
          surface: "palm",
          shape: "flat",
          point: at(
            sign * (m.shoulderHalfWidth + 0.45 * m.upperArm) + dx,
            m.shoulderHeight + 0.55 * m.upperArm,
            0.25 * L,
          ),
          rotation: turn(dir(Math.sin(tilt), Math.cos(tilt), 0), dir(0, 0, 1)),
          out: 0.3,
        };
      }
      case "raiseHand":
      case "cheer": {
        const pump: number =
          kind === "cheer" ? 0.08 * L * e * Math.max(0, wave) : 0;
        return {
          surface: kind === "cheer" ? "fist" : "palm",
          shape: kind === "cheer" ? "fist" : "flat",
          point: at(
            sign * m.shoulderHalfWidth,
            m.shoulderHeight + 0.92 * L * Math.min(1, e) + pump,
            0.1 * L,
          ),
          rotation: turn(dir(0, 1, 0), dir(0, 0, 1)),
          out: 0.2,
        };
      }
      case "stopPalm":
        return {
          surface: "palm",
          shape: "flat",
          point: at(
            sign * 0.6 * m.shoulderHalfWidth,
            m.shoulderHeight,
            (0.8 + 0.05 * bump(u)) * L * Math.min(1, e),
          ),
          rotation: turn(dir(0, 1, 0), dir(0, 0, 1)),
          out: 0,
        };
      case "point":
        return point(input, side);
      case "palmsUp":
      case "shrug":
        return {
          surface: "palm",
          shape: "flat",
          point: at(
            sign * (m.shoulderHalfWidth + 0.15 * L * e),
            m.waistHeight + 0.03 * L * e * bump(u),
            0.4 * L,
          ),
          rotation: turn(dir(sign * 0.35, 0, 1), dir(0, 1, 0)),
          out: 0.2,
        };
      case "beckon":
        return {
          surface: "palm",
          shape: "flat",
          point: at(
            sign * 0.5 * m.shoulderHalfWidth,
            m.chestHeight - 0.05 * L,
            0.55 * L,
          ),
          rotation: turn(dir(0, 0, 1), dir(0, 1, 0)),
          out: 0,
          curl: 70 * e * (0.5 - 0.5 * Math.cos(2 * Math.PI * cycles * u)),
        };
      case "clap":
      case "rubHands": {
        const centre: IAutoMovieVector3 = {
          x: 0,
          y: m.chestHeight - 0.1 * L,
          z: 0.42 * L,
        };
        const apart: number =
          kind === "clap"
            ? 0.18 * L * e * (0.5 + 0.5 * Math.cos(2 * Math.PI * cycles * u))
            : 0;
        const slide: number =
          kind === "rubHands" ? sign * 0.03 * L * e * wave : 0;
        const fingers: IAutoMovieVector3 = { x: 0, y: 0.5, z: 0.866 };
        return {
          surface: "palm",
          shape: "flat",
          point: at(
            centre.x + (sign * apart) / 2,
            centre.y + fingers.y * slide,
            centre.z + fingers.z * slide,
          ),
          rotation: turn(
            dir(fingers.x, fingers.y, fingers.z),
            dir(-sign, 0, 0),
          ),
          out: 0.1,
        };
      }
      case "touchFace":
      case "pushGlasses":
      case "scratchHead":
        return touch(kind, input, side, u, cycles);
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
   * The joints a gesture sets directly at a share of the stroke, given its
   * envelope (0 at rest, 1 in the stroke).
   *
   * @param kind The gesture.
   * @param u Stroke share in [0, 1].
   * @param cycles Stroke cycles.
   * @param envelope How far into the gesture the body is, in [0, 1].
   * @param extent Effort extent multiplier.
   * @returns Clinical degrees to add.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result's unit (clinical degrees added to the posture) and each argument's range; the namespace doc gives each gesture's angles and sources.
   * @evidence contracts/development/implementation.md#principled-implementation Joint angles because these gestures bring no body point anywhere: the movement is the segment's own rotation (head nods after Hadar et al. 1985, shrug inside the 30 degree elevation range); each amplitude scales by the envelope times the Effort extent, with nods and shakes on the stroke's cycles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One exhaustive switch; hand gestures and the bow return no angles, since their movement is owned by `hand` and the gesture law.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The amplitudes are documented provisional values; no body is special-cased.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function with nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new record and retains nothing.
   */
  export function joints(
    kind: Kind,
    u: number,
    cycles: number,
    envelope: number,
    extent: number,
  ): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    const a: number = envelope * extent;
    switch (kind) {
      case "nod":
        return {
          head: [
            12 * a * (0.5 - 0.5 * Math.cos(2 * Math.PI * cycles * u)),
            0,
            0,
          ],
        };
      case "shakeHead":
        return { head: [0, 0, 20 * a * oscillation(u, cycles)] };
      case "shrug":
        return {
          leftShoulder: [0, 18 * a, 0],
          rightShoulder: [0, 18 * a, 0],
          head: [0, 4 * a, 0],
        };
      case "chinLift":
        return { head: [-15 * a, 0, 0] };
      case "squareShoulders":
        return {
          leftShoulder: [-10 * a, 0, 0],
          rightShoulder: [-10 * a, 0, 0],
          chest: [-4 * a, 0, 0],
        };
      case "slump":
        return {
          chest: [12 * a, 0, 0],
          spine: [6 * a, 0, 0],
          head: [10 * a, 0, 0],
          leftShoulder: [10 * a, 0, 0],
          rightShoulder: [10 * a, 0, 0],
        };
      case "wave":
      case "raiseHand":
      case "cheer":
      case "stopPalm":
      case "point":
      case "palmsUp":
      case "beckon":
      case "clap":
      case "rubHands":
      case "touchFace":
      case "pushGlasses":
      case "scratchHead":
      case "bow":
        return {};
    }
  }

  /**
   * A periodic stroke signal that starts and ends at rest: `sin(2 pi n u)`
   * under a window easing in over the first and out over the last 15 % of
   * the stroke, so the hand leaves and rejoins its held goal smoothly.
   *
   * @param u Stroke share.
   * @param cycles Cycles.
   * @returns The signal in [-1, 1]; 0 at and outside the stroke's ends.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the signal, the window and its 15 % ramps, the range and the value outside the stroke.
   * @evidence contracts/development/implementation.md#principled-implementation A sine of the stroke's cycles under the smaller of two minimum-jerk ramps, so the signal and its slope start and end at zero and the hand joins its held goal without a jump.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure signal shared by the wave, rub, scratch and head-shake strokes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 15 % ramp is a provisional shaping value named in the doc.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function with nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function oscillation(u: number, cycles: number): number {
    if (!(u > 0 && u < 1)) return 0;
    return (
      Math.sin(2 * Math.PI * cycles * u) *
      Math.min(minimumJerk(u / 0.15).s, minimumJerk((1 - u) / 0.15).s)
    );
  }

  /** A single rise and fall over the stroke, `sin^2(pi u)`. */
  function bump(u: number): number {
    return u > 0 && u < 1 ? Math.sin(Math.PI * u) ** 2 : 0;
  }

  /** The pointing goal: the fingertip on the eye-to-target line at the arm's reach. */
  function point(input: IInput, side: HumanHand.Side): IHand {
    const { body } = input;
    if (input.target === undefined) throw new Error("Pointing needs a target");
    const bones = HumanTrunk.resolve(body, input.base);
    const eye: IAutoMovieVector3 = bones.get(`${side}Eye`)!.worldPosition;
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const line: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(input.target, eye),
    );
    const tip: number = Vector3.length(
      HumanHand.offset(body, side, "indexTip", "point").point,
    );
    const reach: number =
      0.95 * (body.measure.upperArm + body.measure.forearm) + tip;

    // The point on the line at the reach from the shoulder: |eye + s d - shoulder| = reach.
    const w: IAutoMovieVector3 = Vector3.subtract(eye, shoulder);
    const b: number = Vector3.dot(w, line);
    const c: number = Vector3.dot(w, w) - reach * reach;
    const s: number = -b + Math.sqrt(Math.max(0, b * b - c));
    const distance: number = Math.min(
      s,
      Vector3.length(Vector3.subtract(input.target, eye)),
    );
    const palm: IAutoMovieVector3 =
      Math.abs(line.y) > 0.9
        ? HumanFrame.point(
            { origin: { x: 0, y: 0, z: 0 }, yaw: input.base.yaw },
            { x: 0, y: 0, z: -Math.sign(line.y) },
          )
        : { x: 0, y: -1, z: 0 };
    return {
      surface: "indexTip",
      shape: "point",
      point: Vector3.add(eye, Vector3.scale(line, distance)),
      rotation: HumanHand.rotation(side, { fingers: line, palm }),
      out: 0,
    };
  }

  /** A self-touch goal: the fingertip on a face region, palm toward the face, fingers up. */
  function touch(
    kind: "touchFace" | "pushGlasses" | "scratchHead",
    input: IInput,
    side: HumanHand.Side,
    u: number,
    cycles: number,
  ): IHand {
    const { body } = input;
    const region: AutoMovieHumanoidRegion =
      kind === "pushGlasses"
        ? "noseBridge"
        : kind === "scratchHead"
          ? side === "left"
            ? "templeLeft"
            : "templeRight"
          : input.region;
    const surface = HumanTrunk.region(body, input.base, region);
    const up: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        { x: 0, y: 1, z: 0 },
        Vector3.scale(surface.normal, surface.normal.y),
      ),
    );
    const slide: number =
      kind === "pushGlasses"
        ? 0.012 * bumpUp(u)
        : kind === "scratchHead"
          ? 0.015 * oscillation(u, cycles)
          : 0;
    const pad: number = padding(body, side);
    return {
      surface: "indexTip",
      shape: "flat",
      point: Vector3.add(
        Vector3.add(surface.point, Vector3.scale(surface.normal, pad)),
        Vector3.scale(up, slide),
      ),
      rotation: HumanHand.rotation(side, {
        fingers: up,
        palm: Vector3.scale(surface.normal, -1),
      }),
      out: 0.15,
    };
  }

  /** A rise held to the end, for a push: minimum-jerk over the first 60 % of the stroke. */
  function bumpUp(u: number): number {
    return minimumJerk(u / 0.6).s;
  }

  /**
   * How far the finger's axis stands off the skin it touches: the distal
   * index phalanx's collider radius (the hand's thinnest half-extent on a
   * profile without finger colliders), so a fingertip laid on a surface
   * touches it rather than sinking its axis into it.
   */
  function padding(body: IHumanBody, side: HumanHand.Side): number {
    const segment =
      body.profile.segments.find((s) => s.bone === `${side}IndexDistal`) ??
      body.profile.segments.find((s) => s.bone === `${side}Hand`);
    let thin: number = 0;
    for (const shape of segment?.shapes ?? []) {
      const half: number =
        shape.kind === "box"
          ? Math.min(
              shape.halfExtents.x,
              shape.halfExtents.y,
              shape.halfExtents.z,
            )
          : shape.kind === "sphere" || shape.kind === "capsule"
            ? shape.radius
            : 0;
      thin = thin === 0 ? half : Math.min(thin, half);
    }
    return thin;
  }
}
