import { Quaternion, Vector3, prepareArticulatedRig } from "@automovie/engine";
import type {
  IAutoMovieArticulatedRig,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { QuadrupedPoseAngles } from "./QuadrupedPoseAngles";
import type { QuadrupedPosePlan } from "./QuadrupedPosePlan";

/**
 * Compatibility adapter for the original rest world-chain lowering signature.
 *
 * New ride and Rest consumers prepare QuadrupedPose once and use its sample;
 * this adapter retains callers that already supply neutral/placed rig frames.
 *
 * @param rig Actual admitted neutral quadruped tree.
 * @param neutral Its original unplaced neutral world frames.
 * @param placed Its neutral frames under the requested complete root placement.
 * @param limbs Four complete solved five-point world chains.
 * @param tail Current authored world tail direction.
 * @returns Fresh generic local degree coordinates from the shared lowering owner.
 * @throws {RangeError} For an absent/ambiguous root, incomplete frames or invalid goals.
 * @evidence contracts/development/common.md#meaningful-documentation States compatibility scope, actual rig/frame premises, complete world-metre chain inputs, tail goal and independent generic degree output.
 * @evidence contracts/development/implementation.md#principled-implementation Recover the one complete rigid root as placed-root times inverse-neutral-root, then delegate all world-goal-to-local-angle work to QuadrupedPoseAngles on the actual rig and generic reader.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One rigid root conversion and one shared lowering call preserve the legacy signature without another angle, axis or FK implementation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No Rest-specific rotation type, species branch, human bone, Euler sign table, modified segment or completed-pose fallback remains.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(B+G) one-shot compatibility preparation/lowering for bones and goals; production consumers reuse QuadrupedPose's once-prepared reader instead.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the shared lowering and engine FK owners; no duplicated bone aiming/decomposition or retained query cache exists.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Rig metadata, reader and goal map are call-local; only fresh angle records escape and no model, geometry buffer or external resource is retained.
 */
export function QuadrupedRestPose(
  rig: IAutoMovieArticulatedRig<AutoMovieArchetypeQuadrupedBody.Bone>,
  neutral: ReadonlyMap<
    AutoMovieArchetypeQuadrupedBody.Bone,
    IAutoMovieTransform
  >,
  placed: ReadonlyMap<
    AutoMovieArchetypeQuadrupedBody.Bone,
    IAutoMovieTransform
  >,
  limbs: ReadonlyMap<
    AutoMovieArchetypeQuadrupedBody.Limb,
    readonly IAutoMovieVector3[]
  >,
  tail: IAutoMovieVector3,
): Map<AutoMovieArchetypeQuadrupedBody.Bone, QuadrupedPosePlan.Rotation> {
  if (neutral.size !== rig.bones.length || placed.size !== rig.bones.length)
    throw new RangeError(
      "Rest compatibility lowering requires complete actual frame maps",
    );
  for (const node of rig.bones)
    for (const frames of [neutral, placed]) {
      const frame: IAutoMovieTransform | undefined = frames.get(node.bone);
      if (frame === undefined)
        throw new RangeError(
          `Rest compatibility lowering has no ${node.bone} frame`,
        );
      const q: IAutoMovieQuaternion = frame.rotation;
      const norm: number = Math.hypot(q.x, q.y, q.z, q.w);
      if (!(Number.isFinite(norm) && Math.abs(norm - 1) <= 64 * Number.EPSILON))
        throw new RangeError(
          `Rest compatibility ${node.bone} needs a unit frame rotation`,
        );
      for (const axis of ["x", "y", "z"] as const)
        if (
          frame.scale[axis] !== 1 ||
          !Number.isFinite(frame.translation[axis])
        )
          throw new RangeError(
            `Rest compatibility ${node.bone} needs a finite rigid frame`,
          );
    }
  const roots: readonly IAutoMovieArticulatedRig<AutoMovieArchetypeQuadrupedBody.Bone>["bones"][number][] =
    rig.bones.filter(
      (
        node: IAutoMovieArticulatedRig<AutoMovieArchetypeQuadrupedBody.Bone>["bones"][number],
      ): boolean => node.parent === null,
    );
  if (roots.length !== 1)
    throw new RangeError(
      "Rest compatibility lowering requires one actual root",
    );
  const before: IAutoMovieTransform | undefined = neutral.get(roots[0]!.bone);
  const after: IAutoMovieTransform | undefined = placed.get(roots[0]!.bone);
  if (before === undefined || after === undefined)
    throw new RangeError(
      "Rest compatibility lowering requires both root frames",
    );
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    after.rotation,
    Quaternion.inverse(before.rotation),
  );
  const root: IAutoMovieTransform = {
    translation: Vector3.subtract(
      after.translation,
      Quaternion.rotateVector(rotation, before.translation),
    ),
    rotation,
    scale: { x: 1, y: 1, z: 1 },
  };
  const lower: QuadrupedPosePlan.Lowering = QuadrupedPoseAngles(
    rig,
    prepareArticulatedRig(rig),
  );
  const axial: ReadonlyMap<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal> =
    new Map<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal>([
      ["tail", { kind: "direction", direction: { ...tail } }],
    ]);
  return new Map(lower(root, limbs, axial).joints);
}
