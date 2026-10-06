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
 * @evidence contracts/common.md#principled-implementation Actual fixed source FK resolves its held sites while the native shaped skin uses its real rest frames, with no unregistered performance.
 * @evidence contracts/common.md#clear-and-simple-design One explicit neutral mode separates static source replay from the existing articulated projection bridge.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Real source nodes and attachment sites are admitted through their owning resolver; no fabricated joint, projection or successful clinical registration is returned.
 * @evidence contracts/common.md#meaningful-documentation Explains the two authored rest representations, unsupported goals and source shape admission boundary.
 * @evidence contracts/modeling.md#spatial-conventions Source and skin rest frames use the same declared canonical body metres; clinical source-rest values remain degrees.
 * @evidence contracts/modeling.md#parameter-channels The loaded neutral-only source declines every performance coordinate while preserving independently authored source and skin rest.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This numerical rest adapter defines no anatomical part; the source assembly owns the bone and tissue membership.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The source part and skin consumers own all boundary vertices and triangles.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The source geometry owner constructs and admits the tissue boundaries; this adapter only supplies their actual held frame/site result.
 * @evidenceExclude contracts/modeling.md#rendered-observation The actual neutral body/person assembly owns appearance observation; this frame adapter carries no independently rendered form.
 * @evidence contracts/anatomy.md#anatomical-source Source atlas frames and native skin joints retain independent acquisition and authoring accounts, without inferred anatomical correspondence.
 * @evidence contracts/anatomy.md#permitted-range Every performance request refuses in the neutral-only source mode and leaves the caller unchanged.
 * @evidence contracts/anatomy.md#parametric-authority Caller documents contain named measurements and goals; this adapter reads the loaded immutable source mode and supplies no personal frame or vertex editing.
 * @author Samchon
 */
export function resolveHumanBodyNeutralAssemblyPose(
  input: IHumanBodyBuildPoseInput,
  rig: IAutoMovieHumanBodySkeletonRig,
): IHumanBodyBuildPose {
  const assembly = input.basis.anatomicalAssembly;
  if (assembly?.mode !== "neutral-only")
    throw new Error("Held-source neutral replay requires its explicit source mode.");
  // Document admission has already refused authored performance. Effective
  // coupling rows cannot introduce a second performed state in this mode.
  if (input.poseRows.length !== 0)
    throw new Error("The source is neutral-only; effective pose coupling must retain rest.");
  if (assembly.rig.nodes.some((node) => node.joint.kind !== "fixed" || node.projections.length !== 0 ||
      (node.toeProjections?.length ?? 0) !== 0) || (assembly.rig.toeBases?.length ?? 0) !== 0 ||
    assembly.rig.pelvicRhythm !== undefined)
    throw new Error("Neutral-only sources require actual held rest frames without motion or skin projection annotations.");
  const anatomicalRig = resolveHumanBodySourceRig({ rig: assembly.rig, pose: [], shoulders: [], goals: [] });
  return {
    skeleton: rig.skeleton,
    transforms: new Map([...rig.rest].map(([bone, rest]) => [bone, { rest, posed: rest }])),
    clinical: input.basis.joints.map((joint) => {
      const frame = rig.frames[joint.bone]!;
      return { bone: joint.bone, flexion: frame.flexion!.neutral,
        abduction: frame.abduction?.neutral ?? null, twist: frame.twist?.neutral ?? null };
    }),
    rig,
    anatomicalRig,
  };
}
