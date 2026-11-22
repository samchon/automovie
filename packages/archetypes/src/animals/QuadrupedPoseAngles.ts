import {
  Quaternion,
  Vector3,
  decomposeJointRotationOnBasis,
  normalizeJointAxes,
  rotationBetween,
} from "@automovie/engine";
import type {
  IAutoMovieArticulatedRig,
  IAutoMovieArticulatedRigReader,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { QuadrupedPosePlan } from "./QuadrupedPosePlan";
import { QuadrupedScapula } from "./QuadrupedScapula";

/**
 * Prepare shared world-goal lowering for the actual quadruped rigid tree.
 *
 * @param rig The admitted actual tree used to prepare reader.
 * @param reader That same tree's independently prepared generic FK reader.
 * @returns A time-independent resolver; omitted limbs preview the axial goals only.
 * @throws {RangeError} For mismatched vocabulary, unknown/incomplete goals, nonfinite/degenerate directions or inadmissible rigid root.
 * @evidence contracts/development/common.md#meaningful-documentation States same-tree admission, degree/world-metre frames, complete four-chain input, independent state, preview behavior and refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Visit the real parent-first tree. A direction goal shortest-arc aims the bar carried by its current parent; an orientation goal specifies its world quaternion. Inverse parent and neutral-local rotations yield the articulation quaternion, which the engine decomposes on the actual normalized axes before ordinary generic FK.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Snapshot/index graph metadata once, assemble current direction/orientation goals, lower them in admitted parent order and return fresh achieved FK frames.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No species, humanoid slot, Euler sign table, copied clinical ROM, changed bar or previous-frame state supplies the rotation. Full physical endpoint closure remains the actual-model sampler's responsibility.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation is O(B); each query is O(B+G) with fresh maps for B bones and G goals. No hierarchy preparation or mesh generation occurs per query.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same admitted reader, independent node metadata, normalized bases and parent order serve every preview/sample query.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains O(B) independent scalar metadata and the bounded reader for the resolver lifetime; each query owns its maps/records and no input goal, completed pose or external handle is retained.
 */
export function QuadrupedPoseAngles(
  rig: IAutoMovieArticulatedRig<AutoMovieArchetypeQuadrupedBody.Bone>,
  reader: IAutoMovieArticulatedRigReader<AutoMovieArchetypeQuadrupedBody.Bone>,
): QuadrupedPosePlan.Lowering {
  const nodes: Map<
    AutoMovieArchetypeQuadrupedBody.Bone,
    IAutoMovieArticulatedRig<AutoMovieArchetypeQuadrupedBody.Bone>["bones"][number]
  > = new Map();
  for (const input of rig.bones) {
    const node: typeof input = structuredClone(input);
    node.rest.rotation = Quaternion.normalize(node.rest.rotation);
    node.axes = normalizeJointAxes(node.axes, `${rig.id}/${node.bone}.axes`);
    nodes.set(node.bone, node);
  }
  const order: readonly AutoMovieArchetypeQuadrupedBody.Bone[] = [
    ...reader.bones,
  ];
  if (
    nodes.size !== order.length ||
    order.some(
      (bone: AutoMovieArchetypeQuadrupedBody.Bone): boolean => !nodes.has(bone),
    )
  )
    throw new RangeError(
      "Quadruped pose lowering requires the reader's actual rig",
    );
  const axialNames: ReadonlySet<string> = new Set([
    "trunk",
    "hindquarters",
    "neck",
    "head",
    "tail",
    ...Object.values(QuadrupedScapula.BONES),
  ]);
  return resolve;

  /** Resolve one current set without retaining caller inputs or previous output. */
  function resolve(
    root?: IAutoMovieTransform,
    limbs?: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Limb,
      readonly IAutoMovieVector3[]
    >,
    axial?: ReadonlyMap<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal>,
  ): QuadrupedPosePlan.IState {
    const placed: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    > = checked(reader.read(undefined, root));
    const goals: Map<
      AutoMovieArchetypeQuadrupedBody.Bone,
      QuadrupedPosePlan.Goal
    > = new Map();
    if (axial === null)
      throw new RangeError("Quadruped axial goals cannot be null");
    for (const [bone, goal] of axial ?? []) {
      if (!axialNames.has(bone) || goal === undefined || goal === null)
        throw new RangeError(`Unknown quadruped axial goal ${bone}`);
      goals.set(bone, structuredClone(goal));
    }
    if (limbs === null)
      throw new RangeError("Quadruped solved limbs cannot be null");
    if (limbs !== undefined) {
      if (limbs.size !== AutoMovieArchetypeQuadrupedBody.LIMBS.length)
        throw new RangeError("A quadruped pose requires all four solved limbs");
      for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
        const points: readonly IAutoMovieVector3[] | undefined =
          limbs.get(limb);
        if (points?.length !== 5)
          throw new RangeError(
            `A quadruped pose requires all five ${limb} joints`,
          );
        for (const point of points)
          if (![point.x, point.y, point.z].every(Number.isFinite))
            throw new RangeError(
              `Quadruped ${limb} goals must be finite world points`,
            );
        const chain: readonly AutoMovieArchetypeQuadrupedBody.Bone[] =
          AutoMovieArchetypeQuadrupedBody.BONES[limb];
        for (let index: number = 0; index < chain.length; index++)
          goals.set(chain[index]!, {
            kind: "direction",
            direction: Vector3.subtract(points[index + 1]!, points[index]!),
          });
      }
    }
    const joints: Map<
      AutoMovieArchetypeQuadrupedBody.Bone,
      QuadrupedPosePlan.Rotation
    > = new Map();
    if (goals.size === 0) return { joints, frames: placed };
    const current: Map<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieQuaternion
    > = new Map();
    const rootRotation: IAutoMovieQuaternion =
      root === undefined
        ? Quaternion.identity()
        : Quaternion.normalize(root.rotation);
    for (const bone of order) {
      const node: IAutoMovieArticulatedRig<AutoMovieArchetypeQuadrupedBody.Bone>["bones"][number] =
        nodes.get(bone)!;
      const parent: IAutoMovieQuaternion =
        node.parent === null ? rootRotation : current.get(node.parent)!;
      const carried: IAutoMovieQuaternion = Quaternion.multiply(
        parent,
        node.rest.rotation,
      );
      const goal: QuadrupedPosePlan.Goal | undefined = goals.get(bone);
      if (goal === undefined) {
        current.set(bone, carried);
        continue;
      }
      let desired: IAutoMovieQuaternion;
      if (goal.kind === "rotation") {
        const q: IAutoMovieQuaternion = goal.rotation;
        const length: number = Math.hypot(q.x, q.y, q.z, q.w);
        if (!(Number.isFinite(length) && length > 0))
          throw new RangeError(
            `Quadruped ${bone} needs a finite nonzero world rotation`,
          );
        desired = Quaternion.normalize(q);
      } else if (goal.kind === "direction") {
        const direction: IAutoMovieVector3 = goal.direction;
        const length: number = Math.hypot(
          direction.x,
          direction.y,
          direction.z,
        );
        if (!(Number.isFinite(length) && length > 0))
          throw new RangeError(
            `Quadruped ${bone} needs a finite nonzero world direction`,
          );
        const unit: IAutoMovieVector3 = {
          x: direction.x / length,
          y: direction.y / length,
          z: direction.z / length,
        };
        desired = Quaternion.multiply(
          rotationBetween(
            Quaternion.rotateVector(carried, { x: 0, y: 1, z: 0 }),
            unit,
          ),
          carried,
        );
      } else {
        goal satisfies never;
        throw new RangeError(`Unknown quadruped ${bone} orientation goal`);
      }
      const local: IAutoMovieQuaternion = Quaternion.multiply(
        Quaternion.inverse(node.rest.rotation),
        Quaternion.multiply(Quaternion.inverse(parent), desired),
      );
      joints.set(bone, decomposeJointRotationOnBasis(local, node.axes));
      current.set(bone, desired);
    }
    return { joints, frames: checked(reader.read(joints, root)) };
  }

  /** Finite inputs can still overflow derived world positions; they cannot be reported as achieved frames. */
  function checked(
    frames: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    >,
  ): ReadonlyMap<AutoMovieArchetypeQuadrupedBody.Bone, IAutoMovieTransform> {
    for (const [bone, frame] of frames)
      if (
        ![
          frame.translation.x,
          frame.translation.y,
          frame.translation.z,
          frame.rotation.x,
          frame.rotation.y,
          frame.rotation.z,
          frame.rotation.w,
        ].every(Number.isFinite)
      )
        throw new RangeError(
          `Quadruped ${bone} has an unrepresentable current FK frame`,
        );
    return frames;
  }
}
