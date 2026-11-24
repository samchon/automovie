import { physicalHullFaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePhysicalHullFaces,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanArmGeometry } from "./HumanArmGeometry";

/** The alternatives of `MirroredOthersResult`'s site. */
type MirroredOthersResult = "others" | "rests";

/** A shape list of a collider segment. */
type IShapes = IAutoMovieMotionHumanColliders.IFramed["shapes"];

/**
 * The mirror image across the world's x = 0 plane of what an arm is read
 * against, so a left arm is solved as the right arm in the mirror image of its
 * world and mirrored scenes give mirrored paths.
 */
export namespace HumanArmMirror {
  /**
   * The reflections of one mirroring: every segment it reflects whose shape
   * list is one source list gets one reflected list. A frame counts a segment
   * once however many goals read it, by its bone, its pose and the identity of
   * its shape list (`HumanArmFrame`); the placement owner hands every reading
   * of a segment the same list, and a fresh list per reflection made the two
   * arms' readings of one partner two segments in a mirrored problem, the
   * region a hand is laid on kept as an obstacle in the other reading.
   */
  export interface IReflector {
    /**
     * Another body's placed colliders reflected.
     *
     * @param placed The colliders.
     * @returns Their mirror image.
     */
    reflected(
      placed: IAutoMovieMotionHumanColliders.IPlaced,
    ): IAutoMovieMotionHumanColliders.IPlaced;

    /**
     * A collider segment's frame and shapes reflected, whatever carries it.
     *
     * @param placed The segment.
     * @returns Its mirror image, its other members unchanged.
     */
    framed<T extends IAutoMovieMotionHumanColliders.IFramed>(placed: T): T;
  }

  /**
   * The reflector of one mirroring, its shape lists reflected once per source
   * list while the mirroring lasts.
   *
   * @returns The reflector.
   */
  export function reflector(): IReflector {
    const images: Map<IShapes, IShapes> = new Map();
    const shapesOf: (shapes: IShapes) => IShapes = (
      shapes: IShapes,
    ): IShapes => {
      let found: IShapes | undefined = images.get(shapes);
      if (found === undefined)
        images.set(shapes, (found = reflectShapes(shapes)));
      return found;
    };
    const framedWith: IReflector["framed"] = <
      T extends IAutoMovieMotionHumanColliders.IFramed,
    >(
      placed: T,
    ): T => ({
      ...placed,
      pose: {
        ...placed.pose,
        position: flip(placed.pose.position),
        rotation: turn(placed.pose.rotation),
      },
      shapes: shapesOf(placed.shapes),
    });
    return {
      framed: framedWith,
      reflected: (
        placed: IAutoMovieMotionHumanColliders.IPlaced,
      ): IAutoMovieMotionHumanColliders.IPlaced => ({
        ...framedWith(placed),
        bone: opposite(placed.bone),
      }),
    };
  }

  /**
   * A base's mirror image: the pose's left and right joints exchanged, their
   * clinical angles mirrored already, a midline joint's lateral bend and twist
   * and the root's turn negated (`ExerciseKey.mirror`); another body's
   * colliders reflected.
   *
   * @param base The base.
   * @returns Its mirror image.
   */
  export function mirrored(
    base: HumanArmGeometry.IBase,
  ): HumanArmGeometry.IBase {
    return mirroredWith(base, reflector());
  }

  /** A base's mirror image, its colliders reflected by one reflector. */
  function mirroredWith(
    base: HumanArmGeometry.IBase,
    by: IReflector,
  ): HumanArmGeometry.IBase {
    return {
      pose: {
        ...base.pose,
        root:
          base.pose.root === null
            ? null
            : {
                ...base.pose.root,
                translation: flip(base.pose.root.translation),
                rotation: turn(base.pose.root.rotation),
              },
        joints: base.pose.joints.map(
          (joint: HumanArmGeometry.IBase["pose"]["joints"][number]) =>
            joint.bone.startsWith("left") || joint.bone.startsWith("right")
              ? { ...joint, bone: opposite(joint.bone) }
              : {
                  ...joint,
                  abduction: joint.abduction === null ? null : -joint.abduction,
                  twist: joint.twist === null ? null : -joint.twist,
                },
        ),
      },
      ...mirroredOthers(base, by),
      // The own segments the hand rests on, as their mirror images.
      ...(base.restsOwn === undefined
        ? {}
        : { restsOwn: base.restsOwn.map(opposite) }),
      // Each arm's own view, in the same arm order: a mirrored problem keeps
      // its arms' order and turns each to the other side.
      ...(base.arms === undefined
        ? {}
        : {
            arms: base.arms.map(
              (arm: HumanArmGeometry.IBase): HumanArmGeometry.IBase =>
                mirroredWith(arm, by),
            ),
          }),
    };
  }

  /** The others reflected, and the rests among them as those same reflections. */
  function mirroredOthers(
    base: HumanArmGeometry.IBase,
    by: IReflector,
  ): Pick<HumanArmGeometry.IBase, MirroredOthersResult> {
    const images: Map<
      IAutoMovieMotionHumanColliders.IPlaced,
      IAutoMovieMotionHumanColliders.IPlaced
    > = new Map(
      base.others.map(
        (
          placed: IAutoMovieMotionHumanColliders.IPlaced,
        ): [
          IAutoMovieMotionHumanColliders.IPlaced,
          IAutoMovieMotionHumanColliders.IPlaced,
        ] => [placed, by.reflected(placed)],
      ),
    );
    return {
      others: base.others.map(
        (
          placed: IAutoMovieMotionHumanColliders.IPlaced,
        ): IAutoMovieMotionHumanColliders.IPlaced => images.get(placed)!,
      ),
      ...(base.rests === undefined
        ? {}
        : {
            rests: base.rests.map(
              (
                placed: IAutoMovieMotionHumanColliders.IPlaced,
              ): IAutoMovieMotionHumanColliders.IPlaced =>
                images.get(placed) ?? by.reflected(placed),
            ),
          }),
      ...(base.externals === undefined
        ? {}
        : {
            externals: base.externals.map(
              (
                external: IAutoMovieMotionHumanColliders.IExternal,
              ): IAutoMovieMotionHumanColliders.IExternal =>
                by.framed(external),
            ),
          }),
    };
  }

  /**
   * Another body's placed colliders reflected, by a reflector of their own.
   *
   * @param placed The colliders.
   * @returns Their mirror image.
   */
  export function reflected(
    placed: IAutoMovieMotionHumanColliders.IPlaced,
  ): IAutoMovieMotionHumanColliders.IPlaced {
    return reflector().reflected(placed);
  }

  /**
   * A collider segment's frame and shapes reflected, whatever carries it (a
   * prop's or an animal's segment, `IAutoMovieMotionHumanColliders.IExternal`),
   * by a reflector of its own.
   *
   * @param placed The segment.
   * @returns Its mirror image, its other members unchanged.
   */
  export function framed<T extends IAutoMovieMotionHumanColliders.IFramed>(
    placed: T,
  ): T {
    return reflector().framed(placed);
  }

  /** A segment's shape list reflected, a fresh list. */
  function reflectShapes(shapes: IShapes): IShapes {
    return shapes.map((shape: IShapes[number]): IShapes[number] => ({
      ...shape,
      transform: {
        ...shape.transform,
        position: flip(shape.transform.position),
        rotation: turn(shape.transform.rotation),
      },
      ...(shape.kind === "hull" ? reflectedHull(shape) : {}),
    })) as IShapes;
  }

  /** A hull shape's points mirrored with its hull, which is mirrored too. */
  function reflectedHull(shape: Extract<IShapes[number], { kind: "hull" }>): {
    points: IAutoMovieVector3[];
    hull?: IAutoMoviePhysicalHullFaces.IHull;
  } {
    const points: IAutoMovieVector3[] = flipped(shape.points);
    return shape.hull === undefined
      ? { points }
      : { points, hull: physicalHullFaces.mirrorHull(points, shape.hull) };
  }

  /**
   * A hull's points mirrored.
   *
   * @param points The points.
   * @returns Their mirror images, a fresh array.
   */
  export function flipped(
    points: readonly IAutoMovieVector3[],
  ): IAutoMovieVector3[] {
    return points.map(flip);
  }

  /**
   * A point's mirror image.
   *
   * @param p The point.
   * @returns Its image.
   */
  export function flip(p: IAutoMovieVector3): IAutoMovieVector3 {
    return { x: -p.x, y: p.y, z: p.z };
  }

  /**
   * A rotation's mirror image, M R M.
   *
   * @param q The rotation.
   * @returns Its image.
   */
  export function turn(q: IAutoMovieQuaternion): IAutoMovieQuaternion {
    return { x: q.x, y: -q.y, z: -q.z, w: q.w };
  }

  /**
   * A bone's name on the other side.
   *
   * @param bone The bone.
   * @returns The other side's, or the bone itself on the midline.
   */
  export function opposite(bone: AutoMovieHumanoidBone): AutoMovieHumanoidBone {
    return bone.startsWith("left")
      ? (`right${bone.slice(4)}` as AutoMovieHumanoidBone)
      : bone.startsWith("right")
        ? (`left${bone.slice(5)}` as AutoMovieHumanoidBone)
        : bone;
  }
}
