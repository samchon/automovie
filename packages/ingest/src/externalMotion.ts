import type {
  AutoMovieContentDigest,
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieClip,
  IAutoMovieSkeleton,
  IAutoMovieTrack,
  IAutoMovieTransform,
} from "@automovie/interface";

import { composeLocalTransform } from "./internal/composeLocalTransform";
import {
  AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE,
  type IAutoMovieExternalModelInspection,
  type IAutoMovieExternalMotionInspection,
  type IAutoMovieExternalMotionNodeInspection,
} from "./inspectExternalModelBytes";

/**
 * Manifest-owned identity of the exact external motion bytes the author chose.
 *
 * Adoption checks it against the inspection, so a receipt cannot cite bytes
 * other than the ones inspected.
 *
 * @evidence contracts/common.md#principled-implementation The three fields are the manifest's byte identity, path, content digest and length, which adoption compares with the inspected path and length so a receipt names the bytes that were actually parsed.
 * @evidence contracts/common.md#clear-and-simple-design The identity is its own record because the production inventory builds it from the manifest independently of the inspection, and the adoption copies it unchanged into the receipt.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ingest never hashes the bytes itself; the digest format is checked and the hash stays the manifest's claim, which the documentation does not overstate as verified.
 * @evidence contracts/common.md#meaningful-documentation Each property states the constraint adoption enforces on it: non-blank and equal path, the `sha256:` digest spelling, and a positive safe-integer length equal to the inspection's.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface declares data only; the comparisons that read it run in `adoptAutoMovieExternalMotion`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No computation is attached to the source record, so nothing could be shared.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three scalar fields hold no buffer, handle or task, and the receipt keeps a shallow copy.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionSource {
  /** Manifest path; it must be non-blank and equal the inspected path. */
  path: string;

  /** `sha256:` plus 64 lowercase hex digits, pinned by the production manifest. */
  digest: AutoMovieContentDigest;

  /** Resident byte count; a positive safe integer equal to the inspected one. */
  byteLength: number;
}

/**
 * One author-declared correspondence between an inspected node and a humanoid
 * bone of the source rig.
 *
 * @evidence contracts/common.md#principled-implementation A mapping row pairs an inspector-issued node id with a humanoid slot, so the correspondence is declared by the author against stable ids rather than inferred from node names.
 * @evidence contracts/common.md#clear-and-simple-design One flat pair per mapped node is the minimum that lets both decisions and both handoffs share the same element type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The row carries no alias or fuzzy-match field; adoption refuses an unknown node, a bone the rig lacks, and any repeated node or bone.
 * @evidence contracts/common.md#meaningful-documentation The property comments give the node id form, that it must exist in the inspection, and that each bone and node maps at most once.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A two-field row type declares data and runs no code of its own.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The row is plain data with no work behind it to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Each row is two strings held by its decision or handoff array and owns nothing else.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionBoneMapping {
  /** Inspected node id such as `node_3`; it must exist in the inspection. */
  node: string;

  /** Source-rig bone the node plays; each bone and node maps at most once. */
  bone: AutoMovieHumanoidBone;
}

/**
 * How the author uses one inspected take: replayed on its own rig, or
 * retargeted onto a target rig by the engine later.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `mode` lets TypeScript narrow the retarget-only fields, and adoption checks the discriminant at run time for untyped callers.
 * @evidence contracts/common.md#clear-and-simple-design The alias names the two supported uses in one place so adoption's parameter and the receipt's `mode` field derive from it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the two declared modes exist; adoption throws on any other discriminant instead of defaulting to native playback.
 * @evidence contracts/common.md#meaningful-documentation The comment states what each arm means for the take: replay on its own rig or a later engine retarget.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A union alias has no runtime code.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The decision alias only names two record shapes and performs no work to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The alias exists only at compile time, so it allocates and retains nothing at run time.
 * @author Samchon
 */
export type AutoMovieExternalMotionAdoptionDecision =
  | IAutoMovieExternalMotionNativeDecision
  | IAutoMovieExternalMotionRetargetDecision;

/**
 * Native use replays the inspected node tracks on the source rig the author
 * declares; ingest infers no rig and matches no names.
 *
 * @evidence contracts/common.md#principled-implementation Native use needs only the take, the author's source rig and the mapping, because the tracks replay on the rig the bytes describe and nothing is converted between skeletons.
 * @evidence contracts/common.md#clear-and-simple-design The native arm repeats the three shared fields rather than extending a base type, keeping each arm readable on its own at the cost of three duplicated property declarations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rig is not trusted blindly: adoption recomputes each mapped bone's parent and rest from the inspected nodes and requires exact equality.
 * @evidence contracts/common.md#meaningful-documentation The property comments state the take id form, the rig's id, uniqueness, hips and exact-basis requirements, and that the mapping must cover every animated node.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The decision is input data; validation cost is counted on `adoptAutoMovieExternalMotion`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No work is attached to the decision record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the decision; adoption deep-copies what it keeps, so the record's lifetime is the caller's.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionNativeDecision {
  /** Mode discriminator. */
  mode: "native";

  /** Inspected take id such as `clip_0`. */
  take: string;

  /**
   * Source skeleton with a non-blank id, unique bones including `hips`, and,
   * for every mapped bone, the parent and rest the inspected hierarchy implies
   * with exact number equality.
   */
  sourceRig: IAutoMovieSkeleton;

  /**
   * Non-empty node-to-bone mapping that covers every node the take animates;
   * ingest never derives it from names.
   */
  mapping: IAutoMovieExternalMotionBoneMapping[];
}

/**
 * Retarget use declares the source rig, the mapping and the target identity,
 * so the engine pass that later retargets the take guesses none of them.
 *
 * @evidence contracts/common.md#principled-implementation Retargeting additionally needs a root translation multiplier and a target identity, the two inputs a skeleton-to-skeleton transfer cannot derive from the source bytes.
 * @evidence contracts/common.md#clear-and-simple-design The retarget arm is the native arm plus exactly those two fields, so the union's narrowing exposes them only where they apply.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ingest validates the multiplier and target spelling but never resolves the target or picks a default scale, leaving both explicit for the engine pass.
 * @evidence contracts/common.md#meaningful-documentation The added properties state the finite-positive range of the multiplier and that the target is resolved after ingest.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record is caller input with no code of its own.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No computation hangs off the retarget record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller keeps ownership; the handoff copies its two scalars and deep-copies the rig.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionRetargetDecision {
  /** Mode discriminator. */
  mode: "retarget";

  /** Inspected take id such as `clip_0`. */
  take: string;

  /**
   * Source skeleton with a non-blank id, unique bones including `hips`, and,
   * for every mapped bone, the parent and rest the inspected hierarchy implies
   * with exact number equality.
   */
  sourceRig: IAutoMovieSkeleton;

  /**
   * Non-empty node-to-bone mapping that covers every node the take animates;
   * ingest never derives it from names.
   */
  mapping: IAutoMovieExternalMotionBoneMapping[];

  /** Multiplier for source root translation; finite and positive. */
  translationScale: number;

  /** Non-blank target rig or actor identity, resolved after ingest. */
  target: string;
}

/**
 * Validated inputs a native adoption hands to the motion builder, which still
 * decides whether the take's interpolation and channel coverage can become
 * clinical motion.
 *
 * @evidence contracts/common.md#principled-implementation The handoff carries the validated rig and a node-sorted mapping, a canonical order that makes two receipts for the same decision compare equal regardless of the author's row order.
 * @evidence contracts/common.md#clear-and-simple-design A separate handoff type keeps the builder's input apart from the author's decision, so the builder never sees the unvalidated take id field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The handoff states that interpolation and channel coverage remain the builder's decision instead of claiming ingest proved the take convertible.
 * @evidence contracts/common.md#meaningful-documentation The comments state that the rig is a deep copy and that the mapping is sorted by node id in code-unit order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface only shapes adoption output; its construction cost is counted on adoption.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No work is performed by the type itself.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The handoff holds copies owned by the receipt; it shares no storage with the decision.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionNativeHandoff {
  /** Mode discriminator. */
  mode: "native";

  /** Deep copy of the decision's source rig, sharing nothing with it. */
  sourceRig: IAutoMovieSkeleton;

  /** Copy of the decision's mapping sorted by node id in code-unit order. */
  mapping: IAutoMovieExternalMotionBoneMapping[];
}

/**
 * Validated inputs a retarget adoption hands to the engine-owned retarget
 * pass; source conversion and source-target compatibility are checked there.
 *
 * @evidence contracts/common.md#principled-implementation Besides the copied rig and sorted mapping, the retarget handoff forwards the validated multiplier and target unchanged, which is all the engine retarget pass needs from ingest.
 * @evidence contracts/common.md#clear-and-simple-design Its fields mirror the retarget decision minus the take id, so the receipt's take field is the single place the selected clip lives.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The documentation keeps source conversion and source-target compatibility as downstream checks rather than implying ingest performed them.
 * @evidence contracts/common.md#meaningful-documentation The property comments say which values were checked, finite-positive scale and non-blank target, and that the target is not resolved here.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The retarget handoff is a data-only record that executes no code.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The retarget handoff coordinates no work between requests or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two scalars plus copies owned by the receipt; no handle or task.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionRetargetHandoff {
  /** Mode discriminator. */
  mode: "retarget";

  /** Deep copy of the decision's source rig, sharing nothing with it. */
  sourceRig: IAutoMovieSkeleton;

  /** Copy of the decision's mapping sorted by node id in code-unit order. */
  mapping: IAutoMovieExternalMotionBoneMapping[];

  /** The decision's multiplier, checked finite and positive. */
  translationScale: number;

  /** The decision's target identity, checked non-blank but not resolved. */
  target: string;
}

/**
 * Receipt connecting one byte-pinned take to native playback or a later engine
 * retarget pass. It copies everything it holds, so mutating it never changes
 * the inspection or the decision it came from.
 *
 * @evidence contracts/common.md#principled-implementation The receipt pairs the byte identity with a deep copy of the chosen take and its handoff, so later stages work from a snapshot that mutation of the inspection or decision cannot alter.
 * @evidence contracts/common.md#clear-and-simple-design `mode` repeats `handoff.mode` at the top level so the production inventory can branch on the receipt without opening the handoff.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The receipt adds no inferred data: every field is either a copy of a validated input or the selected inspected take.
 * @evidence contracts/common.md#meaningful-documentation The comments state that every member is a copy, that the take keeps source track order, and which consumer each handoff arm feeds.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The receipt is the result type of adoption and runs no code.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No work is attached to the receipt.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The receipt owns its copies and is retained by its caller; the cost of building it is counted on `adoptAutoMovieExternalMotion`.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionAdoption {
  /** Copy of the source identity that was checked against the inspection. */
  source: IAutoMovieExternalMotionSource;

  /** The decision's mode, repeated by `handoff.mode`. */
  mode: AutoMovieExternalMotionAdoptionDecision["mode"];

  /** Deep copy of the selected take with its tracks in source order. */
  take: IAutoMovieClip;

  /** Mode-specific inputs for the builder or the retarget pass. */
  handoff:
    | IAutoMovieExternalMotionNativeHandoff
    | IAutoMovieExternalMotionRetargetHandoff;
}

/**
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
 * local TRS composed through every unmapped helper between them. The
 * comparison is exact, so an author computes the rest from the inspected
 * transforms rather than retyping rounded values. The first violation throws
 * with the field it concerns.
 *
 * @param props.inspection Inspection of the exact source bytes.
 * @param props.source Manifest identity of those bytes.
 * @param props.decision The author's use of one take.
 * @returns A receipt that shares no objects with its inputs.
 *
 * @evidence contracts/common.md#principled-implementation Each check compares the decision with inspected facts: identity fields by equality, mapping uniqueness with sets, and each mapped bone's basis by walking to the nearest mapped ancestor and composing helper TRS with the shared `composeLocalTransform`, whose fixed arithmetic order makes the exact equality comparison reproducible.
 * @evidence contracts/common.md#clear-and-simple-design The exported function checks identity and selection, `validateMotionBinding` checks rig, mapping and tracks, and `validateRetargetDecision` checks the retarget-only fields; transform composition lives in the internal module humanoid import also uses instead of a second copy here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No take, rig, bone or path is special-cased; the runtime mode check exists for untyped callers, and the digest regular expression is the manifest's documented `sha256:` format rather than a fixture value.
 * @evidence contracts/common.md#meaningful-documentation The documentation lists every requirement in checking order, the translation-only-on-hips and no-scale-or-weights rules with their reason, the exact basis comparison and how an author satisfies it, and that the receipt shares nothing with its inputs.
 * @evidence contracts/performance.md#efficient-algorithms Cost is linear in the take's tracks and keyframes for the copy, the mapping and node count for the hash maps, and the mapped bones times their helper chain length for the basis walk; the take lookup is a linear scan over the few takes one source holds.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Adoption validates one decision against one inspection per call and shares no work across calls; the inspection it reads is already the caller's reused result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary maps and sets die with the call; the receipt retains copies of the take, rig and mapping proportional to their size and is owned by the caller, with no handle or task.
 * @author Samchon
 */
export const adoptAutoMovieExternalMotion = (props: {
  inspection: IAutoMovieExternalModelInspection;
  source: IAutoMovieExternalMotionSource;
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
  if (DIGEST_PATTERN.test(props.source.digest) === false)
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

const validateMotionBinding = (props: {
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

/**
 * The parent and rest a mapped node implies: walk to the nearest mapped
 * ancestor, then fold every unmapped helper's TRS into the node's own, nearest
 * helper first. A node without a mapped ancestor keeps its local TRS.
 */
const inspectedBoneBasis = (
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
    const parent: IAutoMovieExternalMotionNodeInspection =
      nodes.get(parentId)!;
    helpers.push(parent);
    parentId = parent.parent;
  }
  return { parent: null, rest: node.transform };
};

const assertTransformMatches = (
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

const validateRetargetDecision = (
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

const cloneClip = (clip: IAutoMovieClip): IAutoMovieClip => ({
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

const cloneSkeleton = (skeleton: IAutoMovieSkeleton): IAutoMovieSkeleton => ({
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

const compareCodeUnits = (left: string, right: string): number =>
  Number(left > right) - Number(left < right);

const DIGEST_PATTERN: RegExp = /^sha256:[0-9a-f]{64}$/u;
