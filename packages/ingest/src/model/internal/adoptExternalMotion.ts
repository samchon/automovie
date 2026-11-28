import { AutoMovieEngineSha256DigestPattern } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieClip,
  IAutoMovieExternalMotionAdoptionDecision,
  IAutoMovieExternalMotionAdoptionReceipt,
  IAutoMovieExternalMotionInspection,
  IAutoMovieExternalMotionNativeHandoff,
  IAutoMovieExternalMotionNodeInspection,
  IAutoMovieExternalMotionRetargetDecision,
  IAutoMovieExternalMotionRetargetHandoff,
  IAutoMovieExternalMotionSource,
  IAutoMovieImportedNodeBoneMapping,
  IAutoMovieSkeleton,
  IAutoMovieTrack,
  IAutoMovieTransform,
} from "@automovie/interface";

import { composeLocalTransform } from "../../internal/composeLocalTransform";
import { AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE } from "./AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE";
import { compareCodeUnits } from "./compareCodeUnits";

/*
 * Select one inspected take and validate the author's native or retarget
 * decision without fetching bytes, choosing a provider or inferring a rig.
 *
 * The inspection must come from the `gltf-motion-v1` profile under the glTF
 * meter, right-handed, Y-up interpretation, and the source must repeat its path
 * and byte length with a lowercase SHA-256 digest. Every track of the selected
 * take must target a mapped node, translation only on the node mapped to
 * `hips`, and never scale or weights, because humanoid motion carries neither.
 * Each mapped bone's parent and rest in the declared source rig must equal what
 * the inspected hierarchy implies: the nearest mapped ancestor and the node's
 * local TRS composed through every unmapped helper between them. The comparison
 * is exact, so an author computes the rest from the inspected transforms rather
 * than retyping rounded values. The first violation throws with the field it
 * concerns.
 *
 * The caller supplies an unmodified inspector result and binds the digest to
 * the resident bytes; adoption checks digest spelling, not a hash. Rig
 * admission here requires a non-blank id, unique bone names and `hips`, but
 * basis comparisons cover only mapped bones and do not validate constraints or
 * unmapped rests. Helper TRS composition follows fixed floating-point
 * arithmetic and drops shear when a helper's non-uniform scale does not commute
 * with a child rotation; exact agreement proves agreement with that
 * representation, not exact affine geometry.
 * Parameter props.inspection: Inspection of the exact source bytes.
 * Parameter props.source: Manifest identity of those bytes.
 * Parameter props.decision: The author's use of one take.
 * Returns: A receipt that shares no objects with its inputs.
 */
export function adoptExternalMotion(
  props: IAutoMovieExternalMotionAdoptionReceipt.IProps,
): IAutoMovieExternalMotionAdoptionReceipt {
  if (props.inspection.profile !== "gltf-motion-v1")
    throw new Error(
      'External motion adoption requires the "gltf-motion-v1" inspection profile.',
    );
  const motion: IAutoMovieExternalMotionInspection | undefined =
    props.inspection.motion;
  if (motion === undefined)
    throw new Error("External source has no inspected motion takes.");
  if (motion.interpretation !== AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE)
    throw new Error(
      `External motion interpretation "${String(motion.interpretation)}" is unsupported.`,
    );
  if (props.source.path.trim().length === 0)
    throw new Error("External motion source path must be non-blank.");
  if (props.source.path !== motion.path)
    throw new Error(
      `External motion source path "${props.source.path}" does not match inspected path "${motion.path}".`,
    );
  if (
    Number.isSafeInteger(props.source.byteLength) === false ||
    props.source.byteLength <= 0 ||
    props.source.byteLength !== motion.byteLength
  )
    throw new Error(
      `External motion source byteLength ${props.source.byteLength} does not match inspected byteLength ${motion.byteLength}.`,
    );
  if (AutoMovieEngineSha256DigestPattern.test(props.source.digest) === false)
    throw new Error(
      `External motion source digest "${props.source.digest}" must be a lowercase SHA-256 digest.`,
    );
  const decision: IAutoMovieExternalMotionAdoptionDecision = props.decision;
  if (decision.mode !== "native" && decision.mode !== "retarget")
    throw new Error(
      `Unsupported external motion adoption mode "${String((decision as { mode: unknown }).mode)}".`,
    );
  if (
    decision.mode === "native" &&
    (decision.target !== undefined || decision.translationScale !== undefined)
  )
    throw new Error(
      "A native external motion decision cannot set target or translationScale.",
    );
  const selected: IAutoMovieClip | undefined = motion.takes.find(
    (take: IAutoMovieClip): boolean => take.id === decision.take,
  );
  if (selected === undefined)
    throw new Error(
      `External motion take "${decision.take}" is not present in the inspected source.`,
    );
  const binding: Pick<
    IAutoMovieExternalMotionNativeHandoff,
    "sourceRig" | "mapping"
  > = validateMotionBinding({
    decision,
    take: selected,
    nodes: motion.nodes,
  });
  const source: IAutoMovieExternalMotionSource = { ...props.source };
  const take: IAutoMovieClip = cloneClip(selected);
  if (decision.mode === "native")
    return {
      source,
      mode: "native",
      take,
      handoff: { mode: "native", ...binding },
    };
  return {
    source,
    mode: "retarget",
    take,
    handoff: {
      mode: "retarget",
      ...binding,
      ...validateRetargetDecision(decision),
    },
  };
}

function validateMotionBinding(props: {
  decision: IAutoMovieExternalMotionAdoptionDecision;
  take: IAutoMovieClip;
  nodes: IAutoMovieExternalMotionNodeInspection[];
}): Pick<IAutoMovieExternalMotionNativeHandoff, "sourceRig" | "mapping"> {
  const sourceRig: IAutoMovieSkeleton = props.decision.sourceRig;
  if (sourceRig.id.trim().length === 0)
    throw new Error("External motion source rig id must be non-blank.");
  if (sourceRig.bones.length === 0)
    throw new Error("External motion source rig has no bones.");

  const sourceBones: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map<
    AutoMovieHumanoidBone,
    IAutoMovieBone
  >();
  for (const bone of sourceRig.bones) {
    if (sourceBones.has(bone.bone))
      throw new Error(
        `External motion source rig duplicates bone "${bone.bone}".`,
      );
    sourceBones.set(bone.bone, bone);
  }
  if (sourceBones.has("hips") === false)
    throw new Error(
      'External motion source rig is missing required bone "hips".',
    );

  const mapping: IAutoMovieImportedNodeBoneMapping[] = props.decision.mapping;
  if (mapping.length === 0)
    throw new Error("External motion semantic mapping must not be empty.");
  const availableNodes: Map<string, IAutoMovieExternalMotionNodeInspection> =
    new Map<string, IAutoMovieExternalMotionNodeInspection>(
      props.nodes.map(
        (
          node: IAutoMovieExternalMotionNodeInspection,
        ): [string, IAutoMovieExternalMotionNodeInspection] => [node.id, node],
      ),
    );
  const nodeToBone: Map<string, AutoMovieHumanoidBone> = new Map<
    string,
    AutoMovieHumanoidBone
  >();
  const mappedBones: Set<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>();
  for (const entry of mapping) {
    if (availableNodes.has(entry.node) === false)
      throw new Error(
        `External motion mapping node "${entry.node}" is not present in the inspected source.`,
      );
    if (sourceBones.has(entry.bone) === false)
      throw new Error(
        `External motion mapping bone "${entry.bone}" is absent from source rig "${sourceRig.id}".`,
      );
    if (nodeToBone.has(entry.node))
      throw new Error(
        `External motion mapping duplicates node "${entry.node}".`,
      );
    if (mappedBones.has(entry.bone))
      throw new Error(
        `External motion mapping duplicates bone "${entry.bone}".`,
      );
    nodeToBone.set(entry.node, entry.bone);
    mappedBones.add(entry.bone);
  }
  for (const track of props.take.tracks) {
    if (track.channel.kind !== "node")
      throw new Error(
        "External motion semantic conversion supports only node tracks.",
      );
    const bone: AutoMovieHumanoidBone | undefined = nodeToBone.get(
      track.channel.node,
    );
    if (bone === undefined)
      throw new Error(
        `External motion track node "${track.channel.node}" has no explicit semantic mapping.`,
      );
    if (track.channel.path === "translation" && bone !== "hips")
      throw new Error(
        `External motion translation for node "${track.channel.node}" must map to hips.`,
      );
    if (track.channel.path === "scale" || track.channel.path === "weights")
      throw new Error(
        `External motion ${track.channel.path} channel for node "${track.channel.node}" is unsupported by humanoid motion conversion.`,
      );
  }
  for (const entry of mapping) {
    const bone: IAutoMovieBone = sourceBones.get(entry.bone)!;
    const expected: {
      parent: AutoMovieHumanoidBone | null;
      rest: IAutoMovieTransform;
    } = inspectedBoneBasis(
      availableNodes.get(entry.node)!,
      availableNodes,
      nodeToBone,
    );
    if (bone.parent !== expected.parent)
      throw new Error(
        `External motion source rig bone "${entry.bone}" parent ${JSON.stringify(bone.parent)} does not match inspected parent ${JSON.stringify(expected.parent)}.`,
      );
    assertTransformMatches(entry.bone, bone.rest, expected.rest);
  }
  return {
    sourceRig: cloneSkeleton(sourceRig),
    mapping: mapping
      .map(
        (
          entry: IAutoMovieImportedNodeBoneMapping,
        ): IAutoMovieImportedNodeBoneMapping => ({ ...entry }),
      )
      .sort(
        (
          left: IAutoMovieImportedNodeBoneMapping,
          right: IAutoMovieImportedNodeBoneMapping,
        ): number => compareCodeUnits(left.node, right.node),
      ),
  };
}

/*
 * The parent and rest a mapped node implies: walk to the nearest mapped
 * ancestor, then fold every unmapped helper's TRS into the node's own, nearest
 * helper first. A node without a mapped ancestor keeps its local TRS.
 */
function inspectedBoneBasis(
  node: IAutoMovieExternalMotionNodeInspection,
  nodes: Map<string, IAutoMovieExternalMotionNodeInspection>,
  nodeToBone: Map<string, AutoMovieHumanoidBone>,
): { parent: AutoMovieHumanoidBone | null; rest: IAutoMovieTransform } {
  const helpers: IAutoMovieExternalMotionNodeInspection[] = [];

  // An inspector's hierarchy is an acyclic forest, so the walk meets each
  // ancestor once and ends after at most every node; an inspection whose
  // parents loop through unmapped helpers is refused instead of circled.
  const walked: Set<string> = new Set<string>([node.id]);
  let parentId: string | null = node.parent;
  while (parentId !== null) {
    if (walked.has(parentId))
      throw new Error(
        `External motion node "${node.id}" has a parent cycle through "${parentId}".`,
      );
    walked.add(parentId);
    const mappedParent: AutoMovieHumanoidBone | undefined =
      nodeToBone.get(parentId);
    if (mappedParent !== undefined) {
      let rest: IAutoMovieTransform = node.transform;
      for (const helper of helpers)
        rest = composeLocalTransform(helper.transform, rest);
      return { parent: mappedParent, rest };
    }
    const parent: IAutoMovieExternalMotionNodeInspection = nodes.get(parentId)!;
    helpers.push(parent);
    parentId = parent.parent;
  }
  return { parent: null, rest: node.transform };
}

function assertTransformMatches(
  bone: AutoMovieHumanoidBone,
  actual: IAutoMovieTransform,
  expected: IAutoMovieTransform,
): void {
  const components: Array<[string, number, number]> = [
    ["translation.x", actual.translation.x, expected.translation.x],
    ["translation.y", actual.translation.y, expected.translation.y],
    ["translation.z", actual.translation.z, expected.translation.z],
    ["rotation.x", actual.rotation.x, expected.rotation.x],
    ["rotation.y", actual.rotation.y, expected.rotation.y],
    ["rotation.z", actual.rotation.z, expected.rotation.z],
    ["rotation.w", actual.rotation.w, expected.rotation.w],
    ["scale.x", actual.scale.x, expected.scale.x],
    ["scale.y", actual.scale.y, expected.scale.y],
    ["scale.z", actual.scale.z, expected.scale.z],
  ];
  for (const [path, value, inspected] of components)
    if (value !== inspected)
      throw new Error(
        `External motion source rig bone "${bone}" rest ${path} ${value} does not match inspected value ${inspected}.`,
      );
}

function validateRetargetDecision(
  decision: IAutoMovieExternalMotionRetargetDecision,
): Pick<
  IAutoMovieExternalMotionRetargetHandoff,
  "target" | "translationScale"
> {
  if (
    typeof decision.target !== "string" ||
    decision.target.trim().length === 0
  )
    throw new Error("External motion target identity must be non-blank.");
  if (
    Number.isFinite(decision.translationScale) === false ||
    decision.translationScale <= 0
  )
    throw new Error(
      `External motion translationScale must be finite and positive, but was ${decision.translationScale}.`,
    );
  return {
    target: decision.target,
    translationScale: decision.translationScale,
  };
}

function cloneClip(clip: IAutoMovieClip): IAutoMovieClip {
  return {
    ...clip,
    tracks: clip.tracks.map(
      (track: IAutoMovieTrack): IAutoMovieTrack => ({
        ...track,
        channel: { ...track.channel },
        times: [...track.times],
        values: [...track.values],
      }),
    ),
  };
}
function cloneSkeleton(skeleton: IAutoMovieSkeleton): IAutoMovieSkeleton {
  return {
    id: skeleton.id,
    bones: skeleton.bones.map(
      (bone: IAutoMovieBone): IAutoMovieBone => ({
        ...bone,
        ...(bone.axes === undefined
          ? {}
          : {
              axes: {
                ...bone.axes,
                flexion: { ...bone.axes.flexion },
                abduction: { ...bone.axes.abduction },
                twist: { ...bone.axes.twist },
              },
            }),
        rest: {
          translation: { ...bone.rest.translation },
          rotation: { ...bone.rest.rotation },
          scale: { ...bone.rest.scale },
        },
        constraint:
          bone.constraint === null
            ? null
            : {
                ...bone.constraint,
                ...(bone.constraint.swingTwist === undefined ||
                bone.constraint.swingTwist === null
                  ? {}
                  : {
                      swingTwist: {
                        ...bone.constraint.swingTwist,
                        twist: { ...bone.constraint.swingTwist.twist },
                      },
                    }),
                flexion:
                  bone.constraint.flexion === null
                    ? null
                    : { ...bone.constraint.flexion },
                abduction:
                  bone.constraint.abduction === null
                    ? null
                    : { ...bone.constraint.abduction },
                twist:
                  bone.constraint.twist === null
                    ? null
                    : { ...bone.constraint.twist },
              },
      }),
    ),
  };
}
