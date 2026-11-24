import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanArmGeometry } from "./HumanArmGeometry";

/** The alternatives of `MirroredOthersResult`'s site. */
type MirroredOthersResult = "others" | "rests";

/**
 * The mirror image across the world's x = 0 plane of what an arm is read
 * against, so a left arm is solved as the right arm in the mirror image of its
 * world and mirrored scenes give mirrored paths.
 */
export namespace HumanArmMirror {
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
      ...mirroredOthers(base),
      // The own segments the hand rests on, as their mirror images.
      ...(base.restsOwn === undefined
        ? {}
        : { restsOwn: base.restsOwn.map(opposite) }),
      // Each arm's own view, in the same arm order: a mirrored problem keeps
      // its arms' order and turns each to the other side.
      ...(base.arms === undefined ? {} : { arms: base.arms.map(mirrored) }),
    };
  }

  /** The others reflected, and the rests among them as those same reflections. */
  function mirroredOthers(
    base: HumanArmGeometry.IBase,
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
        ] => [placed, reflected(placed)],
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
                images.get(placed) ?? reflected(placed),
            ),
          }),
      ...(base.externals === undefined
        ? {}
        : { externals: base.externals.map(framed) }),
    };
  }

  /**
   * Another body's placed colliders reflected.
   *
   * @param placed The colliders.
   * @returns Their mirror image.
   */
  export function reflected(
    placed: IAutoMovieMotionHumanColliders.IPlaced,
  ): IAutoMovieMotionHumanColliders.IPlaced {
    return { ...framed(placed), bone: opposite(placed.bone) };
  }

  /**
   * A collider segment's frame and shapes reflected, whatever carries it (a
   * prop's or an animal's segment, `IAutoMovieMotionHumanColliders.IExternal`).
   * The shapes are reflected once per source list (`mirroredShapes`), so two
   * readings of one segment, as two arms laid on one partner each make, stay
   * one segment in the mirror image as they are in the world.
   *
   * @param placed The segment.
   * @returns Its mirror image, its other members unchanged.
   */
  export function framed<T extends IAutoMovieMotionHumanColliders.IFramed>(
    placed: T,
  ): T {
    return {
      ...placed,
      pose: {
        ...placed.pose,
        position: flip(placed.pose.position),
        rotation: turn(placed.pose.rotation),
      },
      shapes: mirroredShapes(placed.shapes),
    };
  }

  /**
   * A segment's shape list reflected, one list per source list. A frame counts
   * a segment once however many goals read it, by its bone, its pose and the
   * identity of its shape list (`HumanArmFrame.of`); the placement owner hands
   * every reading of a segment the same list, and a fresh list per reflection
   * made the two arms' readings of one partner two segments in a mirrored
   * problem, the region a hand is laid on kept as an obstacle in the other
   * reading.
   *
   * @param shapes The shapes.
   * @returns Their mirror images, the same list for the same source list.
   */
  function mirroredShapes(
    shapes: IAutoMovieMotionHumanColliders.IFramed["shapes"],
  ): IAutoMovieMotionHumanColliders.IFramed["shapes"] {
    let found: IAutoMovieMotionHumanColliders.IFramed["shapes"] | undefined =
      REFLECTED.get(shapes);
    if (found === undefined)
      REFLECTED.set(
        shapes,
        (found = shapes.map(
          (
            shape: IAutoMovieMotionHumanColliders.IFramed["shapes"][number],
          ) => ({
            ...shape,
            transform: {
              ...shape.transform,
              position: flip(shape.transform.position),
              rotation: turn(shape.transform.rotation),
            },
            ...(shape.kind === "hull" ? { points: flipped(shape.points) } : {}),
          }),
        ) as IAutoMovieMotionHumanColliders.IFramed["shapes"]),
      );
    return found;
  }

  /**
   * A hull's points mirrored, one array per source array, so the hull's faces,
   * which are remembered per array (`physicalHullFaces`), are found once for
   * its mirror image too.
   *
   * @param points The points.
   * @returns Their mirror images.
   */
  export function flipped(
    points: readonly IAutoMovieVector3[],
  ): IAutoMovieVector3[] {
    let found: IAutoMovieVector3[] | undefined = FLIPPED.get(points);
    if (found === undefined) FLIPPED.set(points, (found = points.map(flip)));
    return found;
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

/** Each segment's mirrored shape list, kept while the source list is held. */
const REFLECTED: WeakMap<
  IAutoMovieMotionHumanColliders.IFramed["shapes"],
  IAutoMovieMotionHumanColliders.IFramed["shapes"]
> = new WeakMap();

/** Each hull's mirrored points, kept while the source array is held. */
const FLIPPED: WeakMap<readonly IAutoMovieVector3[], IAutoMovieVector3[]> =
  new WeakMap();
