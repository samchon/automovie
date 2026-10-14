import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../../../structures/IAutoMovieHumanBodyBasis";

/**
 * Admit an opt-in source-reference orientation capability after the rig.
 *
 * A declaration promises an independent reference whose motion can be read before the requested thighs are converted to source-joint coordinates. Nonzero pose-driven offsets of actual rig anchors would change that frame; goal-sourced couplings into the reference path would change the reference itself. Both feedback classes refuse rather than iterating or substituting a frame. Empty/zero rows, non-rig landmarks and zero-output curves create no such dependency. Legacy bases without this declaration remain unchanged.
 *
 * This first capability uses generic FK reference paths. A TT-resolved arm path has a different rotation dependency owner and is explicitly unsupported here, rather than treated as its generic parent chain. With pelvic rhythm, its root is goal-dependent too. Other independent generic source references need no personal clinical registration to define a geometric orientation.
 *
 * @evidence contracts/common.md#principled-implementation Under admitted rig hierarchy, explicit goal-leg/reference dependencies reject pose-driven anchor offsets, goal-subtree references and nonzero coupling feedback before conversion.
 * @evidence contracts/common.md#clear-and-simple-design One opt-in capability guard owns geometric reference independence while generic FK, TT resolution and clinical registration remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Feedback is rejected rather than iterated or compensated; TT paths and rhythm-dependent root references remain unsupported instead of borrowing a generic frame.
 * @evidence contracts/common.md#meaningful-documentation The prose explains exact feedback classes, harmless zero/non-rig rows and legacy omission behavior without claiming personal clinical registration.
 * @evidence contracts/performance.md#efficient-algorithms Joint/anchor maps scan J joints and L landmark IDs; checks visit corrective rows and at most G full ancestor/coupling scans, with O(J+L) transient identity sets.
 * @evidence contracts/performance.md#reuse-equivalent-work Joint, goal-bone and rig-index sets are built once for all goal checks; each reference path still needs its own dependency traversal.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps, sets and path collections expire on synchronous success/failure, retaining no converted pose, iterative task or caller mutation.
 */
export function assertHumanBodySourceReferenceGoals(
  basis: IAutoMovieHumanBodyBasis,
): void {
  const goals: IAutoMovieHumanBodyBasis["joints"] = basis.joints.filter(
    (joint: IAutoMovieHumanBodyBasis["joints"][number]): boolean =>
      joint.sourceReferenceGoal !== undefined,
  );
  if (goals.length === 0) return;
  const joints: Map<
    AutoMovieHumanoidBone,
    IAutoMovieHumanBodyBasis["joints"][number]
  > = new Map(
    basis.joints.map(
      (
        joint: IAutoMovieHumanBodyBasis["joints"][number],
      ): [
        AutoMovieHumanoidBone,
        IAutoMovieHumanBodyBasis["joints"][number],
      ] => [joint.bone, joint],
    ),
  );
  const goalBones: Set<AutoMovieHumanoidBone> = new Set(
    goals.map(
      (
        joint: IAutoMovieHumanBodyBasis["joints"][number],
      ): AutoMovieHumanoidBone => joint.bone,
    ),
  );
  const anchors: Set<string> = new Set(
    basis.joints.flatMap(
      (joint: IAutoMovieHumanBodyBasis["joints"][number]): string[] => [
        joint.head,
        joint.tail,
        ...(joint.flexionAxis ?? []),
      ],
    ),
  );
  const rigIndices: Set<number> = new Set(
    basis.landmarks.ids.flatMap((id: string, index: number): number[] =>
      anchors.has(id) ? [index] : [],
    ),
  );
  for (const corrective of basis.correctives ?? []) {
    if (
      !corrective.inputs.some(
        (
          input: NonNullable<
            IAutoMovieHumanBodyBasis["correctives"]
          >[number]["inputs"][number],
        ): boolean => "bone" in input || "shoulder" in input,
      )
    )
      continue;
    const rows: number[] = basis.landmarks.targets[corrective.target] ?? [];
    for (let at: number = 0; at < rows.length; at += 4)
      if (
        rigIndices.has(rows[at]) &&
        rows
          .slice(at + 1, at + 4)
          .some((offset: number): boolean => offset !== 0)
      )
        throw new Error(
          "Source-reference thigh goals do not support pose-driven rig-frame feedback: " +
            corrective.id,
        );
  }
  for (const joint of goals) {
    if (joint.bone !== "leftUpperLeg" && joint.bone !== "rightUpperLeg")
      throw new Error(
        "A source-reference thigh goal needs a named upper leg: " + joint.bone,
      );
    const reference: AutoMovieHumanoidBone =
      joint.sourceReferenceGoal!.reference;
    if (!joints.has(reference))
      throw new Error(
        "A source-reference thigh goal needs a declared reference: " +
          reference,
      );
    if (
      basis.pelvifemoral !== undefined &&
      joints.get(reference)!.parent === null
    )
      throw new Error(
        "Source-reference thigh goals do not support a pelvic-rhythm root reference: " +
          reference,
      );
    const path: Set<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>();
    let bone: AutoMovieHumanoidBone | null = reference;
    while (bone !== null) {
      if (goalBones.has(bone))
        throw new Error(
          "A source-reference thigh goal needs a reference outside every goal-leg subtree: " +
            reference,
        );
      const ancestor: IAutoMovieHumanBodyBasis["joints"][number] =
        joints.get(bone)!;
      if (ancestor.shoulder !== undefined)
        throw new Error(
          "Source-reference thigh goals do not support a TT-resolved reference path: " +
            reference,
        );
      path.add(bone);
      bone = ancestor.parent;
    }
    for (const coupling of basis.couplings ?? []) {
      if (
        !coupling.curve.some(
          ([, degrees]: readonly [number, number]): boolean => degrees !== 0,
        )
      )
        continue;
      if (goalBones.has(coupling.output.bone))
        throw new Error(
          "Source-reference thigh goals do not support a coupled goal-leg axis: " +
            coupling.id,
        );
      if (goalBones.has(coupling.source.bone) && path.has(coupling.output.bone))
        throw new Error(
          "Source-reference thigh goals do not support a goal-dependent reference coupling: " +
            coupling.id,
        );
    }
  }
}
