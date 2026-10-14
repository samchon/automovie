import { resolveHumanBodySourceRig } from "../anatomy/articulation/rig/resolveHumanBodySourceRig";
import type { IAutoMovieHumanBodySkeletonRig } from "../structures/rig/IAutoMovieHumanBodySkeletonRig";
import type { IHumanBodyBuildPose } from "./IHumanBodyBuildPose";
import type { IHumanBodyBuildPoseInput } from "./IHumanBodyBuildPoseInput";

/**
 * Evaluate a declared static anatomical source and the native skin at rest.
 *
 * The source retains its real common bone frames and tissue attachment sites; the existing shaped skin retains its independently authored native rest. Neither representation performs motion or supplies a missing projection. A neutral source need not pretend that its atlas bones are measured skin joints. Source shape registration and actual part admission remain with the source geometry consumer. Joint, shoulder, ray and reference-goal requests refuse even at zero: this mode registers no performance capability.
 *
 * @evidence contracts/common.md#principled-implementation An explicitly neutral-only source evaluates its fixed anatomical graph while native skin receives the prepared rest transforms, keeping actual source sites without inventing public motion projections.
 * @evidence contracts/common.md#clear-and-simple-design Mode/effective-pose/source-annotation refusal precedes one held-source rig call and a rest-only build-pose result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Any effective coupling row, mobile source node, public/toe projection or pelvic-rhythm annotation refuses; neutral source geometry remains independently admitted and supplies no missing performance or biological skin-joint correspondence.
 * @evidence contracts/common.md#meaningful-documentation The comment states held-source mode, native rest skin, fixed common frames, absent performance capability and separate source shape/part admission.
 * @evidence contracts/performance.md#efficient-algorithms Source-mode checks walk graph nodes, fixed source FK belongs to its existing owner, and rest transform/clinical record copying is linear in public joints without skin evaluation.
 * @evidence contracts/performance.md#reuse-equivalent-work The prepared public rest rig and existing source FK owner are reused; rest and posed transforms intentionally share the same immutable rest record in this held result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned maps/source rig retain build-owned rest records until released; mode-check temporaries expire, with no persistent neutral replay cache, external handle or task.
 * @author Samchon
 */
export function resolveHumanBodyNeutralAssemblyPose(
  input: IHumanBodyBuildPoseInput,
  rig: IAutoMovieHumanBodySkeletonRig,
): IHumanBodyBuildPose {
  const assembly: IHumanBodyBuildPoseInput["basis"]["anatomicalAssembly"] =
    input.basis.anatomicalAssembly;
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
      (
        node: NonNullable<
          IHumanBodyBuildPoseInput["basis"]["anatomicalAssembly"]
        >["rig"]["nodes"][number],
      ): boolean =>
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
  const anatomicalRig: ReturnType<typeof resolveHumanBodySourceRig> =
    resolveHumanBodySourceRig({
      rig: assembly.rig,
      pose: [],
      shoulders: [],
      goals: [],
    });
  return {
    skeleton: rig.skeleton,
    transforms: new Map(
      [...rig.rest].map(
        ([bone, rest]: Parameters<typeof rig.rest.set>): Parameters<
          IHumanBodyBuildPose["transforms"]["set"]
        > => [bone, { rest, posed: rest }],
      ),
    ),
    clinical: input.basis.joints.map(
      (
        joint: (typeof input.basis.joints)[number],
      ): IHumanBodyBuildPose["clinical"][number] => {
        const frame: NonNullable<(typeof rig.frames)[typeof joint.bone]> =
          rig.frames[joint.bone]!;
        return {
          bone: joint.bone,
          flexion: frame.flexion!.neutral,
          abduction: frame.abduction?.neutral ?? null,
          twist: frame.twist?.neutral ?? null,
        };
      },
    ),
    rig,
    anatomicalRig,
  };
}
