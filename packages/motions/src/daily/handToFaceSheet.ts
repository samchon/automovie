import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanFrame } from "../posture/HumanFrame";

/**
 * Where a hand-to-face task holds a sheet to be read: the one task whose
 * place is not a region of the face but a point before the eyes, split from
 * `handToFace` so each file holds one responsibility.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the place is and why it stands apart.
 * @evidence contracts/development/design.md#principled-representation The standing text distance, the measured walking gaze and distance, the head flexion and the eyes' range determine a held text's place.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reading measurements, the place and the head flexion; read by `handToFace` and `handToFaceRegion`, and the distance cited by the lexicon's watch look.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sheet or body is named: the place is the body's own arm meeting its own reading distance.
 */
export namespace handToFaceSheet {
  /** The reading distance from the eyes to a held text, metres (Bababekova et al. 2011, mean for text). */
  export const READING: number = 0.362;

  // Moving readers held the phone 33.3 cm from their eyes at customary speed.
  const WALK_DISTANCE: number = 0.333;

  // Mean downward gaze relative to the calibrated head during customary
  // walking (Table 1, doi:10.1007/s00221-021-06267-6). The study found
  // no significant change in vertical gaze angle between conditions.
  const GAZE: number = (10.3 * Math.PI) / 180;
  const WALK_SIGHT: IAutoMovieVector3 = { x: 0, y: -Math.sin(GAZE), z: Math.cos(GAZE) };

  /**
   * The head's flexion while reading a handheld text, degrees: 35, inside
   * the 33 to 45 degrees of neck and head flexion Lee et al. 2015 measured.
   */
  export const HEAD: number = 35;

  /**
   * The eye's largest depression in its head, degrees: the mean downgaze
   * range of 261 healthy subjects measured photographically, 47.1 (Lee et
   * al. 2019, Eye 33:1145, "Differences in eye movement range based on age
   * and gaze direction").
   */
  export const EYE_DOWN: number = 47.1;

  /**
   * Where a held sheet is read: where the holding hand, its upper arm
   * hanging from the shoulder and its forearm swung up about the elbow,
   * meets the reading distance from the eyes, in front of its own shoulder,
   * facing back at the eyes. During a walk the preferred point instead follows the calibrated head-relative gaze at the walking viewing distance (Table 1, doi:10.1007/s00221-021-06267-6), provided it lies forward and within the arm's reach. The line from the eyes to that place is the
   * whole line of sight; how it splits between the head and the eyes is
   * `head`'s.
   *
   * @param context The body.
   * @param posture The posture so far, whose trunk carries the eyes and the shoulder.
   * @param side The hand.
   * @returns The place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two constraints the place meets, the side it lies on and its facing.
   * @evidence contracts/development/implementation.md#principled-implementation For the walking carrier the bilateral eye centre, current head rotation and measured gaze give the preferred target. For a head directed outside the forward arm reach, or without the walking carrier, in the vertical plane through the hand's elbow along the heading, the place is the forward intersection of the circle of the reading distance about the eyes (cut by that plane) with the circle the hand sweeps about the hanging elbow (the forearm and half the hand); when the two do not meet, the hand's circle's point nearest the eyes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One trunk resolve, one change of frame and one circle intersection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every length is the body's own or the measured reading distance; no direction is typed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanTrunk.resolve` and `HumanFrame`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One forward-kinematics pass and constant work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "carrier">,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
  ): Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal"> {
    const m: IAutoMovieMotionHumanActionContext["body"]["measure"] = context.body.measure;
    const bones: ReturnType<typeof HumanTrunk.resolve> = HumanTrunk.resolve(context.body, posture);
    const eyes: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(
        bones.get("leftEye")!.worldPosition,
        bones.get("rightEye")!.worldPosition,
      ),
      0.5,
    );
    if (context.carrier?.name === "walk") {
      const sight: IAutoMovieVector3 = Quaternion.rotateVector(bones.get("head")!.worldRotation, WALK_SIGHT);
      const viewed: IAutoMovieVector3 = Vector3.add(eyes, Vector3.scale(sight, WALK_DISTANCE));
      const upper: IAutoMovieVector3 = bones.get(`${side}UpperArm`)!.worldPosition;
      const heading: IAutoMovieVector3 = HumanFrame.local({ origin: upper, yaw: posture.yaw }, viewed);
      if (heading.z > 0 && Vector3.distance(upper, viewed) <= m.upperArm + m.forearm + m.hand / 2)
        return { point: viewed, normal: Vector3.scale(sight, -1) };
    }
    const frame: IAutoMovieMotionHumanFrame = { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw };
    const shoulder: IAutoMovieVector3 = HumanFrame.local(
      frame,
      bones.get(`${side}UpperArm`)!.worldPosition,
    );
    const e: IAutoMovieVector3 = HumanFrame.local(frame, eyes);

    // The hanging elbow, and the circle the hand sweeps about it in the
    // vertical plane along the heading through it.
    const elbow: IAutoMovieVector3 = { ...shoulder, y: shoulder.y - m.upperArm };
    const r: number = m.forearm + m.hand / 2;

    // The reading distance's sphere about the eyes, cut by that plane.
    const across: number = e.x - elbow.x;
    const R: number = Math.sqrt(Math.max(0, READING * READING - across * across));
    const dy: number = e.y - elbow.y;
    const dz: number = e.z - elbow.z;
    const d: number = Math.hypot(dy, dz);
    let y: number;
    let z: number;
    if (d > 0 && d <= R + r && d >= Math.abs(R - r)) {
      // Two circles' intersection: along the centres' line a, across it h,
      // the forward one of the two.
      const a: number = (r * r - R * R + d * d) / (2 * d);
      const h: number = Math.sqrt(Math.max(0, r * r - a * a));
      const uy: number = dy / d;
      const uz: number = dz / d;
      const ny: number = -uz;
      const nz: number = uy;
      const sign: number = nz >= 0 ? 1 : -1;
      y = elbow.y + a * uy + sign * h * ny;
      z = elbow.z + a * uz + sign * h * nz;
    } else {
      // Out of the arm's reach of the distance: the hand as near the eyes
      // as its circle comes.
      const scale: number = d > 0 ? r / d : 0;
      y = elbow.y + dy * scale;
      z = elbow.z + (d > 0 ? dz * scale : r);
    }
    const point: IAutoMovieVector3 = HumanFrame.point(frame, { x: elbow.x, y, z });
    return {
      point,
      normal: Vector3.normalize(Vector3.subtract(eyes, point)),
    };
  }

  /**
   * The head's flexion for reading a held sheet, degrees: the measured
   * reading flexion (`HEAD`), and more only where the line of sight to the
   * sheet (`of`) falls further below the head than the eye can turn
   * (`EYE_DOWN`), the rest of it then carried by the head.
   *
   * @param context The body.
   * @param posture The entry posture, whose eyes and shoulder place the sheet.
   * @param side The reading hand.
   * @returns Degrees of flexion, positive down.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the measured flexion, the eye's range and when the head takes more.
   * @evidence contracts/development/implementation.md#principled-implementation The line of sight's depression below the horizontal is the head's flexion plus the eye's depression in the head; the eye takes what the head's measured flexion leaves, up to its measured range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One place, one angle and one maximum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both terms are measured; the sheet's place is the body's own.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the place from `of`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One place read and constant work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function head(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "carrier">,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
  ): number {
    const bones: ReturnType<typeof HumanTrunk.resolve> = HumanTrunk.resolve(context.body, posture);
    const eyes: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(
        bones.get("leftEye")!.worldPosition,
        bones.get("rightEye")!.worldPosition,
      ),
      0.5,
    );
    const line: IAutoMovieVector3 = Vector3.subtract(of(context, posture, side).point, eyes);
    const down: number =
      (Math.atan2(-line.y, Math.hypot(line.x, line.z)) * 180) / Math.PI;
    return Math.max(HEAD, down - EYE_DOWN);
  }
}
