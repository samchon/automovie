import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../../../structures/IAutoMovieHumanBodyBasis";

/**
 * Admit an opt-in source-reference orientation capability after the rig.
 *
 * A declaration promises an independent reference whose motion can be read
 * before the requested thighs are converted to source-joint coordinates.
 * Nonzero pose-driven offsets of actual rig anchors would change that frame;
 * goal-sourced couplings into the reference path would change the reference
 * itself. Both feedback classes refuse rather than iterating or substituting
 * a frame. Empty/zero rows, non-rig landmarks and zero-output curves create
 * no such dependency. Legacy bases without this declaration remain unchanged.
 *
 * This first capability uses generic FK reference paths. A TT-resolved arm
 * path has a different rotation dependency owner and is explicitly unsupported
 * here, rather than treated as its generic parent chain. With pelvic rhythm,
 * its root is goal-dependent too. Other independent generic source references
 * need no personal clinical registration to define a geometric orientation.
 */
export function assertHumanBodySourceReferenceGoals(
  basis: IAutoMovieHumanBodyBasis,
): void {
  const goals = basis.joints.filter(
    (joint) => joint.sourceReferenceGoal !== undefined,
  );
  if (goals.length === 0) return;
  const joints = new Map(basis.joints.map((joint) => [joint.bone, joint]));
  const goalBones = new Set(goals.map((joint) => joint.bone));
  const anchors = new Set(
    basis.joints.flatMap((joint) => [
      joint.head,
      joint.tail,
      ...(joint.flexionAxis ?? []),
    ]),
  );
  const rigIndices = new Set(
    basis.landmarks.ids.flatMap((id, index) =>
      anchors.has(id) ? [index] : [],
    ),
  );
  for (const corrective of basis.correctives ?? []) {
    if (
      !corrective.inputs.some((input) => "bone" in input || "shoulder" in input)
    )
      continue;
    const rows = basis.landmarks.targets[corrective.target] ?? [];
    for (let at = 0; at < rows.length; at += 4)
      if (
        rigIndices.has(rows[at]) &&
        rows.slice(at + 1, at + 4).some((offset) => offset !== 0)
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
    const reference = joint.sourceReferenceGoal!.reference;
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
    const path = new Set<AutoMovieHumanoidBone>();
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
      if (!coupling.curve.some(([, degrees]) => degrees !== 0)) continue;
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
