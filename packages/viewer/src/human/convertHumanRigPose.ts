import type { AutoMovieHumanSkeleton as Skeleton } from "@automovie/human";
import * as THREE from "three";

import type { HumanRigBinding } from "./HumanRigBinding.js";

/**
 * Convert a matching evaluated world pose before any drawing mutation.
 * Positions use metres; normalized parent-inverse rotations produce the same parent-local transforms used by the existing rigid binding and clip compiler.
 * A missing, nonfinite or zero-quaternion placement rejects rather than changing the fixed rest graph. Returned maps and Three values belong to the caller.
 *
 * @evidence contracts/common.md#principled-implementation Converts the supplied actual world placements into parent-local metre positions and normalized quaternions using Three parent-inverse operations and the fixed rest identities.
 * @evidence contracts/common.md#clear-and-simple-design A pure value conversion separates validation from the binding's drawing mutation, mixer and resource ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the original missing/finite/zero-quaternion checks and operation order; parent-before-child matching rest and evaluated outputs are premises, without new FK or clamps.
 * @evidence contracts/common.md#meaningful-documentation Documents world versus parent-local frames, fixed identity matching, validation failure and caller ownership of returned transforms.
 * @evidence contracts/performance.md#efficient-algorithms Builds one placed lookup and one result per rest bone, with linear time/space in those two bone populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads existing evaluated placements and rest identities; no evaluator, geometry traversal or persistent result cache is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a map of vectors/quaternions escapes to the caller; input records are borrowed and no GPU, player or native handle is acquired.
 */
export function convertHumanRigPose(
  rest: Skeleton.IOutput,
  output: Skeleton.IOutput,
): Map<string, HumanRigBinding.ILocal> {
  const placed: Map<string, Skeleton.IPlacement> = new Map(
    output.posed.map(
      (placement: Skeleton.IPlacement): [string, Skeleton.IPlacement] => [
        placement.bone,
        placement,
      ],
    ),
  );
  return new Map(
    rest.bones.map(
      (bone: Skeleton.IBone): [string, HumanRigBinding.ILocal] => {
        const placement: Skeleton.IPlacement | undefined = placed.get(
          bone.bone,
        );
        const parent: Skeleton.IPlacement | undefined =
          bone.parent === null ? undefined : placed.get(bone.parent);
        if (
          placement === undefined ||
          (bone.parent !== null && parent === undefined) ||
          placement.position.length !== 3 ||
          placement.rotation.length !== 4 ||
          ![...placement.position, ...placement.rotation].every(
            Number.isFinite,
          ) ||
          Math.hypot(...placement.rotation) === 0
        )
          throw new Error(
            `Evaluated Human pose is missing finite bone ${bone.bone}`,
          );
        const position: THREE.Vector3 = new THREE.Vector3(
          ...placement.position,
        );
        const rotation: THREE.Quaternion = new THREE.Quaternion(
          ...placement.rotation,
        ).normalize();
        if (parent !== undefined) {
          const inverse: THREE.Quaternion = new THREE.Quaternion(
            ...parent.rotation,
          )
            .normalize()
            .invert();
          position
            .sub(new THREE.Vector3(...parent.position))
            .applyQuaternion(inverse);
          rotation.premultiply(inverse).normalize();
        }
        return [bone.bone, { position, rotation }];
      },
    ),
  );
}
