import {
  Quaternion,
  Vector3,
  physicalShapeBounds,
  wrapDegrees,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Placing a whole-body posture so its displayed hips fall on a wanted world
 * point: the hips' offset from the root is read once by resolving the posture
 * at the origin, and the root is the wanted point less that offset. Falls use
 * it to carry a lying or tumbling body along a computed hips path.
 */
export namespace stuntFallPose {
  /**
   * The displayed hips' offset from the root.
   *
   * @param body The canonical motion body.
   * @param posture The posture, its root anywhere.
   * @returns Hips minus root, world metres.
   */
  export function offset(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 {
    const placed: IAutoMovieMotionHumanPosture = {
      ...posture,
      root: { x: 0, y: 0, z: 0 },
    };
    return poseBones(body, resolveHumanPosture.seeded(body, placed).pose).get(
      "hips",
    )!.worldPosition;
  }

  /**
   * How far a posture's lowest bone lies above its root, so the posture can
   * rest that bone on a surface.
   *
   * @param body The canonical motion body.
   * @param posture The posture, its root anywhere.
   * @returns The lowest point of the body's colliders above the root, metres
   *   (negative below it): the body's surface, as the floor audit reads it.
   */
  export function lowest(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): number {
    const placed: IAutoMovieMotionHumanPosture = {
      ...posture,
      root: { x: 0, y: 0, z: 0 },
    };
    return surfaceLow(
      body,
      poseBones(body, resolveHumanPosture.seeded(body, placed).pose),
    );
  }

  /**
   * Rest a posture on a surface point: its hips over the point and its lowest
   * bone on the surface.
   *
   * @param posture The posture.
   * @param surface The surface point under the hips, world metres.
   * @param offset The posture's hips offset from its root (`offset`).
   * @param low The posture's lowest bone above its root (`lowest`).
   * @returns The posture moved.
   */
  export function onto(
    posture: IAutoMovieMotionHumanPosture,
    surface: IAutoMovieVector3,
    offset: IAutoMovieVector3,
    low: number,
  ): IAutoMovieMotionHumanPosture {
    return {
      ...posture,
      root: {
        x: surface.x - offset.x,
        y: surface.y - low,
        z: surface.z - offset.z,
      },
    };
  }

  /**
   * Rest a posture, a blend of keys among them, on a surface point: its hips
   * over the point and its own lowest collider surface on it, read from one
   * resolve of the posture itself, so a blend of two resting keys does not dip
   * into the surface between them.
   *
   * On a sloped surface, named by its normal, the body rests on the plane
   * through the point: its collider surface reaching furthest against the
   * normal touches the plane, so a body lying along a flight of stairs rests
   * its back on the nosings and not its heels a leg further down.
   *
   * @param body The canonical motion body.
   * @param posture The posture, its root anywhere.
   * @param surface The surface point under the hips, world metres.
   * @param normal The surface's upward unit normal; level, `+Y`, when absent.
   * @returns The posture moved.
   */
  export function rest(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    surface: IAutoMovieVector3,
    normal?: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture {
    const placed: IAutoMovieMotionHumanPosture = {
      ...posture,
      root: { x: 0, y: 0, z: 0 },
    };
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture.seeded(body, placed).pose,
    );
    const hips: IAutoMovieVector3 = bones.get("hips")!.worldPosition;
    if (normal === undefined)
      return onto(posture, surface, hips, surfaceLow(body, bones));
    // The root's height that puts the body's furthest support against the
    // normal on the plane, its hips over the surface point.
    const x: number = surface.x - hips.x;
    const z: number = surface.z - hips.z;
    const y: number =
      (Vector3.dot(surface, normal) -
        supportAlong(body, bones, normal) -
        x * normal.x -
        z * normal.z) /
      normal.y;
    return { ...posture, root: { x, y, z } };
  }

  /**
   * The feet of a placed posture, where it stands: each ankle and foot
   * rotation, world.
   *
   * @param body The canonical motion body.
   * @param posture The posture, placed.
   * @returns Both feet.
   */
  export function feet(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): IFeet {
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture.seeded(body, posture).pose,
    );
    const foot: (side: Side) => IFoot = (side: Side): IFoot => {
      const bone: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
      return {
        ankle: { ...bone.worldPosition },
        rotation: { ...bone.worldRotation },
      };
    };
    return { left: foot("left"), right: foot("right") };
  }

  /**
   * Stand a posture on planted feet: its root moved so its own feet, on
   * average, come over the planted ones and its lowest collider surface rests
   * on the ground, and each leg held to its planted ankle and foot rotation, so
   * a body rising or sinking on its feet does not slide them.
   *
   * @param body The canonical motion body.
   * @param posture The posture, its root anywhere, its legs free.
   * @param planted Where the feet stand.
   * @param ground The ground's height, world metres.
   * @returns The posture moved, its legs planted.
   */
  export function plant(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    planted: IFeet,
    ground: number,
  ): IAutoMovieMotionHumanPosture {
    const placed: IAutoMovieMotionHumanPosture = {
      ...posture,
      root: { x: 0, y: 0, z: 0 },
    };
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture.seeded(body, placed).pose,
    );
    const own: IAutoMovieVector3 = Vector3.lerp(
      bones.get("leftFoot")!.worldPosition,
      bones.get("rightFoot")!.worldPosition,
      0.5,
    );
    const wanted: IAutoMovieVector3 = Vector3.lerp(
      planted.left.ankle,
      planted.right.ankle,
      0.5,
    );
    const root: IAutoMovieVector3 = {
      x: wanted.x - own.x,
      y: ground - surfaceLow(body, bones),
      z: wanted.z - own.z,
    };
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const side of ["left", "right"] as const) {
      const foot: IFoot = planted[side];
      const knee: IAutoMovieVector3 = Vector3.add(
        bones.get(`${side}LowerLeg`)!.worldPosition,
        root,
      );
      // Forward along the foot, as far as the shin is long.
      const ahead: IAutoMovieVector3 = Quaternion.rotateVector(foot.rotation, {
        x: 0,
        y: 0,
        z: Vector3.distance(knee, foot.ankle),
      });
      limbs[`${side}Leg`] = {
        point: foot.ankle,
        rotation: foot.rotation,
        bend: Vector3.add(knee, { x: ahead.x, y: 0, z: ahead.z }),
        planted: true,
      };
    }
    return { ...posture, root, limbs };
  }

  /**
   * Place a posture with its hips at a point.
   *
   * @param posture The posture.
   * @param hips The wanted hips, world metres.
   * @param offset The posture's hips offset from its root.
   * @returns The posture moved.
   */
  export function at(
    posture: IAutoMovieMotionHumanPosture,
    hips: IAutoMovieVector3,
    offset: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture {
    return { ...posture, root: Vector3.subtract(hips, offset) };
  }

  /**
   * Blend one posture toward another: joints, root, yaw by the shortest arc,
   * pitch and roll; the limbs are the target's, an explicit rotation is left to
   * the blended attitude and the fingers switch halfway.
   *
   * @param from The posture at weight 0.
   * @param to The posture at weight 1.
   * @param w The weight.
   * @returns The blend.
   */
  export function blend(
    from: IAutoMovieMotionHumanPosture,
    to: IAutoMovieMotionHumanPosture,
    w: number,
  ): IAutoMovieMotionHumanPosture {
    // Every joint either end names, a joint the other leaves out at rest.
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const bone of new Set([
      ...Object.keys(from.joints),
      ...Object.keys(to.joints),
    ]) as Set<keyof IAutoMovieMotionHumanPosture["joints"]>) {
      const a: readonly [number, number, number] = from.joints[bone] ?? [
        0, 0, 0,
      ];
      const b: readonly [number, number, number] = to.joints[bone] ?? [0, 0, 0];
      joints[bone] = [
        a[0] + (b[0] - a[0]) * w,
        a[1] + (b[1] - a[1]) * w,
        a[2] + (b[2] - a[2]) * w,
      ];
    }
    // An explicit rotation is the attitude the blended yaw, pitch and roll
    // carry, so it is left out rather than taken whole from either end.
    const shape: IAutoMovieMotionHumanPosture = { ...to };
    delete shape.rotation;
    delete shape.digits;
    const fingers: IAutoMovieMotionHumanPosture["digits"] =
      w < 0.5 ? from.digits : to.digits;
    return {
      ...shape,
      ...(fingers === undefined ? {} : { digits: fingers }),
      root: Vector3.lerp(from.root, to.root, w),
      yaw: from.yaw + wrapDegrees(to.yaw - from.yaw) * w,
      pitch: from.pitch + (to.pitch - from.pitch) * w,
      roll: from.roll + (to.roll - from.roll) * w,
      joints,
    };
  }

  /** A side of the body. */
  export type Side = AutoMovieHumanSide;

  /** Where a foot stands. */
  export interface IFoot {
    /** The ankle, world metres. */
    ankle: IAutoMovieVector3;

    /** The foot's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }

  /** Where both feet stand. */
  export interface IFeet {
    /** The left foot. */
    left: IFoot;

    /** The right foot. */
    right: IFoot;
  }
}

/**
 * The least projection of a resolved body's collider surfaces on a unit normal,
 * metres: how far the body reaches against it.
 */
function supportAlong(
  body: IAutoMovieMotionHumanBody,
  bones: ReturnType<typeof poseBones>,
  normal: IAutoMovieVector3,
): number {
  let least: number = Infinity;
  for (const { pose, shapes } of HumanColliders.placed(body, bones))
    for (const shape of shapes) {
      const centre: IAutoMovieVector3 = Vector3.add(
        pose.position,
        Quaternion.rotateVector(pose.rotation, shape.transform.position),
      );
      const turn: IAutoMovieQuaternion = Quaternion.multiply(
        pose.rotation,
        shape.transform.rotation,
      );
      const along: number = Vector3.dot(centre, normal);
      // The shape's local axes projected on the normal.
      const axis: (local: IAutoMovieVector3) => number = (
        local: IAutoMovieVector3,
      ): number => Vector3.dot(Quaternion.rotateVector(turn, local), normal);
      const reach: number =
        shape.kind === "sphere"
          ? along - shape.radius
          : shape.kind === "capsule"
            ? along -
              Math.abs(axis({ x: 0, y: 1, z: 0 })) * shape.halfLength -
              shape.radius
            : shape.kind === "box"
              ? along -
                Math.abs(axis({ x: 1, y: 0, z: 0 })) * shape.halfExtents.x -
                Math.abs(axis({ x: 0, y: 1, z: 0 })) * shape.halfExtents.y -
                Math.abs(axis({ x: 0, y: 0, z: 1 })) * shape.halfExtents.z
              : Math.min(
                  ...shape.points.map(
                    (point: IAutoMovieVector3): number => along + axis(point),
                  ),
                );
      least = Math.min(least, reach);
    }
  return least;
}

/**
 * The lowest point of a resolved body's colliders, world metres: the floor
 * audit's reading of its surface.
 */
function surfaceLow(
  body: IAutoMovieMotionHumanBody,
  bones: ReturnType<typeof poseBones>,
): number {
  let least: number = Infinity;
  for (const { pose, shapes } of HumanColliders.placed(body, bones))
    for (const shape of shapes)
      least = Math.min(least, physicalShapeBounds(pose, shape).min.y);
  return least;
}
