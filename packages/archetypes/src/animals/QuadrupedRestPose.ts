import {
  Quaternion,
  Vector3,
  decomposeJointRotationOnBasis,
  rotationBetween,
} from "@automovie/engine";
import type {
  IAutoMovieArticulatedRig,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { QuadrupedBody } from "./QuadrupedBody";
import type { QuadrupedRestPlan } from "./QuadrupedRestPlan";

/**
 * Lower solved animal limb positions into the actual generic rig's coordinates.
 *
 * @param rig The admitted actual neutral tree from QuadrupedSkeleton.of.
 * @param neutral Its independently prepared unplaced neutral world frames.
 * @param placed Neutral frames under this sample's complete root placement.
 * @param limbs Five solved world joints per limb, with unchanged actual lengths.
 * @param tail Current authored world tail direction; its actual bar length stays fixed.
 * @returns Local degree rotations accepted by QuadrupedSkeleton.pose.
 * @throws {RangeError} For incomplete source/target bone data or degenerate solved bars.
 * @evidence contracts/development/common.md#meaningful-documentation States the admitted tree/frame inputs, model-space targets, degree output and incomplete-data refusals.
 * @evidence contracts/development/implementation.md#principled-implementation Shortest-arc aiming carries each actual neutral bar direction onto its solved direction while retaining its neutral axial carriage. Inverse parent and neutral-local rotations then give the articulation quaternion, decomposed by the engine on that bone's actual axes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Index the actual rig once, visit each four-bar chain parent first, and delegate quaternion composition/decomposition to the engine's owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No humanoid bone slots, guessed species frames, manual Euler sign table, scaled bar or changed geometry substitutes for the actual generic tree. Unknown anatomical ROM remains unknown.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(B) indexing and O(L) aiming for B rig bones and L limb bars plus one tail, with O(B+L) call-local maps and seventeen output rotations.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each parent rotation is resolved once and shared with its child; the prepared neutral/placed frames supplied by the caller are not reconstructed here.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Every output angle record is new; call-local maps retain no geometry buffers or external handle after the operation.
 */
export function QuadrupedRestPose(
  rig: IAutoMovieArticulatedRig<QuadrupedBody.Bone>,
  neutral: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform>,
  placed: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform>,
  limbs: ReadonlyMap<QuadrupedBody.Limb, readonly IAutoMovieVector3[]>,
  tail: IAutoMovieVector3,
): Map<QuadrupedBody.Bone, QuadrupedRestPlan.Rotation> {
  const nodes: Map<
    QuadrupedBody.Bone,
    IAutoMovieArticulatedRig<QuadrupedBody.Bone>["bones"][number]
  > = new Map(rig.bones.map(
    (node: IAutoMovieArticulatedRig<QuadrupedBody.Bone>["bones"][number]): [
      QuadrupedBody.Bone,
      IAutoMovieArticulatedRig<QuadrupedBody.Bone>["bones"][number],
    ] => [node.bone, node],
  ));
  const current: Map<QuadrupedBody.Bone, IAutoMovieQuaternion> = new Map(
    [...placed].map(
      ([bone, frame]: [QuadrupedBody.Bone, IAutoMovieTransform]): [
        QuadrupedBody.Bone,
        IAutoMovieQuaternion,
      ] => [bone, frame.rotation],
    ),
  );
  const result: Map<QuadrupedBody.Bone, QuadrupedRestPlan.Rotation> = new Map();
  for (const limb of QuadrupedBody.LIMBS) {
    const points: readonly IAutoMovieVector3[] | undefined = limbs.get(limb);
    if (points?.length !== 5)
      throw new RangeError(`Rest requires all five solved ${limb} joints`);
    const chain: readonly QuadrupedBody.Bone[] = QuadrupedBody.BONES[limb];
    for (let index: number = 0; index < chain.length; index++) {
      const bone: QuadrupedBody.Bone = chain[index]!;
      const direction: IAutoMovieVector3 = Vector3.subtract(points[index + 1]!, points[index]!);
      aim(bone, direction);
    }
  }
  aim("tail", tail);
  return result;

  /** One direction goal lowers through the same actual basis for limbs and tail. */
  function aim(bone: QuadrupedBody.Bone, direction: IAutoMovieVector3): void {
    const node: IAutoMovieArticulatedRig<QuadrupedBody.Bone>["bones"][number] | undefined = nodes.get(bone);
    const old: IAutoMovieTransform | undefined = neutral.get(bone);
    const parent: IAutoMovieQuaternion | undefined =
      node?.parent == null ? undefined : current.get(node.parent);
    if (node === undefined || old === undefined || parent === undefined || Vector3.length(direction) === 0)
      throw new RangeError(`Rest cannot resolve actual ${bone} frames`);
    const aimed: IAutoMovieQuaternion = Quaternion.multiply(
      rotationBetween(
        Quaternion.rotateVector(old.rotation, { x: 0, y: 1, z: 0 }),
        direction,
      ),
      old.rotation,
    );
    const local: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(node.rest.rotation),
      Quaternion.multiply(Quaternion.inverse(parent), aimed),
    );
    result.set(bone, decomposeJointRotationOnBasis(local, node.axes));
    current.set(bone, aimed);
  }
}
