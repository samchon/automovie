import { Quaternion, Vector3, AutoMovieEngineMath, AutoMovieEngineKinematics, AutoMovieEngineKinematicsJointRotation } from "@automovie/engine";
import type {
  IAutoMovieArticulatedRig,
  IAutoMovieArticulatedRigReader,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import type { QuadrupedPosePlan } from "./QuadrupedPosePlan";
import { QuadrupedScapula } from "./QuadrupedScapula";

/**
 * Prepare shared world-goal lowering for the quadruped rigid tree.
 *
 * @param rig The admitted tree used to prepare reader.
 * @param reader That same tree's independently prepared generic FK reader.
 * @returns A time-independent resolver; omitted limbs preview the axial goals
 *   only.
 * @throws {RangeError} For mismatched vocabulary, unknown/incomplete goals,
 *   nonfinite/degenerate directions or inadmissible rigid root.
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
    node.axes = AutoMovieEngineKinematics.normalizeJointAxes(node.axes, `${rig.id}/${node.bone}.axes`);
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
    > = reader.read(undefined, root);
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
        if (!(length > 0))
          throw new RangeError(
            `Quadruped ${bone} needs a finite nonzero world rotation`,
          );
        desired = Quaternion.normalize(q);
      } else if (goal.kind === "direction") {
        const unit: IAutoMovieVector3 = Vector3.normalize(goal.direction);
        if (!(Vector3.dot(unit, unit) > 0))
          throw new RangeError(
            `Quadruped ${bone} needs a finite nonzero world direction`,
          );
        desired = Quaternion.multiply(
          AutoMovieEngineMath.rotationBetween(
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
      joints.set(bone, AutoMovieEngineKinematicsJointRotation.decomposeJointRotationOnBasis(local, node.axes));
      current.set(bone, desired);
    }
    return { joints, frames: reader.read(joints, root) };
  }
}
