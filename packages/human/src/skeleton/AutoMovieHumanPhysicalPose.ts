import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieSkeleton,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { AutoMovieHumanRigBones } from "./AutoMovieHumanRigBones";
import type { AutoMovieHumanSkeleton as Skeleton } from "./AutoMovieHumanSkeleton";

/** Resolve a full Human display rig from physical segments and the authored detail pose, using the existing rig's folding law. */
export namespace AutoMovieHumanPhysicalPose {
  /** Minimal numerical FK, without unrelated source-surface snapshots. */
  export interface IReference {
    /** Same body's parent-before-child clinical hierarchy. */ bones: readonly {
      bone: string;
      parent: string | null;
    }[];
    /** Actual authored world placements in evaluator metres. */ posed: readonly Skeleton.IPlacement[];
  }

  /** Complete canonical clinical world frames, carrying unrepresented fingers, face and toes with their nearest physical ancestor. No render-rig folding is applied. */
  export function complete(input: {
    /** This person's authored clinical FK in the same world frame as segments. */ reference: IReference;
    /** Solved world bone-origin frames; never COM frames. */ segments: Readonly<
      Record<string, P.ITransform>
    >;
  }): Record<string, P.ITransform> {
    const source: Map<string, P.ITransform> = new Map(
      input.reference.posed.map(
        (
          pose: (typeof input.reference.posed)[number],
        ): [string, P.ITransform] => [
          pose.bone,
          {
            position: {
              x: pose.position[0],
              y: pose.position[1],
              z: pose.position[2],
            },
            rotation: {
              x: pose.rotation[0],
              y: pose.rotation[1],
              z: pose.rotation[2],
              w: pose.rotation[3],
            },
          },
        ],
      ),
    );
    const complete: Map<string, P.ITransform> = new Map();
    for (const [bone, pose] of Object.entries(input.segments))
      if (
        !source.has(bone) ||
        !pose ||
        ![
          pose.position.x,
          pose.position.y,
          pose.position.z,
          pose.rotation.x,
          pose.rotation.y,
          pose.rotation.z,
          pose.rotation.w,
        ].every(Number.isFinite) ||
        Math.abs(
          Math.hypot(
            pose.rotation.x,
            pose.rotation.y,
            pose.rotation.z,
            pose.rotation.w,
          ) - 1,
        ) > 1e-5
      )
        throw new Error(`Invalid Human physical display frame: ${bone}`);
    for (const bone of input.reference.bones) {
      const reference: P.ITransform | undefined = source.get(bone.bone);
      if (!reference || complete.has(bone.bone))
        throw new Error(`Invalid Human physical reference: ${bone.bone}`);
      if (Object.hasOwn(input.segments, bone.bone)) {
        complete.set(bone.bone, structuredClone(input.segments[bone.bone]!));
        continue;
      }
      if (bone.parent === null) {
        complete.set(bone.bone, structuredClone(reference));
        continue;
      }
      const parent: P.ITransform | undefined = complete.get(bone.parent);
      const oldParent: P.ITransform | undefined = source.get(bone.parent);
      if (!parent || !oldParent)
        throw new Error(
          `Human physical reference is not parent-before-child: ${bone.bone}`,
        );
      const delta: P.ITransform["rotation"] = Quaternion.multiply(
        parent.rotation,
        Quaternion.inverse(oldParent.rotation),
      );
      complete.set(bone.bone, {
        position: Vector3.add(
          parent.position,
          Quaternion.rotateVector(
            delta,
            Vector3.subtract(reference.position, oldParent.position),
          ),
        ),
        rotation: Quaternion.multiply(delta, reference.rotation),
      });
    }
    return Object.fromEntries(complete);
  }

  /** Fold completed clinical world frames into this person's actual render skeleton. */
  export function resolve(input: {
    /** This person's actual render rig. */ skeleton: IAutoMovieSkeleton;
    /** Authored clinical FK and hierarchy of the same body. */ reference: IReference;
    /** Actual solved world bone-origin frames. */ segments: Readonly<
      Record<string, P.ITransform>
    >;
  }): Record<string, P.ITransform> {
    const complete: Record<string, P.ITransform> =
      AutoMovieHumanPhysicalPose.complete(input);
    return Object.fromEntries(
      input.skeleton.bones.map(
        (
          bone: (typeof input.skeleton.bones)[number],
        ): [string, P.ITransform] => {
          const sourceJoint: string = AutoMovieHumanRigBones.joint(bone.bone);
          const pose: P.ITransform | undefined = complete[sourceJoint];
          if (!pose)
            throw new Error(
              `Human physical display lacks the rig's source joint: ${sourceJoint}`,
            );
          return [bone.bone, structuredClone(pose)];
        },
      ),
    );
  }
}
