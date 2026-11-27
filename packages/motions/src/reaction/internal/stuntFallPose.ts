import { Quaternion, Vector3, AutoMovieEnginePhysics, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/HumanColliders";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanShapeBlend } from "../../posture/internal/prepareHumanShapeBlend";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

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
    return prepareRest(body)(posture, surface, normal);
  }

  /**
   * Bind the body and collider-bone request for changing floor poses. Read each
   * sample's own articulation and its exact minimum on the given plane.
   */
  export function prepareRest(
    body: IAutoMovieMotionHumanBody,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    surface: IAutoMovieVector3,
    normal?: IAutoMovieVector3,
  ) => IAutoMovieMotionHumanPosture {
    const colliders: ReadonlySet<AutoMovieHumanoidBone> =
      HumanColliders.bones(body);
    const requested: ReadonlySet<AutoMovieHumanoidBone> = colliders.has("hips")
      ? colliders
      : new Set([...colliders, "hips"]);
    const frames: ReturnType<typeof prepareAtOrigin> = prepareAtOrigin(
      body,
      requested,
    );
    const places: ReturnType<typeof HumanColliders.preparePlaced> =
      HumanColliders.preparePlaced(body, colliders);
    const lowestY: ReturnType<typeof HumanColliders.prepareMinima> =
      HumanColliders.prepareMinima(body);
    return (posture, surface, normal): IAutoMovieMotionHumanPosture => {
      const bones: ReturnType<typeof poseBones> = frames(posture);
      const hips: IAutoMovieVector3 = bones.get("hips")!.worldPosition;
      if (normal === undefined)
        return onto(posture, surface, hips, lowestY(bones)[0]!);
      const x: number = surface.x - hips.x;
      const z: number = surface.z - hips.z;
      const y: number =
        (Vector3.dot(surface, normal) -
          supportAlong(places(bones), normal) -
          x * normal.x -
          z * normal.z) /
        normal.y;
      return { ...posture, root: { x, y, z } };
    };
  }

  /**
   * A fixed joint-only shape's support projection along varying unit normals in
   * the coordinate frame of the supplied posture. Rigid translation and
   * rotation are handled by the caller when selecting the normal and plane.
   */
  export function prepareSupport(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): (normal: IAutoMovieVector3) => number {
    const shapes: IShapeFrame[] = HumanColliders.placed(
      body,
      poseBones(body, resolveHumanPosture.seeded(body, posture).pose),
    ).flatMap(({ pose, shapes }) =>
      shapes.map(
        (shape: IAutoMoviePhysicalShape): IShapeFrame =>
          shapeFrame(pose, shape),
      ),
    );
    return (normal: IAutoMovieVector3): number => {
      let least: number = Infinity;
      for (const shape of shapes)
        least = Math.min(least, projectShape(shape, normal));
      return least;
    };
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
    return preparePlant(body, planted, ground)(posture);
  }

  /** Bind a landing's planted feet and the bone demand for the moving knees. */
  export function preparePlant(
    body: IAutoMovieMotionHumanBody,
    planted: IFeet,
    ground: number,
  ): (posture: IAutoMovieMotionHumanPosture) => IAutoMovieMotionHumanPosture {
    const frames: ReturnType<typeof prepareAtOrigin> = prepareAtOrigin(
      body,
      new Set([
        ...HumanColliders.bones(body),
        "leftFoot",
        "rightFoot",
        "leftLowerLeg",
        "rightLowerLeg",
      ]),
    );
    const lowestY: ReturnType<typeof HumanColliders.prepareMinima> =
      HumanColliders.prepareMinima(body);
    const wanted: IAutoMovieVector3 = Vector3.lerp(
      planted.left.ankle,
      planted.right.ankle,
      0.5,
    );
    return (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture => {
      const bones: ReturnType<typeof poseBones> = frames(posture);
      const own: IAutoMovieVector3 = Vector3.lerp(
        bones.get("leftFoot")!.worldPosition,
        bones.get("rightFoot")!.worldPosition,
        0.5,
      );
      const root: IAutoMovieVector3 = {
        x: wanted.x - own.x,
        y: ground - lowestY(bones)[0]!,
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
        const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
          foot.rotation,
          {
            x: 0,
            y: 0,
            z: Vector3.distance(knee, foot.ankle),
          },
        );
        limbs[`${side}Leg`] = {
          point: foot.ankle,
          rotation: foot.rotation,
          bend: Vector3.add(knee, { x: ahead.x, y: 0, z: ahead.z }),
          planted: true,
        };
      }
      return { ...posture, root, limbs };
    };
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
   * @param joints The same interpolation from a prepared joint blend, if the
   *   caller's input joint maps are fixed.
   * @returns The blend.
   */
  export function blend(
    from: IAutoMovieMotionHumanPosture,
    to: IAutoMovieMotionHumanPosture,
    w: number,
    joints: IAutoMovieMotionHumanPosture["joints"] = prepareHumanShapeBlend(
      from.joints,
      to.joints,
    )(w),
  ): IAutoMovieMotionHumanPosture {
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
      yaw: from.yaw + AutoMovieEngineMath.wrapDegrees(to.yaw - from.yaw) * w,
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

/** Reuse the bone demand when measuring different postures at root zero. */
function prepareAtOrigin(
  body: IAutoMovieMotionHumanBody,
  requested: ReadonlySet<AutoMovieHumanoidBone>,
): (posture: IAutoMovieMotionHumanPosture) => ReturnType<typeof poseBones> {
  const frames: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    requested,
  );
  return (
    posture: IAutoMovieMotionHumanPosture,
  ): ReturnType<typeof poseBones> => {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const placed: IAutoMovieMotionHumanPosture = {
      ...posture,
      root: { x: 0, y: 0, z: 0 },
    };
    return frames(
      resolveHumanPosture.seeded(body, placed, undefined, undefined, resolution)
        .pose,
      resolution(),
    );
  };
}

/**
 * The least projection of a resolved body's collider surfaces on a unit normal,
 * metres: how far the body reaches against it.
 */
function supportAlong(
  placed: ReturnType<typeof HumanColliders.placed>,
  normal: IAutoMovieVector3,
): number {
  let least: number = Infinity;
  for (const { pose, shapes } of placed)
    for (const shape of shapes)
      least = Math.min(least, projectShape(shapeFrame(pose, shape), normal));
  return least;
}

/** A collider's physical shape in its resolved body's frame. */
interface IShapeFrame {
  /** The source shape in its own coordinate system. */
  shape: IAutoMoviePhysicalShape;

  /** The collider's resolved centre, metres. */
  centre: IAutoMovieVector3;

  /** Rotation from the resolved body's frame to the shape's local axes. */
  inverse: IAutoMovieQuaternion;
}

/** Compose the bone transform with the shape's local transform. */
function shapeFrame(
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
): IShapeFrame {
  return {
    shape,
    centre: Vector3.add(
      pose.position,
      Quaternion.rotateVector(pose.rotation, shape.transform.position),
    ),
    inverse: Quaternion.inverse(
      Quaternion.multiply(pose.rotation, shape.transform.rotation),
    ),
  };
}

/** The projection of the shape's furthest point against the given normal. */
function projectShape(
  { shape, centre, inverse }: IShapeFrame,
  normal: IAutoMovieVector3,
): number {
  const along: number = Vector3.dot(centre, normal);
  if (shape.kind === "sphere") return along - shape.radius;
  const local: IAutoMovieVector3 = Quaternion.rotateVector(inverse, normal);
  if (shape.kind === "capsule")
    return along - Math.abs(local.y) * shape.halfLength - shape.radius;
  if (shape.kind === "box")
    return (
      along -
      Math.abs(local.x) * shape.halfExtents.x -
      Math.abs(local.y) * shape.halfExtents.y -
      Math.abs(local.z) * shape.halfExtents.z
    );
  let least: number = Infinity;
  for (const point of shape.points)
    least = Math.min(least, along + Vector3.dot(point, local));
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
      least = Math.min(least, AutoMovieEnginePhysics.physicalShapeBounds(pose, shape).min.y);
  return least;
}
