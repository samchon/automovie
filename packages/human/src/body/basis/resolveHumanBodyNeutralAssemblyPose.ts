import { resolveHumanBodySourceRig } from "../anatomy/articulation/rig/resolveHumanBodySourceRig";
import type { IAutoMovieHumanBodySkeletonRig } from "../structures/rig/IAutoMovieHumanBodySkeletonRig";
import type { IHumanBodyBuildPose } from "./IHumanBodyBuildPose";
import type { IHumanBodyBuildPoseInput } from "./IHumanBodyBuildPoseInput";

/**
 * Evaluate a declared static anatomical source and the native skin at rest.
 *
 * The source retains its real common bone frames and tissue attachment sites;
 * the existing shaped skin retains its independently authored native rest.
 * Neither representation performs motion or supplies a missing projection.
 * A neutral source need not pretend that its atlas bones are measured skin
 * joints. Source shape registration and actual part admission remain with the
 * source geometry consumer. Joint, shoulder, ray and reference-goal requests
 * refuse even at zero: this mode registers no performance capability.
 *
 * @author Samchon
 */
export function resolveHumanBodyNeutralAssemblyPose(
  input: IHumanBodyBuildPoseInput,
  rig: IAutoMovieHumanBodySkeletonRig,
): IHumanBodyBuildPose {
  const assembly = input.basis.anatomicalAssembly;
  if (assembly?.mode !== "neutral-only")
    throw new Error(
      "Held-source neutral replay requires its explicit source mode.",
    );
  // Document admission has already refused authored performance. Effective
  // coupling rows cannot introduce a second performed state in this mode.
  if (input.poseRows.length !== 0)
    throw new Error(
      "The source is neutral-only; effective pose coupling must retain rest.",
    );
  if (
    assembly.rig.nodes.some(
      (node) =>
        node.joint.kind !== "fixed" ||
        node.projections.length !== 0 ||
        (node.toeProjections?.length ?? 0) !== 0,
    ) ||
    (assembly.rig.toeBases?.length ?? 0) !== 0 ||
    assembly.rig.pelvicRhythm !== undefined
  )
    throw new Error(
      "Neutral-only sources require actual held rest frames without motion or skin projection annotations.",
    );
  const anatomicalRig = resolveHumanBodySourceRig({
    rig: assembly.rig,
    pose: [],
    shoulders: [],
    goals: [],
  });
  return {
    skeleton: rig.skeleton,
    transforms: new Map(
      [...rig.rest].map(([bone, rest]) => [bone, { rest, posed: rest }]),
    ),
    clinical: input.basis.joints.map((joint) => {
      const frame = rig.frames[joint.bone]!;
      return {
        bone: joint.bone,
        flexion: frame.flexion!.neutral,
        abduction: frame.abduction?.neutral ?? null,
        twist: frame.twist?.neutral ?? null,
      };
    }),
    rig,
    anatomicalRig,
  };
}
