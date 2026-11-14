import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanArmGeometry } from "./HumanArmGeometry";
import type { HumanColliders } from "./HumanColliders";

/**
 * The mirror image across the world's x = 0 plane of what an arm is read
 * against, so a left arm is solved as the right arm in the mirror image of
 * its world and mirrored scenes give mirrored paths.
 */
export namespace HumanArmMirror {
  /**
   * A base's mirror image: the pose's left and right joints exchanged, their
   * clinical angles mirrored already, a midline joint's lateral bend and
   * twist and the root's turn negated (`ExerciseKey.mirror`); another body's
   * colliders reflected.
   *
   * @param base The base.
   * @returns Its mirror image.
   */
  export function mirrored(base: HumanArmGeometry.IBase): HumanArmGeometry.IBase {
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
        joints: base.pose.joints.map((joint: HumanArmGeometry.IBase["pose"]["joints"][number]) =>
          joint.bone.startsWith("left") || joint.bone.startsWith("right")
            ? { ...joint, bone: opposite(joint.bone) }
            : {
                ...joint,
                abduction: joint.abduction === null ? null : -joint.abduction,
                twist: joint.twist === null ? null : -joint.twist,
              },
        ),
      },
      others: base.others.map(reflected),
    };
  }

  /**
   * Another body's placed colliders reflected.
   *
   * @param placed The colliders.
   * @returns Their mirror image.
   */
  export function reflected(placed: HumanColliders.IPlaced): HumanColliders.IPlaced {
    return {
      ...placed,
      bone: opposite(placed.bone),
      pose: {
        ...placed.pose,
        position: flip(placed.pose.position),
        rotation: turn(placed.pose.rotation),
      },
      shapes: placed.shapes.map((shape: HumanColliders.IPlaced["shapes"][number]) => ({
        ...shape,
        transform: {
          ...shape.transform,
          position: flip(shape.transform.position),
          rotation: turn(shape.transform.rotation),
        },
        ...(shape.kind === "hull" ? { points: flipped(shape.points) } : {}),
      })) as HumanColliders.IPlaced["shapes"],
    };
  }

  /**
   * A hull's points mirrored, one array per source array, so the hull's faces,
   * which are remembered per array (`physicalHullFaces`), are found once
   * for its mirror image too.
   *
   * @param points The points.
   * @returns Their mirror images.
   */
  export function flipped(points: readonly IAutoMovieVector3[]): IAutoMovieVector3[] {
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

/** Each hull's mirrored points, kept while the source array is held. */
const FLIPPED: WeakMap<readonly IAutoMovieVector3[], IAutoMovieVector3[]> = new WeakMap();
