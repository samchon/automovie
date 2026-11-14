import {
  AutoMovieHumanoidSurfaceRays,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  convexHull2D,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

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
   * @returns The left foot's bearing points, then the right foot's, world metres.
   */
  export function base(
    body: IHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieVector3[] {
    return (["left", "right"] as const).flatMap(
      (side: "left" | "right"): IAutoMovieVector3[] => {
        const points: IAutoMovieVector3[] = [
          ...sockets(body, bones, side).map(
            (s: ISocket): IAutoMovieVector3 => s.point,
          ),
          ...outline(body, side).map(
            (
              frame: resolveAutoMovieHumanoidSurfaces.IFrame,
            ): IAutoMovieVector3 =>
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
      },
    );
  }

  /**
   * A foot's outline on its sole: the corners of the outline of the foot's
   * colliders, and the toes' when the profile jointed them, seen from below
   * at rest and laid on the sole's plane, each riding its bone. A foot
   * flat on the floor stands on this outline; one turned about its heel or
   * its ball lifts the part of it away from the pivot.
   *
   * At rest each collider gives its points: a hull its vertices, a box its
   * corners, a sphere or a capsule the points of its horizontal circles
   * every 22.5 degrees, all on the shape, so the outline never reaches past
   * it. Each bone's points are dropped to the height of the sole sockets and
   * reduced to the corners of their convex hull in the horizontal plane.
   *
   * @param body The body.
   * @param side The foot.
   * @returns The outline's corners as frames on the foot's bones.
   */
  export function outline(
    body: IHumanBody,
    side: "left" | "right",
  ): readonly resolveAutoMovieHumanoidSurfaces.IFrame[] {
    let found:
      | Record<"left" | "right", resolveAutoMovieHumanoidSurfaces.IFrame[]>
      | undefined = OUTLINES.get(body);
    if (found === undefined) {
      const tools = AutoMovieHumanoidSurfaceRays.tools(
        body.skeleton,
        body.profile,
      );
      const read = (
        s: "left" | "right",
      ): resolveAutoMovieHumanoidSurfaces.IFrame[] => {
        const Side: "Left" | "Right" = s === "left" ? "Left" : "Right";
        const heel: resolveAutoMovieHumanoidSurfaces.IFrame =
          body.surfaces.sockets[`heel${Side}`];
        const floor: number = resolveAutoMovieHumanoidSurfaces.place(
          heel,
          tools.at(heel.bone),
        ).point.y;
        const out: resolveAutoMovieHumanoidSurfaces.IFrame[] = [];
        for (const bone of [`${s}Foot`, `${s}Toes`] as const) {
          const segment = body.profile.segments.find(
            (x): boolean => x.bone === bone,
          );
          if (segment === undefined) continue;
          const points: IAutoMovieVector3[] = segment.shapes.flatMap(
            (shape): IAutoMovieVector3[] =>
              shapePoints(segment.neutral, shape).map(
                (p: IAutoMovieVector3): IAutoMovieVector3 => ({
                  ...p,
                  y: floor,
                }),
              ),
          );
          for (const corner of convexHull2D(points))
            out.push(
              tools.local(
                bone,
                corner,
                { x: 0, y: -1, z: 0 },
                { x: 0, y: 0, z: 1 },
              ),
            );
        }
        return out;
      };
      found = { left: read("left"), right: read("right") };
      OUTLINES.set(body, found);
    }
    return found[side];
  }

  /**
   * The foot's rotation from rest for a heading and a pitch.
   *
   * @param heading Degrees about +Y.
   * @param pitch Degrees, positive toes up.
   * @returns The rotation.
   */
  export function rotation(
    heading: number,
    pitch: number,
  ): IAutoMovieQuaternion {
    return Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, heading),
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -pitch),
      ),
    );
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

/** Each body's sole outlines, made once. */
const OUTLINES: WeakMap<
  IHumanBody,
  Record<"left" | "right", resolveAutoMovieHumanoidSurfaces.IFrame[]>
> = new WeakMap();

/** The horizontal directions a round collider's outline is read along, every 22.5 degrees. */
const ROUND: readonly IAutoMovieVector3[] = Array.from(
  { length: 16 },
  (_: unknown, k: number): IAutoMovieVector3 => ({
    x: Math.cos((k * Math.PI) / 8),
    y: 0,
    z: Math.sin((k * Math.PI) / 8),
  }),
);

/**
 * Points on a collider placed by its segment's neutral pose, world metres: a
 * hull's vertices, a box's corners, and the horizontal circles of a sphere or
 * a capsule's two end spheres.
 */
function shapePoints(
  pose: IAutoMoviePhysicalProfile.ITransform,
  shape: IAutoMoviePhysicalProfile.IShape,
): IAutoMovieVector3[] {
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    pose.rotation,
    shape.transform.rotation,
  );
  const centre: IAutoMovieVector3 = Vector3.add(
    pose.position,
    Quaternion.rotateVector(pose.rotation, shape.transform.position),
  );
  const at = (local: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(centre, Quaternion.rotateVector(rotation, local));
  const round = (
    middle: IAutoMovieVector3,
    radius: number,
  ): IAutoMovieVector3[] =>
    ROUND.map(
      (d: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(middle, Vector3.scale(d, radius)),
    );
  if (shape.kind === "hull") return shape.points.map(at);
  if (shape.kind === "box") {
    const h: IAutoMovieVector3 = shape.halfExtents;
    const out: IAutoMovieVector3[] = [];
    for (const x of [-h.x, h.x])
      for (const y of [-h.y, h.y])
        for (const z of [-h.z, h.z]) out.push(at({ x, y, z }));
    return out;
  }
  if (shape.kind === "sphere") return round(centre, shape.radius);
  if (shape.kind === "capsule")
    return [
      ...round(at({ x: 0, y: shape.halfLength, z: 0 }), shape.radius),
      ...round(at({ x: 0, y: -shape.halfLength, z: 0 }), shape.radius),
    ];
  shape satisfies never;
  throw new Error("Unknown physical shape kind");
}
