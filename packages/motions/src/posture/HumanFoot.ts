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
  export const SOCKETS = ["heel", "ball", "toe"] as const;

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
      const frame =
        body.surfaces.sockets[`${socket}${side === "left" ? "Left" : "Right"}`];
      return {
        socket,
        point: resolveAutoMovieHumanoidSurfaces.place(
          frame,
          bones.get(frame.bone)!,
        ).point,
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
    return sides.flatMap((side: "left" | "right"): IAutoMovieVector3[] => {
      const points: IAutoMovieVector3[] = [
        ...sockets(body, bones, side).map(
          (s: ISocket): IAutoMovieVector3 => s.point,
        ),
        ...outline(body, side).map(
          (frame: resolveAutoMovieHumanoidSurfaces.IFrame): IAutoMovieVector3 =>
            resolveAutoMovieHumanoidSurfaces.place(
              frame,
              bones.get(frame.bone)!,
            ).point,
        ),
      ];
      let low: number = Infinity;
      for (const p of points) low = Math.min(low, p.y);
      return points.filter(
        (p: IAutoMovieVector3): boolean => p.y <= low + BEARING,
      );
    });
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
    const ankle: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
    return [
      ...SOCKETS.map(
        (socket: Socket): IAutoMovieVector3 => point(body, side, socket, foot),
      ),
      ...outline(body, side).map(
        (frame: resolveAutoMovieHumanoidSurfaces.IFrame): IAutoMovieVector3 =>
          Vector3.add(
            foot.ankle,
            Quaternion.rotateVector(
              foot.rotation,
              frame.bone === `${side}Foot`
                ? frame.point
                : Vector3.add(
                    Vector3.subtract(body.rest.get(frame.bone)!, ankle),
                    frame.point,
                  ),
            ),
          ),
      ),
    ];
  }

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
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, degrees),
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
  export function rotation(
    heading: number,
    pitch: number,
    roll: number = 0,
  ): IAutoMovieQuaternion {
    return Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.multiply(
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, heading),
          Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, roll),
        ),
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -pitch),
      ),
    );
  }

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
    const yaw: number = (heading(rotation) * Math.PI) / 180;
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
  export function offset(
    body: IHumanBody,
    side: "left" | "right",
    point: "heel" | "ball" | "toe" | "sole" | "mtp",
    toes: number = 0,
  ): IAutoMovieVector3 {
    const foot: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
    if (point === "mtp")
      return Vector3.subtract(body.rest.get(`${side}Toes`)!, foot);
    const socket =
      body.surfaces.sockets[`${point}${side === "left" ? "Left" : "Right"}`];
    if (socket.bone === `${side}Foot`) return socket.point;
    const joint: IAutoMovieVector3 = Vector3.subtract(
      body.rest.get(socket.bone)!,
      foot,
    );
    return Vector3.add(
      joint,
      Quaternion.rotateVector(
        Quaternion.fromAxisAngle({ x: -1, y: 0, z: 0 }, toes),
        socket.point,
      ),
    );
  }

  /**
   * The foot placed by pivoting about a sole point fixed on the floor.
   *
   * @param body The body.
   * @param side The foot.
   * @param pivot Which sole point stays on the floor.
   * @param at Where that point is, world metres.
   * @param heading The foot's heading, degrees.
   * @param pitch The pitch, degrees, positive toes up.
   * @returns The foot's placement.
   */
  export function pivot(
    body: IHumanBody,
    side: "left" | "right",
    pivot: "heel" | "ball" | "toe" | "sole" | "mtp",
    at: IAutoMovieVector3,
    heading: number,
    pitch: number,
  ): IPlacement {
    const r: IAutoMovieQuaternion = rotation(heading, pitch);
    const local: IAutoMovieVector3 = offset(body, side, pivot);
    return {
      ankle: Vector3.subtract(at, Quaternion.rotateVector(r, local)),
      rotation: r,
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
    return Vector3.add(
      foot.ankle,
      Quaternion.rotateVector(foot.rotation, offset(body, side, point, toes)),
    );
  }
}
