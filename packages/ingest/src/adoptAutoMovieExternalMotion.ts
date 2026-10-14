import { SHA256_DIGEST_PATTERN } from "@automovie/engine/validation/constants/SHA256_DIGEST_PATTERN";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieClip,
  IAutoMovieSkeleton,
  IAutoMovieTrack,
  IAutoMovieTransform,
} from "@automovie/interface";

import { AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE } from "./AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE";
import type { AutoMovieExternalMotionAdoptionDecision } from "./AutoMovieExternalMotionAdoptionDecision";
import type { IAutoMovieExternalModelInspection } from "./IAutoMovieExternalModelInspection";
import type { IAutoMovieExternalMotionAdoption } from "./IAutoMovieExternalMotionAdoption";
import type { IAutoMovieExternalMotionBoneMapping } from "./IAutoMovieExternalMotionBoneMapping";
import type { IAutoMovieExternalMotionInspection } from "./IAutoMovieExternalMotionInspection";
import type { IAutoMovieExternalMotionNativeHandoff } from "./IAutoMovieExternalMotionNativeHandoff";
import type { IAutoMovieExternalMotionNodeInspection } from "./IAutoMovieExternalMotionNodeInspection";
import type { IAutoMovieExternalMotionRetargetDecision } from "./IAutoMovieExternalMotionRetargetDecision";
import type { IAutoMovieExternalMotionRetargetHandoff } from "./IAutoMovieExternalMotionRetargetHandoff";
import type { IAutoMovieExternalMotionSource } from "./IAutoMovieExternalMotionSource";
import { compareCodeUnits } from "./internal/compareCodeUnits";
import { composeLocalTransform } from "./internal/composeLocalTransform";

/**
 * Select one inspected take and validate the author's native or retarget decision without fetching bytes, choosing a provider or inferring a rig.
 *
 * The inspection must come from the `gltf-motion-v1` profile under the glTF meter, right-handed, Y-up interpretation, and the source must repeat its path and byte length with a lowercase SHA-256 digest. Every track of the selected take must target a mapped node, translation only on the node mapped to `hips`, and never scale or weights, because humanoid motion carries neither. Each mapped bone's parent and rest in the declared source rig must equal what the inspected hierarchy implies: the nearest mapped ancestor and the node's local TRS composed through every unmapped helper between them. The comparison is exact, so an author computes the rest from the inspected transforms rather than retyping rounded values. The first violation throws with the field it concerns.
 *
 * The caller supplies an unmodified inspector result and binds the digest to the resident bytes; adoption checks digest spelling, not a hash. Rig admission here requires a non-blank id, unique bone names and `hips`, but basis comparisons cover only mapped bones and do not validate constraints or unmapped rests. Helper TRS composition follows fixed floating-point arithmetic and drops shear when a helper's non-uniform scale does not commute with a child rotation; exact agreement proves agreement with that representation, not exact affine geometry.
 *
 * @param props.inspection Inspection of the exact source bytes.
 * @param props.source Manifest identity of those bytes.
 * @param props.decision The author's use of one take.
 * @returns A receipt that shares no objects with its inputs.
 *
 * @evidence contracts/common.md#principled-implementation Path and byte length compare with caller-supplied inspected facts, while the digest is checked only for spelling. Sets establish mapping uniqueness, and each mapped basis is recomputed by nearest-mapped-ancestor walks and fixed-order `composeLocalTransform` arithmetic; binary64 rounding and discarded shear remain, and constraints and unmapped rests receive no basis check.
 * @evidence contracts/common.md#clear-and-simple-design Identity/selection, rig binding and retarget-only fields have separate local owners; humanoid import shares transform composition and the engine validation owner supplies the common SHA-256 spelling predicate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No take, rig, bone or path is special-cased; the runtime mode check exists for untyped callers, and the digest regular expression is the manifest's documented `sha256:` format rather than a fixture value.
 * @evidence contracts/common.md#meaningful-documentation The documentation distinguishes digest spelling from byte authentication, mapped-basis checks from complete rig admission, and exact arithmetic agreement from affine exactness; it also gives supported channels, first-refusal behavior and ownership of receipt copies.
 * @evidence contracts/performance.md#efficient-algorithms Copy cost follows the selected take's tracks/keyframes and source-rig size; hash-map setup follows the mapping and node counts. Mapping size M adds O(M log M) prefix-scanning node-id comparisons plus text-dependent identity/hash work; mapped bones times helper-chain lengths drive basis walks, and take lookup scans the declared take inventory without an assumed population bound.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Adoption validates one decision against one inspection per call and shares no work across calls; the inspection it reads is already the caller's reused result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary maps and sets die with the call; the receipt retains copies of the take, rig and mapping proportional to their size and is owned by the caller, with no handle or task.
 * @author Samchon
 */
export const adoptAutoMovieExternalMotion: (props: {
  /** Unmodified result of inspecting the source's exact resident bytes. */
  inspection: IAutoMovieExternalModelInspection;

  /** Manifest identity whose digest-to-byte binding the caller establishes. */
  source: IAutoMovieExternalMotionSource;

  /** Explicit take, rig and mapping, with retarget fields in retarget mode. */
  decision: AutoMovieExternalMotionAdoptionDecision;
}) => IAutoMovieExternalMotionAdoption = (props: {
  /** Unmodified result of inspecting the source's exact resident bytes. */
  inspection: IAutoMovieExternalModelInspection;

  /** Manifest identity whose digest-to-byte binding the caller establishes. */
  source: IAutoMovieExternalMotionSource;

  /** Explicit take, rig and mapping, with retarget fields in retarget mode. */
  decision: AutoMovieExternalMotionAdoptionDecision;
}): IAutoMovieExternalMotionAdoption => {
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
  if (SHA256_DIGEST_PATTERN.test(props.source.digest) === false)
    throw new Error(
      `External motion source digest "${props.source.digest}" must be a lowercase SHA-256 digest.`,
    );
  const decision: AutoMovieExternalMotionAdoptionDecision = props.decision;
  if (decision.mode !== "native" && decision.mode !== "retarget")
    throw new Error(
      `Unsupported external motion adoption mode "${String((decision as { mode: unknown }).mode)}".`,
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
};

const validateMotionBinding: (props: {
  decision: AutoMovieExternalMotionAdoptionDecision;
  take: IAutoMovieClip;
  nodes: IAutoMovieExternalMotionNodeInspection[];
}) => Pick<
  IAutoMovieExternalMotionNativeHandoff,
  "sourceRig" | "mapping"
> = (props: {
  decision: AutoMovieExternalMotionAdoptionDecision;
  take: IAutoMovieClip;
  nodes: IAutoMovieExternalMotionNodeInspection[];
}): Pick<IAutoMovieExternalMotionNativeHandoff, "sourceRig" | "mapping"> => {
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

  const mapping: IAutoMovieExternalMotionBoneMapping[] = props.decision.mapping;
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
          entry: IAutoMovieExternalMotionBoneMapping,
        ): IAutoMovieExternalMotionBoneMapping => ({ ...entry }),
      )
      .sort(
        (
          left: IAutoMovieExternalMotionBoneMapping,
          right: IAutoMovieExternalMotionBoneMapping,
        ): number => compareCodeUnits(left.node, right.node),
      ),
  };
};

/** The parent and rest a mapped node implies: walk to the nearest mapped ancestor, then fold every unmapped helper's TRS into the node's own, nearest helper first. A node without a mapped ancestor keeps its local TRS. */
const inspectedBoneBasis: (
  node: IAutoMovieExternalMotionNodeInspection,
  nodes: Map<string, IAutoMovieExternalMotionNodeInspection>,
  nodeToBone: Map<string, AutoMovieHumanoidBone>,
) => { parent: AutoMovieHumanoidBone | null; rest: IAutoMovieTransform } = (
  node: IAutoMovieExternalMotionNodeInspection,
  nodes: Map<string, IAutoMovieExternalMotionNodeInspection>,
  nodeToBone: Map<string, AutoMovieHumanoidBone>,
): { parent: AutoMovieHumanoidBone | null; rest: IAutoMovieTransform } => {
  const helpers: IAutoMovieExternalMotionNodeInspection[] = [];
  let parentId: string | null = node.parent;
  while (parentId !== null) {
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
};

const assertTransformMatches: (
  bone: AutoMovieHumanoidBone,
  actual: IAutoMovieTransform,
  expected: IAutoMovieTransform,
) => void = (
  bone: AutoMovieHumanoidBone,
  actual: IAutoMovieTransform,
  expected: IAutoMovieTransform,
): void => {
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
};

const validateRetargetDecision: (
  decision: IAutoMovieExternalMotionRetargetDecision,
) => Pick<
  IAutoMovieExternalMotionRetargetHandoff,
  "target" | "translationScale"
> = (
  decision: IAutoMovieExternalMotionRetargetDecision,
): Pick<
  IAutoMovieExternalMotionRetargetHandoff,
  "target" | "translationScale"
> => {
  if (decision.target.trim().length === 0)
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
};

const cloneClip: (clip: IAutoMovieClip) => IAutoMovieClip = (
  clip: IAutoMovieClip,
): IAutoMovieClip => ({
  ...clip,
  tracks: clip.tracks.map(
    (track: IAutoMovieTrack): IAutoMovieTrack => ({
      ...track,
      channel: { ...track.channel },
      times: [...track.times],
      values: [...track.values],
    }),
  ),
});
const cloneSkeleton: (skeleton: IAutoMovieSkeleton) => IAutoMovieSkeleton = (
  skeleton: IAutoMovieSkeleton,
): IAutoMovieSkeleton => ({
  id: skeleton.id,
  bones: skeleton.bones.map(
    (bone: IAutoMovieBone): IAutoMovieBone => ({
      ...bone,
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
});
