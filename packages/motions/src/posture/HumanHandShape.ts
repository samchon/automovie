import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieHumanoidSocket,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "./HumanHand";
import { poseBones } from "./poseBones";

/**
 * The finger joints of a named hand shape: the angles `HumanHand.Shape`
 * stands for on every finger and thumb segment of one hand.
 *
 * The angles themselves are stated with their sources in `HumanHand`'s own
 * document; this module holds their tables and the direction a digit takes
 * under them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the module gives and where the angles are sourced.
 * @evidence contracts/development/design.md#principled-representation One function from a closed shape name to clinical flexion per finger segment.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The tables, and the direction a digit takes under them (`digit`); and the least turn that aims a digit (`aim`); `HumanHand` owns the shape names and calls the table as its `shape`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No hand is special: the side only prefixes the bone names.
 */
export namespace HumanHandShape {
  /**
   * The finger joints of a hand shape, clinical degrees.
   *
   * @param side The hand.
   * @param form The shape.
   * @returns Angles for every finger and thumb segment of that hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and what the result covers.
   * @evidence contracts/development/implementation.md#principled-implementation A fist and the curled fingers of a point flex each segment near its range; a flat hand is straight; a relaxed finger takes the position of rest, since the body's rest pose carries no curl of its own. The values are `HumanHand`'s documented ones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Four fingers by three segments, then the thumb.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every segment is written for every shape, so no joint keeps an angle of the shape before.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fifteen assignments with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    side: HumanHand.Side,
    form: HumanHand.Shape,
  ): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    const out: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {};
    const set = (bone: string, flexion: number): void => {
      out[`${side}${bone}` as AutoMovieHumanoidBone] = [flexion, 0, 0];
    };
    for (const digit of ["Index", "Middle", "Ring", "Little"]) {
      const curled: boolean =
        form === "fist" || (form === "point" && digit !== "Index");
      for (const segment of ["Proximal", "Intermediate", "Distal"]) {
        if (curled) set(`${digit}${segment}`, segment === "Proximal" ? 85 : 95);
        else if (form !== "relaxed") set(`${digit}${segment}`, 0);
        // The position of rest on a finger whose zero is straight: the
        // body's rest pose no longer carries a curl of its own.
        else
          set(
            `${digit}${segment}`,
            segment === "Proximal" ? 35 : segment === "Intermediate" ? 30 : 20,
          );
      }
    }
    const folded: boolean = form === "fist" || form === "point";
    set("ThumbMetacarpal", 0);
    set("ThumbProximal", folded ? 40 : form === "relaxed" ? 25 : 0);
    set("ThumbDistal", folded ? 50 : form === "relaxed" ? 25 : 0);
    return out;
  }

  /**
   * A hand shape that carries a meaning of its own: the shapes of the
   * emblems the gesture lexicon adds (#3345), beside the four working shapes
   * of `HumanHand.Shape`.
   *
   * - `thumbUp`: the fist with the thumb straight.
   * - `ok`: the forefinger and the thumb bent into a ring, the others open.
   * - `victory`: the forefinger and the middle finger straight and spread,
   *   the others folded.
   * - `crossed`: the forefinger and the middle finger straight and laid
   *   toward each other, the others folded.
   * - `count1` to `count5`: that many digits straight from the forefinger
   *   on, the thumb last (one convention of several; cultures differ).
   * - `snap`: the middle finger's tip on the thumb's, as before a snap.
   * - `quotes`: the forefinger and the middle finger hooked, the others
   *   folded.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each shape by what the fingers do and states the counting convention.
   * @evidence contracts/development/design.md#principled-representation A closed union of emblem shapes, each a set of finger joint angles in `emblem`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The shapes the emblem rows read; the working shapes stay `HumanHand.Shape`'s.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A separate union, so no caller of the working shapes changes.
   */
  export type Emblem = (typeof EMBLEMS)[number];

  /** The emblem shapes of {@link Emblem}, as data. */
  export const EMBLEMS = [
    "thumbUp",
    "ok",
    "victory",
    "crossed",
    "count1",
    "count2",
    "count3",
    "count4",
    "count5",
    "snap",
    "quotes",
  ] as const;

  /**
   * The finger joints of an emblem shape, clinical degrees (every angle
   * provisional: set from the shape's description, no measured source read).
   *
   * @param side The hand.
   * @param form The shape.
   * @returns Angles for every finger and thumb segment of that hand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, what is returned and that the angles are provisional.
   * @evidence contracts/development/implementation.md#principled-implementation Each digit is straight, folded as in the fist, or bent to the angles its shape names; a spread or a crossing is the proximal joint's abduction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One table of digit states per shape and one loop that writes them.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fold is the fist's own (85 and 95 degrees), so an emblem's folded fingers match the working shape.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function emblem(
    side: HumanHand.Side,
    form: Emblem,
  ): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    const out: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {};
    const digits: readonly string[] = ["Index", "Middle", "Ring", "Little"];

    // How many fingers stand straight, from the forefinger on.
    const straight: number =
      form === "thumbUp" || form === "snap"
        ? 0
        : form === "ok"
          ? 4
          : form === "victory" || form === "crossed" || form === "quotes"
            ? 2
            : form === "count5"
              ? 4
              : Number(form.slice(5));
    digits.forEach((digit: string, index: number): void => {
      const open: boolean = index < straight;
      for (const segment of ["Proximal", "Intermediate", "Distal"]) {
        const bone: AutoMovieHumanoidBone =
          `${side}${digit}${segment}` as AutoMovieHumanoidBone;

        // A spread or a crossing turns the two straight fingers' knuckles.
        const lean: number =
          segment !== "Proximal" || index > 1
            ? 0
            : (form === "victory" ? 10 : form === "crossed" ? -8 : 0) *
              (index === 0 ? -1 : 1);
        const hooked: number =
          form === "quotes" && open
            ? segment === "Proximal"
              ? 10
              : segment === "Intermediate"
                ? 70
                : 40
            : form === "ok" && index === 0
              ? segment === "Proximal"
                ? 60
                : segment === "Intermediate"
                  ? 70
                  : 30
              : form === "snap" && index === 1
                ? segment === "Distal"
                  ? 20
                  : 60
                : open
                  ? 0
                  : segment === "Proximal"
                    ? 85
                    : 95;
        out[bone] = [hooked, lean, 0];
      }
    });

    // The thumb: straight for a thumbs up and a five, bent to the ring or the
    // middle finger's tip, folded over the fingers otherwise.
    const thumb: readonly [number, number] =
      form === "thumbUp" || form === "count5"
        ? [0, 0]
        : form === "ok" || form === "snap"
          ? [30, 25]
          : [40, 50];
    out[`${side}ThumbMetacarpal` as AutoMovieHumanoidBone] = [0, 0, 0];
    out[`${side}ThumbProximal` as AutoMovieHumanoidBone] = [thumb[0], 0, 0];
    out[`${side}ThumbDistal` as AutoMovieHumanoidBone] = [thumb[1], 0, 0];
    return out;
  }

  /**
   * A digit's own direction under a set of finger angles: from its first
   * joint (the knuckle of a finger, the thumb's middle joint) to its last,
   * in the hand's rest frame. A shape's straight digit does not lie along
   * the hand's own axes: the forefinger leans off the knuckle line toward
   * the thumb, and a straight thumb stands about 35 degrees off it, so a
   * request that means a digit to point somewhere aims this direction, not
   * an axis of the hand.
   *
   * @param body The body, whose rig places the digit's joints.
   * @param side The hand.
   * @param joints The finger angles, clinical degrees by bone; a bone left out stands at rest.
   * @param name The digit: the thumb or the forefinger.
   * @returns The unit direction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is measured, from which joint to which, the frame and why it differs from the hand's axes.
   * @evidence contracts/development/implementation.md#principled-implementation The rig's own forward kinematics of the hand at rest with the angles applied, read back into the hand's frame, so the direction is the one the displayed digit takes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose, one resolve, one difference and one rotation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The joints are the ones the verdicts read a digit by, never a guessed axis.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward-kinematics pass.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `poseBones`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function digit(
    body: IHumanBody,
    side: HumanHand.Side,
    joints: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    >,
    name: "Thumb" | "Index",
  ): IAutoMovieVector3 {
    const pose: IAutoMoviePose = {
      skeleton: body.skeleton.id,
      root: null,
      joints: (
        Object.entries(joints) as [
          AutoMovieHumanoidBone,
          readonly [number, number, number],
        ][]
      ).map(
        ([bone, a]: [
          AutoMovieHumanoidBone,
          readonly [number, number, number],
        ]): IAutoMovieJointPose => ({
          bone,
          flexion: a[0],
          abduction: a[1],
          twist: a[2],
        }),
      ),
    };
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
    );
    const at = (segment: "Proximal" | "Distal"): IAutoMovieVector3 =>
      bones.get(`${side}${name}${segment}` as AutoMovieHumanoidBone)!
        .worldPosition;
    return Vector3.normalize(
      Quaternion.rotateVector(
        Quaternion.inverse(bones.get(`${side}Hand`)!.worldRotation),
        Vector3.subtract(at("Distal"), at("Proximal")),
      ),
    );
  }

  /**
   * A hand's world rotation turned by the least rotation that points one of
   * its digits straight at the world's up or down: the digit's own
   * direction (`digit`) carried by the rotation is turned onto the vertical
   * about their common normal, so the hand keeps as much of its attitude as
   * the aim allows.
   *
   * @param rotation The hand's world rotation from rest.
   * @param digit The digit's own direction in the hand's rest frame (`digit`).
   * @param toward Up or down.
   * @returns The turned rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is turned, onto what, and what is kept.
   * @evidence contracts/development/implementation.md#principled-implementation The shortest arc between the digit's world direction and the vertical, applied before the hand's rotation; opposite directions take half a turn about a direction across the digit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One carried direction, one arc and one product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A digit already on the vertical keeps the rotation unchanged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function aim(
    rotation: IAutoMovieQuaternion,
    digit: IAutoMovieVector3,
    toward: "up" | "down",
  ): IAutoMovieQuaternion {
    const from: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(rotation, digit),
    );
    const to: IAutoMovieVector3 = { x: 0, y: toward === "up" ? 1 : -1, z: 0 };
    const axis: IAutoMovieVector3 = Vector3.cross(from, to);
    const cos: number = Math.max(-1, Math.min(1, Vector3.dot(from, to)));
    const arc: IAutoMovieQuaternion =
      Vector3.length(axis) > 1e-9
        ? Quaternion.fromAxisAngle(
            axis,
            (Math.atan2(Vector3.length(axis), cos) * 180) / Math.PI,
          )
        : cos > 0
          ? Quaternion.identity()
          : Quaternion.fromAxisAngle(
              Vector3.cross(
                from,
                Math.abs(from.x) < 0.9
                  ? { x: 1, y: 0, z: 0 }
                  : { x: 0, y: 0, z: 1 },
              ),
              180,
            );
    return Quaternion.normalize(Quaternion.multiply(arc, rotation));
  }

  /**
   * The index fingertip's frame from the wrist under a hand shape with its
   * fingers curled by a further flexion, in the hand's rest frame, by
   * forward kinematics of that hand alone: the frame a touch lays on its
   * region when its kind curls the fingers (`AutoMovieMotionHumanTouchForm`),
   * as the hand is displayed. A scratch's 30 degrees draw the tip 76 mm back
   * from where it lies flat and turn its pad 90 degrees.
   *
   * @param body The body.
   * @param side The hand.
   * @param form The hand shape.
   * @param curl Extra flexion of the fingers over the shape, degrees; the thumb keeps its own.
   * @returns The frame, its point measured from the wrist joint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the curl's reading and the measured defect.
   * @evidence contracts/development/implementation.md#principled-implementation The shape's angles plus the curl on the fingers, as `AutoMovieMotionHumanHand` displays them, posed by forward kinematics, the tip read on the distal phalanx's region.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose, one region placement and one change of frame.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The curl is not added to the thumb, whose flexion closes across the palm.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Remembered per body, side, shape and curl.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics per body, side, shape and curl.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The memo is weak in the body.
   */
  export function tip(
    body: IHumanBody,
    side: HumanHand.Side,
    form: HumanHand.Shape,
    curl: number,
  ): HumanHand.IFrame {
    const key: string = `${side}:${form}:${curl}`;
    let memo: Map<string, HumanHand.IFrame> | undefined = TIPS.get(body);
    if (memo === undefined) {
      memo = new Map();
      TIPS.set(body, memo);
    }
    const known: HumanHand.IFrame | undefined = memo.get(key);
    if (known !== undefined) return known;
    const joints: IAutoMovieJointPose[] = Object.entries(of(side, form)).map(
      ([bone, a]): IAutoMovieJointPose => ({
        bone: bone as AutoMovieHumanoidBone,
        flexion: a![0] + (bone.includes("Thumb") ? 0 : curl),
        abduction: a![1],
        twist: a![2],
      }),
    );
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      { skeleton: body.skeleton.id, root: null, joints },
    );
    const Side: "Left" | "Right" = side === "left" ? "Left" : "Right";
    const region =
      body.surfaces.regions[`indexTip${Side}` as AutoMovieHumanoidRegion];
    const placed = resolveAutoMovieHumanoidSurfaces.place(
      region,
      bones.get(region.bone)!,
    );
    const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      hand.worldRotation,
    );
    const out: HumanHand.IFrame = {
      point: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(placed.point, hand.worldPosition),
      ),
      normal: Quaternion.rotateVector(inverse, placed.normal),
      forward:
        body.surfaces.sockets[`palm${Side}` as AutoMovieHumanoidSocket].normal,
    };
    memo.set(key, out);
    return out;
  }
}

/** Index fingertip frames by body, keyed by side, shape and curl. */
const TIPS: WeakMap<IHumanBody, Map<string, HumanHand.IFrame>> = new WeakMap();
