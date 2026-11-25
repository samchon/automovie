import {
  Quaternion,
  Vector3,
  physicalShapeSurfaceAnchor,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieHumanoidSocket,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHandShape,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "./HumanColliders";
import { poseBones } from "./poseBones";

/** The alternatives of `TipSide`'s site. */
type TipSide = "Left" | "Right";

/** The alternatives of `AimToward`'s site. */
type AimToward = "up" | "down";

/** The alternatives of `DigitAtSegment2`'s site. */
type DigitAtSegment2 = "Proximal" | "Distal";

/** The alternatives of `DigitAtSegment`'s site. */
type DigitAtSegment = "Proximal" | "Distal";

/** The alternatives of `DigitName`'s site. */
type DigitName = "Thumb" | "Index";

/**
 * The finger joints of a hand shape, clinical degrees.
 *
 * @param side The hand.
 * @param form The shape.
 * @returns Angles for every finger and thumb segment of that hand.
 */
export function HumanHandShape(
  side: AutoMovieHumanSide,
  form: IAutoMovieMotionHumanHand.Shape,
): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
  const out: Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  > = {};
  const set: (bone: string, flexion: number) => void = (
    bone: string,
    flexion: number,
  ): void => {
    out[`${side}${bone}` as AutoMovieHumanoidBone] = [flexion, 0, 0];
  };
  for (const digit of ["Index", "Middle", "Ring", "Little"]) {
    const curled: boolean =
      form === "fist" || (form === "point" && digit !== "Index");
    for (const segment of ["Proximal", "Intermediate", "Distal"]) {
      if (curled)
        set(
          `${digit}${segment}`,
          segment === "Proximal" ? 85 : segment === "Intermediate" ? 95 : 90,
        );
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
  // A flat hand lays the thumb in the palm's plane beside the forefinger:
  // the rig's rest thumb stands palmar of the knuckles' plane (its neutral
  // stops where its skin clears the hand's), and carrying it back by
  // `FLAT_THUMB` degrees of retroposition brings its tip to within 3 mm of
  // that plane on the small woman and the average man, so a palm laid flat
  // on a floor or a face does not sink its thumb. A bridge keeps the thumb
  // at that neutral, palmar of the knuckles and spread from the
  // forefinger, so it reaches the line beside the forefinger's tip.
  set("ThumbMetacarpal", form === "flat" ? FLAT_THUMB : 0);
  set("ThumbProximal", folded ? 40 : form === "relaxed" ? 25 : 0);
  set("ThumbDistal", folded ? 50 : form === "relaxed" ? 25 : 0);
  return out;
}

/**
 * The finger joints of a named hand shape: the angles `HumanHand.Shape` stands
 * for on every finger and thumb segment of one hand.
 *
 * The angles themselves are stated with their sources in `HumanHand`'s own
 * document; this module holds their tables and the direction a digit takes
 * under them.
 */
export namespace HumanHandShape {
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
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanHandShape.Emblem>[];

  /**
   * The finger joints of an emblem shape, clinical degrees (every angle
   * provisional: set from the shape's description, no measured source read).
   *
   * @param side The hand.
   * @param form The shape.
   * @returns Angles for every finger and thumb segment of that hand.
   */
  export function emblem(
    side: AutoMovieHumanSide,
    form: IAutoMovieMotionHumanHandShape.Emblem,
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
                    : segment === "Intermediate"
                      ? 95
                      : 90;
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
   * A digit's own direction under a set of finger angles: from its first joint
   * (the knuckle of a finger, the thumb's middle joint) to its last, in the
   * hand's rest frame. A shape's straight digit does not lie along the hand's
   * own axes: the forefinger leans off the knuckle line toward the thumb, and a
   * straight thumb stands about 35 degrees off it, so a request that means a
   * digit to point somewhere aims this direction, not an axis of the hand.
   *
   * @param body The body, whose rig places the digit's joints.
   * @param side The hand.
   * @param joints The finger angles, clinical degrees by bone; a bone left out
   *   stands at rest.
   * @param name The digit: the thumb or the forefinger.
   * @returns The unit direction.
   */
  export function digit(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    joints: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    >,
    name: DigitName,
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
    const at: (segment: DigitAtSegment) => IAutoMovieVector3 = (
      segment: DigitAtSegment2,
    ): IAutoMovieVector3 =>
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
   * A hand's world rotation turned by the least rotation that points one of its
   * digits straight at the world's up or down: the digit's own direction
   * (`digit`) carried by the rotation is turned onto the vertical about their
   * common normal, so the hand keeps as much of its attitude as the aim
   * allows.
   *
   * @param rotation The hand's world rotation from rest.
   * @param digit The digit's own direction in the hand's rest frame (`digit`).
   * @param toward Up or down.
   * @returns The turned rotation.
   */
  export function aim(
    rotation: IAutoMovieQuaternion,
    digit: IAutoMovieVector3,
    toward: AimToward,
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
   * A digit's tip or pad frame from the wrist under a hand shape with its
   * fingers curled by a further flexion, in the hand's rest frame, by forward
   * kinematics of that hand alone: the frame a touch lays on its region when
   * its kind curls the fingers (`AutoMovieMotionHumanTouchForm`), as the hand
   * is displayed. A scratch's 30 degrees draw the index tip 76 mm back from
   * where it lies flat and turn its pad 90 degrees.
   *
   * @param body The body.
   * @param side The hand.
   * @param form The hand shape.
   * @param curl Extra flexion of the fingers over the shape, degrees; the thumb
   *   keeps its own.
   * @param surface The digit surface; the index fingertip when omitted.
   * @returns The frame, its point measured from the wrist joint.
   */
  export function tip(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    form: IAutoMovieMotionHumanHand.Shape,
    curl: number,
    surface: IAutoMovieMotionHumanHand.DigitSurface = "indexTip",
  ): IAutoMovieMotionHumanHand.IFrame {
    const joints: IAutoMovieJointPose[] = Object.entries(
      HumanHandShape(side, form),
    ).map(
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
    const Side: TipSide = side === "left" ? "Left" : "Right";
    const region: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions[`${surface}${Side}` as AutoMovieHumanoidRegion];
    const placed: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> =
      resolveAutoMovieHumanoidSurfaces.place(region, bones.get(region.bone)!);
    // A pad is where its digit bears on a surface it lies on: the point of
    // the digit's own collider farthest along the pad's outward normal, the
    // point a support facing the pad meets, read from the posed digit as the
    // colliders place it (`HumanColliders`), so the pad a goal lays on a
    // surface and the collider the floor and contact audits read are one
    // geometry. The surface table's point lies on the modelled skin, which a
    // digit's collider does not follow.
    const point: IAutoMovieVector3 = surface.endsWith("Pad")
      ? padOf(body, bones, region.bone, placed)
      : placed.point;
    const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      hand.worldRotation,
    );
    return {
      point: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(point, hand.worldPosition),
      ),
      normal: Quaternion.rotateVector(inverse, placed.normal),
      forward:
        body.surfaces.sockets[`palm${Side}` as AutoMovieHumanoidSocket].normal,
    };
  }
}

/**
 * A digit pad's point: the support of the digit's collider along the pad's
 * outward normal (`physicalShapeSurfaceAnchor`), the shape that reaches
 * farthest along it where the bone carries more than one; the surface table's
 * point where the bone carries no collider.
 *
 * @param body The body.
 * @param bones The posed hand's bones.
 * @param bone The digit bone the pad rides.
 * @param placed The pad's surface frame on the posed bone, world metres.
 * @returns The pad's point, world metres.
 */
function padOf(
  body: IAutoMovieMotionHumanBody,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  bone: AutoMovieHumanoidBone,
  placed: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place>,
): IAutoMovieVector3 {
  let best: IAutoMovieVector3 = placed.point;
  let reach: number = -Infinity;
  for (const collider of HumanColliders.placed(
    body,
    new Map([[bone, bones.get(bone)!]]),
  )) {
    if (collider.bone !== bone) continue;
    const outward: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(collider.pose.rotation),
      placed.normal,
    );
    for (const shape of collider.shapes) {
      const anchor: IAutoMovieVector3 = physicalShapeSurfaceAnchor(
        collider.pose,
        shape,
        outward,
      ).point;
      const along: number = Vector3.dot(anchor, placed.normal);
      if (along > reach) {
        reach = along;
        best = anchor;
      }
    }
  }
  return best;
}

/**
 * The flat hand's thumb carpometacarpal flexion, degrees: the retroposition
 * that lays the rest thumb in the palm's plane (measured on the rig: the thumb
 * tip 22-26 mm palmar of the knuckles' plane at 0, 3 mm at this angle), inside
 * the joint's admitted -25 (`DEFAULT_HUMANOID_ROM`).
 */
const FLAT_THUMB: number = -25;
