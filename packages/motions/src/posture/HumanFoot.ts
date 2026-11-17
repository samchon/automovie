import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFootOutline } from "./HumanFootOutline";
import { HumanFootRotation } from "./HumanFootRotation";
import { humanFootBones } from "./humanFootBones";
import { humanFootOffset } from "./humanFootOffset";
import { prepareHumanFootAt } from "./prepareHumanFootAt";
import { prepareHumanFootHeight } from "./prepareHumanFootHeight";
import { prepareHumanFootSole } from "./prepareHumanFootSole";
import { readHumanFoot } from "./readHumanFoot";

/**
 * A foot on the floor as a rigid rocker: where its ankle and its sole points
 * are when it pivots about its heel or its ball by a pitch, at a heading.
 *
 * Gait analysis describes stance as three rockers (Perry and Burnfield, Gait
 * Analysis, 2nd ed.): the heel rocker, where the foot rolls down about the
 * heel after initial contact; the ankle rocker, foot flat while the tibia
 * advances; and the forefoot rocker, where the heel rises and the foot turns
 * about the metatarsal heads until toe-off. Each is a rotation of the rigid
 * foot about a floor point, so the contact point stays fixed while the ankle
 * moves, which is what keeps a planted foot from sliding.
 *
 * The foot's geometry is read from the body's own sockets: the heel and ball
 * points relative to the ankle joint at rest, and `mtp`, the toes' joint, the
 * metatarsophalangeal axis the forefoot rocker turns about with the toes
 * flat (Perry and Burnfield), above the ball's floor point. A socket riding the toes bone
 * (the toe tip, when the profile jointed the toes) bends at the ball by the
 * toes' flexion: through the forefoot rocker the toes extend at the
 * metatarsophalangeal joints and stay flat on the floor while the heel rises
 * (Perry and Burnfield), so a walk extends them by the rocker's angle.
 * `pitch` is in degrees about the foot's lateral axis, positive lifting the
 * toes; `toes` is the toes' flexion from the foot in degrees, positive
 * lifting them; `heading` is the foot's yaw about +Y in degrees (0 faces +Z).
 */
export namespace HumanFoot {
  /** Bound base/socket geometry for one unchanged synchronous displayed-bone reading (`readHumanFoot`); release it with that evaluation. */
  export const reading: typeof readHumanFoot = readHumanFoot;

  /** A fixed-articulation reader over a varying world contact (`prepareHumanFootAt`), preserving fresh placement outputs. */
  export const prepareAt: typeof prepareHumanFootAt = prepareHumanFootAt;

  /** A foot's world placement. */
  export interface IPlacement {
    /** The ankle joint, world metres. */
    ankle: IAutoMovieVector3;

    /** The foot's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }

  /** A sole socket that bears on the floor. */
  export type Socket = (typeof SOCKETS)[number];

  /** The sole sockets of {@link Socket}, as data. */
  export const SOCKETS: readonly ["heel", "ball", "toe"] = ["heel", "ball", "toe"];

  /** A sole socket's place on a displayed foot. */
  export interface ISocket {
    /** Which socket. */
    socket: Socket;

    /** Where it is, world metres. */
    point: IAutoMovieVector3;
  }

  /**
   * A foot's three sole sockets on displayed bones, heel first, each placed
   * on the bone it rides: the toe socket of a profile with jointed toes moves
   * with the toes bone, not with the foot.
   *
   * @param body The body.
   * @param bones The displayed bones.
   * @param side The foot.
   * @returns The heel, the ball and the toe.
   */
  export function sockets(
    body: IHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: "left" | "right",
  ): ISocket[] {
    return (["heel", "ball", "toe"] as const).map((socket: Socket): ISocket => {
      const frame: resolveAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.sockets[`${socket}${side === "left" ? "Left" : "Right"}`];
      return {
        socket,
        point: resolveAutoMovieHumanoidSurfaces.point(
          frame,
          bones.get(frame.bone)!,
        ),
      };
    });
  }

  /**
   * The height above a foot's lowest sole point within which a part of the
   * sole is on the floor, metres: under half the 12.9 mm mean minimum toe
   * clearance of the swinging foot in normal walking (Winter 1992, Foot
   * trajectory in human gait, Physical Therapy 72(1):45-53), so a foot at
   * the lowest point of a normal swing is not read as on the floor.
   */
  export const BEARING: number = 0.006;

  /**
   * The base of support of displayed bones: the area within the outlines of
   * the feet where they bear on the floor (Winter, Biomechanics and Motor
   * Control of Human Movement, 4th ed., ch. 4: the base of support is the
   * area bounded by the outline of the feet in contact with the ground), the
   * points whose convex hull a margin of stability is measured to (Hof,
   * Gazendam and Sinke 2005).
   *
   * Each foot's outline is its sole sockets and the corners of the outline
   * of its colliders seen from below (`outline`), placed on the displayed
   * bones; of these, the points within `BEARING` of the foot's lowest one
   * bear, so a heel lifted off the floor leaves the base to the forefoot.
   *
   * @param body The body.
   * @param bones The displayed bones.
   * @param sides The feet that bear; both when absent.
   * @returns The left foot's bearing points, then the right foot's, world metres.
   */
  export function base(
    body: IHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    sides: readonly ("left" | "right")[] = ["left", "right"],
  ): IAutoMovieVector3[] {
    return readHumanFoot(body, bones).base(sides);
  }

  /**
   * The points a placed foot stands on, flat with its toes flat: its sole
   * sockets and the corners of its outline (`outline`), world metres.
   *
   * @param body The body.
   * @param side The foot.
   * @param foot The foot's placement.
   * @returns The heel, the ball and the toe, then the outline's corners.
   */
  export function sole(
    body: IHumanBody,
    side: "left" | "right",
    foot: IPlacement,
  ): IAutoMovieVector3[] {
    return prepareHumanFootSole(body, side)(foot);
  }

  /** Flat-toed sole geometry over changing foot placements (`prepareHumanFootSole`), shared only for unchanged body-local geometry. */
  export const prepareSole: typeof prepareHumanFootSole = prepareHumanFootSole;

  /**
   * A foot's outline on its sole, the corners of its colliders seen from
   * below as frames on its bones (`HumanFootOutline`).
   */
  export const outline: typeof HumanFootOutline.of = HumanFootOutline.of;

  /**
   * A placement turned on the floor about its ankle's vertical.
   *
   * @param foot The placement.
   * @param degrees The turn about +Y, degrees.
   * @returns The turned placement; the same one for no turn.
   */
  export function turned(foot: IPlacement, degrees: number): IPlacement {
    if (degrees === 0) return foot;
    return {
      ankle: foot.ankle,
      rotation: Quaternion.normalize(
        Quaternion.multiply(
          YAW(degrees),
          foot.rotation,
        ),
      ),
    };
  }

  /**
   * The foot's rotation from rest for a heading, a pitch and a roll.
   *
   * @param heading Degrees about +Y.
   * @param pitch Degrees, positive toes up.
   * @param roll Degrees about the foot's forward axis, positive lifting its outer border on the left foot's side (+X at rest); none when absent.
   * @returns The rotation.
   */
  export const rotation: (heading: number, pitch: number, roll?: number) => IAutoMovieQuaternion = HumanFootRotation;

  /** Prepare the exact height component of one fixed articulated socket for actual clearance-only queries. */
  export const prepareHeight: typeof prepareHumanFootHeight = prepareHumanFootHeight;

  /** Actual socket/outline frame bone membership for one unchanged displayed-foot observation. */
  export const bones: typeof humanFootBones = humanFootBones;

  /**
   * The roll of a foot's rotation about its forward axis, degrees, as
   * `rotation` takes it: the rise of its lateral axis.
   *
   * @param rotation The foot's rotation.
   * @returns Degrees.
   */
  export function roll(rotation: IAutoMovieQuaternion): number {
    const lateral: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    return (Math.asin(Math.max(-1, Math.min(1, lateral.y))) * 180) / Math.PI;
  }

  /**
   * A foot's heading from its rotation, read off its lateral axis: a pitch
   * leaves that axis level, so the heading holds when a folded shank carries
   * the foot's pitch past vertical, where its forward axis points backward.
   *
   * @param rotation The foot's world rotation, a heading and a pitch.
   * @returns Degrees about +Y.
   */
  export function heading(rotation: IAutoMovieQuaternion): number {
    const lateral: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    return (Math.atan2(-lateral.z, lateral.x) * 180) / Math.PI;
  }

  /**
   * A foot's pitch from its rotation, about the lateral axis `heading` reads,
   * so it runs past ±90° where the foot points past vertical.
   *
   * @param rotation The foot's world rotation, a heading and a pitch.
   * @returns Degrees, positive toes up.
   */
  export function pitch(rotation: IAutoMovieQuaternion): number {
    const toes: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    return pitchAt(toes, heading(rotation));
  }

  /**
   * Read heading and toes-up pitch from the same foot rotation, sharing
   * the lateral-axis heading needed by both values.
   *
   * @param rotation The foot's world rotation.
   * @returns A fresh degree-valued pair, preserving pitch beyond vertical.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world rotation input, degree outputs, shared heading and the past-vertical pitch convention.
   * @evidence contracts/development/implementation.md#principled-implementation Uses heading's original lateral-axis direction and pitch's original forward-axis projection; the one heading feeds the same pitchAt formula as raw pitch.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One heading read and one forward-axis read supply the pair, with the pitch formula owned once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No normalization, clamp, range or angle convention changes, and neither angle is cached across rotations.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work; a consumer of both angles omits the repeated lateral-axis rotation and heading atan2 that separate heading/pitch calls require.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both scalar values derive from this same supplied quaternion within this call; no identity, pose or time key is involved.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh scalar pair and retains no input or state.
   */
  export function headingPitch(rotation: IAutoMovieQuaternion): { heading: number; pitch: number } {
    const angle: number = heading(rotation);
    const toes: IAutoMovieVector3 = Quaternion.rotateVector(rotation, { x: 0, y: 0, z: 1 });
    return { heading: angle, pitch: pitchAt(toes, angle) };
  }

  /** Pitch projected along the same lateral-axis heading, in clinical degrees. */
  function pitchAt(toes: IAutoMovieVector3, angle: number): number {
    const yaw: number = (angle * Math.PI) / 180;
    return (
      (Math.atan2(toes.y, toes.x * Math.sin(yaw) + toes.z * Math.cos(yaw)) *
        180) /
      Math.PI
    );
  }

  /**
   * A sole point's offset from the ankle in the foot's rest frame, the toes
   * flexed by an angle.
   *
   * @param body The body.
   * @param side The foot.
   * @param point Which sole point.
   * @param toes The toes' flexion, degrees, positive lifting them.
   * @returns The offset, metres.
   */
  export const offset: typeof humanFootOffset = humanFootOffset;

  /** Fixed body/socket geometry over varying actual toe angles, owned by humanFootOffset.prepare. */
  export const prepareOffset: typeof humanFootOffset.prepare = humanFootOffset.prepare;

  /**
   * The foot placed by pivoting about a sole point fixed on the floor.
   *
   * @param body The body.
   * @param side The foot.
   * @param pivot Which sole point stays on the floor.
   * @param at Where that point is, world metres.
   * @param heading The foot's heading, degrees.
   * @param pitch The pitch, degrees, positive toes up.
   * @param toes The toe joint flexion, degrees; zero when absent.
   * @param roll The foot roll, degrees; zero when absent.
   * @returns The foot's placement.
   * @evidence contracts/development/common.md#meaningful-documentation States the pivot and every angular convention.
   * @evidence contracts/development/implementation.md#principled-implementation The ankle is the fixed world pivot minus its rotated bone-local offset, including a socket carried by the toe joint.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation and one rigid-point translation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses offset as the sole owner of toe articulation.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses rotation and offset.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pivot(
    body: IHumanBody,
    side: "left" | "right",
    pivot: "heel" | "ball" | "toe" | "sole" | "mtp",
    at: IAutoMovieVector3,
    heading: number,
    pitch: number,
    toes: number = 0,
    roll: number = 0,
  ): IPlacement {
    const r: IAutoMovieQuaternion = rotation(heading, pitch, roll);
    const local: IAutoMovieVector3 = offset(body, side, pivot, toes);
    return {
      ankle: Vector3.subtract(at, Quaternion.rotateVector(r, local)),
      rotation: r,
    };
  }

  /**
   * Prepare rigid sole geometry for repeated pitch trials under one fixed
   * heading, toe flexion, roll and default contact. An explicit contact changes
   * only the translation under that same prepared geometry.
   *
   * @param body The body owning the sole socket.
   * @param side The foot.
   * @param pivot Which socket stays fixed.
   * @param at The socket's fixed world position, metres.
   * @param heading The fixed foot heading, degrees about +Y.
   * @param toes The fixed toe flexion, degrees; zero when absent.
   * @param roll The fixed foot roll, degrees; zero when absent.
   * @returns A reader of pitch in degrees, positive toes up, with pivot's placement; an explicit world contact replaces only the default at under the same fixed rotation/socket preparation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed inputs, frames, units, defaults and the reader's equivalence to pivot.
   * @evidence contracts/development/implementation.md#principled-implementation Uses exactly rotation's yaw-times-roll prefix, normalization and varying pitch multiplication, then the actual default or explicitly supplied contact minus its rotated socket offset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed rotation prefix and socket offset precede one pitch reader of the same rigid transform as pivot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Calls offset for toe articulation and preserves quaternion multiplication order; no pitch or angle bound changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and evaluation; socket lookup and fixed yaw and roll quaternion construction run once per rocker.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller fixes body, side, socket, heading, toes and roll. Default at remains fixed; an explicitly supplied current contact changes translation alone and is actually subtracted each time, without sharing a placed result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One reader retains its default contact, socket offset and rotation prefix until its solve/action releases it; explicit current contacts and queried results are not retained.
   */
  export function preparePivot(
    body: IHumanBody,
    side: "left" | "right",
    pivot: "heel" | "ball" | "toe" | "sole" | "mtp",
    at: IAutoMovieVector3,
    heading: number,
    toes: number = 0,
    roll: number = 0,
  ): (pitch: number, contact?: IAutoMovieVector3) => IPlacement {
    const turned: ReturnType<typeof HumanFootRotation.prepare> =
      HumanFootRotation.prepare(heading, roll);
    const local: IAutoMovieVector3 = offset(body, side, pivot, toes);
    return (pitch: number, contact: IAutoMovieVector3 = at): IPlacement => {
      const r: IAutoMovieQuaternion = turned(pitch);
      return {
        ankle: Vector3.subtract(contact, Quaternion.rotateVector(r, local)),
        rotation: r,
      };
    };
  }

  /**
   * Where the ankle goes, and how far the toes extend, when a planted foot
   * reaches a rotation other than the one asked for: the foot turns about
   * its contact, which stays where the goal put it, and the toes take back
   * the pitch the foot lost, so they stay on the floor. When the shank leans
   * past the ankle's dorsal range, this is the heel-off of the terminal
   * stance rocker (Perry and Burnfield): the heel rises about the ball and
   * the toes dorsiflex at the metatarsophalangeal joints.
   *
   * @param asked The rotation the goal asked for.
   * @param reached The rotation the limb reached.
   * @param anchor The contact's world point under the asked rotation.
   * @param contact The contact in the foot's rest frame, relative to the ankle.
   * @returns The ankle point and the toes' added flexion, degrees, positive lifting them.
   */
  export function heelOff(
    asked: IAutoMovieQuaternion,
    reached: IAutoMovieQuaternion,
    anchor: IAutoMovieVector3,
    contact: IAutoMovieVector3,
  ): { ankle: IAutoMovieVector3; toes: number } {
    return {
      ankle: Vector3.subtract(
        anchor,
        Quaternion.rotateVector(reached, contact),
      ),
      toes: Math.max(0, pitch(asked) - pitch(reached)),
    };
  }

  /**
   * A sole point's world position for a placed foot.
   *
   * @param body The body.
   * @param side The foot.
   * @param point Which sole point.
   * @param foot The foot's placement.
   * @param toes The toes' flexion, degrees, positive lifting them.
   * @returns The point, world metres.
   */
  export function point(
    body: IHumanBody,
    side: "left" | "right",
    point: "heel" | "ball" | "toe" | "sole" | "mtp",
    foot: IPlacement,
    toes: number = 0,
  ): IAutoMovieVector3 {
    return pointAt(offset(body, side, point, toes), foot);
  }

  /**
   * Prepare a sole point whose body, socket and toe flexion remain fixed.
   *
   * @param body The socket's body.
   * @param side The foot.
   * @param point The socket to place.
   * @param toes Fixed toe flexion, degrees; zero when absent.
   * @returns A reader of foot placement yielding the same world point as `point`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed socket inputs, angular default, world-point result and placement reader.
   * @evidence contracts/development/implementation.md#principled-implementation Resolves the articulated ankle-local socket once and uses point's same quaternion rotation and ankle translation for every placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One offset preparation and the shared pointAt rigid transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Toe articulation remains offset's formula; no placement is sampled, rounded or retained.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and evaluation; repeated placements skip socket/rest lookups and the fixed toe rotation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Body, side, socket and toe flexion fix one local offset for the reader's lifetime; the varying placement is always evaluated.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One reader retains one offset until its owning rocker or action releases it, without query history.
   */
  export function preparePoint(
    body: IHumanBody,
    side: "left" | "right",
    point: "heel" | "ball" | "toe" | "sole" | "mtp",
    toes: number = 0,
  ): (foot: IPlacement) => IAutoMovieVector3 {
    const local: IAutoMovieVector3 = offset(body, side, point, toes);
    return (foot: IPlacement): IAutoMovieVector3 => pointAt(local, foot);
  }

  /** The common ankle translation and rigid rotation of a prepared local socket. */
  function pointAt(local: IAutoMovieVector3, foot: IPlacement): IAutoMovieVector3 {
    return Vector3.add(
      foot.ankle,
      Quaternion.rotateVector(foot.rotation, local),
    );
  }
}

/** The unchanged world-up axis shared only as axis-angle scalar preparation. */
const YAW: ReturnType<typeof Quaternion.prepareAxisAngle> = Quaternion.prepareAxisAngle({ x: 0, y: 1, z: 0 });

