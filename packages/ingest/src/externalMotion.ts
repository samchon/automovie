import type {
  AutoMovieContentDigest,
  AutoMovieHumanoidBone,
  IAutoMovieClip,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";

import {
  AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE,
  type IAutoMovieExternalModelInspection,
  type IAutoMovieExternalMotionNodeInspection,
} from "./inspectExternalModelBytes";

/**
 * Manifest-owned identity of the exact external motion bytes selected by the
 * author.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionSource {
  /** Exact manifest path inspected by ingest. */
  path: string;
  /** Lowercase SHA-256 digest pinned by the production manifest. */
  digest: AutoMovieContentDigest;
  /** Resident byte count cross-checked against the inspection. */
  byteLength: number;
}

/**
 * Author-selected node-to-humanoid correspondence for one source rig.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionBoneMapping {
  /** Stable node identity emitted by the byte inspector. */
  node: string;
  /** Explicit semantic role on the declared source rig. */
  bone: AutoMovieHumanoidBone;
}

/** Deliberate use mode for one selected external take. */
export type AutoMovieExternalMotionAdoptionDecision =
  | IAutoMovieExternalMotionNativeDecision
  | IAutoMovieExternalMotionRetargetDecision;

/**
 * Native use keeps the inspected node tracks and performs no rig inference.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionNativeDecision {
  /** Explicit mode discriminator. */
  mode: "native";
  /** Stable inspected take id selected by the author. */
  take: string;
  /**
   * Semantic source skeleton whose mapped hierarchy and rest reproduce the
   * inspected node facts.
   */
  sourceRig: IAutoMovieSkeleton;
  /**
   * Explicit track-node to source-bone mapping; ingest never name-matches it.
   */
  mapping: IAutoMovieExternalMotionBoneMapping[];
}

/**
 * Retarget use supplies the source rig, semantic mapping, and target identity
 * without guessing any of them inside ingest.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionRetargetDecision {
  /** Explicit mode discriminator. */
  mode: "retarget";
  /** Stable inspected take id selected by the author. */
  take: string;
  /**
   * Semantic source skeleton whose mapped hierarchy and rest reproduce the
   * inspected node facts.
   */
  sourceRig: IAutoMovieSkeleton;
  /**
   * Explicit track-node to source-bone mapping; ingest never name-matches it.
   */
  mapping: IAutoMovieExternalMotionBoneMapping[];
  /** Explicit multiplier for source root translation during retargeting. */
  translationScale: number;
  /** Stable target rig or actor identity to resolve after ingest. */
  target: string;
}

/**
 * Inspection-to-builder handoff for a requested native node-track conversion.
 * The builder still decides whether interpolation and channel completeness can
 * be represented as clinical motion.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionNativeHandoff {
  /** Explicit mode discriminator. */
  mode: "native";
  /** Byte-grounded source skeleton, defensively copied for the handoff. */
  sourceRig: IAutoMovieSkeleton;
  /** Canonically ordered explicit node-to-bone correspondence. */
  mapping: IAutoMovieExternalMotionBoneMapping[];
}

/**
 * Inspection-to-builder handoff for a requested engine-owned retarget
 * operation. Source conversion and source-target compatibility remain explicit
 * downstream validation boundaries.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionRetargetHandoff {
  /** Explicit mode discriminator. */
  mode: "retarget";
  /** Byte-grounded source skeleton, defensively copied for the handoff. */
  sourceRig: IAutoMovieSkeleton;
  /** Canonically ordered explicit node-to-bone correspondence. */
  mapping: IAutoMovieExternalMotionBoneMapping[];
  /** Validated finite-positive root translation multiplier. */
  translationScale: number;
  /** Target identity selected by the author and resolved by the builder. */
  target: string;
}

/**
 * Non-destructive result connecting one byte-pinned take to native playback or
 * a later engine retarget pass.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionAdoption {
  /** Byte identity retained in the adoption receipt. */
  source: IAutoMovieExternalMotionSource;
  /** Chosen native or retarget mode. */
  mode: AutoMovieExternalMotionAdoptionDecision["mode"];
  /** Selected take with source-order tracks and canonical numeric samples. */
  take: IAutoMovieClip;
  /** Explicit native-conversion or retarget inputs. */
  handoff:
    | IAutoMovieExternalMotionNativeHandoff
    | IAutoMovieExternalMotionRetargetHandoff;
}

/**
 * Select one inspected take and validate the author's native-use or retarget
 * decision without fetching bytes, choosing a provider, or inferring a rig.
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
  const motion = props.inspection.motion;
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
  const selected = motion.takes.find((take) => take.id === props.decision.take);
  if (selected === undefined)
    throw new Error(
      `External motion take "${props.decision.take}" is not present in the inspected source.`,
    );
  const source = { ...props.source };
  const take = cloneClip(selected);
  if (props.decision.mode !== "native" && props.decision.mode !== "retarget")
    throw new Error(
      `Unsupported external motion adoption mode "${String((props.decision as { mode: unknown }).mode)}".`,
    );
  const binding = validateMotionBinding({
    decision: props.decision,
    take,
    nodes: motion.nodes,
  });
  if (props.decision.mode === "native")
    return {
      source,
      mode: "native",
      take,
      handoff: { mode: "native", ...binding },
    };
  const retarget = validateRetargetDecision(props.decision);
  return {
    source,
    mode: "retarget",
    take,
    handoff: { mode: "retarget", ...binding, ...retarget },
  };
};

const validateMotionBinding = (props: {
  decision:
    | IAutoMovieExternalMotionNativeDecision
    | IAutoMovieExternalMotionRetargetDecision;
  take: IAutoMovieClip;
  nodes: IAutoMovieExternalMotionNodeInspection[];
}): Pick<IAutoMovieExternalMotionNativeHandoff, "sourceRig" | "mapping"> => {
  if (props.decision.sourceRig.id.trim().length === 0)
    throw new Error("External motion source rig id must be non-blank.");
  if (props.decision.sourceRig.bones.length === 0)
    throw new Error("External motion source rig has no bones.");

  const sourceBones = new Set<AutoMovieHumanoidBone>();
  for (const bone of props.decision.sourceRig.bones) {
    if (sourceBones.has(bone.bone))
      throw new Error(
        `External motion source rig duplicates bone "${bone.bone}".`,
      );
    sourceBones.add(bone.bone);
  }
  if (sourceBones.has("hips") === false)
    throw new Error(
      'External motion source rig is missing required bone "hips".',
    );

  if (props.decision.mapping.length === 0)
    throw new Error("External motion semantic mapping must not be empty.");
  const availableNodes = new Map(props.nodes.map((node) => [node.id, node]));
  const nodeToBone = new Map<string, AutoMovieHumanoidBone>();
  const mappedBones = new Set<AutoMovieHumanoidBone>();
  for (const mapping of props.decision.mapping) {
    if (availableNodes.has(mapping.node) === false)
      throw new Error(
        `External motion mapping node "${mapping.node}" is not present in the inspected source.`,
      );
    if (sourceBones.has(mapping.bone) === false)
      throw new Error(
        `External motion mapping bone "${mapping.bone}" is absent from source rig "${props.decision.sourceRig.id}".`,
      );
    if (nodeToBone.has(mapping.node))
      throw new Error(
        `External motion mapping duplicates node "${mapping.node}".`,
      );
    if (mappedBones.has(mapping.bone))
      throw new Error(
        `External motion mapping duplicates bone "${mapping.bone}".`,
      );
    nodeToBone.set(mapping.node, mapping.bone);
    mappedBones.add(mapping.bone);
  }
  for (const track of props.take.tracks) {
    if (track.channel.kind !== "node")
      throw new Error(
        "External motion semantic conversion supports only node tracks.",
      );
    const bone = nodeToBone.get(track.channel.node);
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
  validateSourceRigBasis({
    sourceRig: props.decision.sourceRig,
    mapping: props.decision.mapping,
    nodes: availableNodes,
    nodeToBone,
  });
  return {
    sourceRig: cloneSkeleton(props.decision.sourceRig),
    mapping: props.decision.mapping
      .map((entry) => ({ ...entry }))
      .sort((left, right) => compareCodeUnits(left.node, right.node)),
  };
};

const validateSourceRigBasis = (props: {
  sourceRig: IAutoMovieSkeleton;
  mapping: IAutoMovieExternalMotionBoneMapping[];
  nodes: Map<string, IAutoMovieExternalMotionNodeInspection>;
  nodeToBone: Map<string, AutoMovieHumanoidBone>;
}): void => {
  const bones = new Map(props.sourceRig.bones.map((bone) => [bone.bone, bone]));
  for (const mapping of props.mapping) {
    const node = props.nodes.get(mapping.node)!;
    const bone = bones.get(mapping.bone)!;
    const expected = inspectedBoneBasis(node, props.nodes, props.nodeToBone);
    if (bone.parent !== expected.parent)
      throw new Error(
        `External motion source rig bone "${mapping.bone}" parent ${JSON.stringify(bone.parent)} does not match inspected parent ${JSON.stringify(expected.parent)}.`,
      );
    assertTransformMatches(mapping.bone, bone.rest, expected.rest);
  }
};

const inspectedBoneBasis = (
  node: IAutoMovieExternalMotionNodeInspection,
  nodes: Map<string, IAutoMovieExternalMotionNodeInspection>,
  nodeToBone: Map<string, AutoMovieHumanoidBone>,
): { parent: AutoMovieHumanoidBone | null; rest: IAutoMovieTransform } => {
  const helpers: IAutoMovieExternalMotionNodeInspection[] = [];
  let parentId = node.parent;
  while (parentId !== null) {
    const mappedParent = nodeToBone.get(parentId);
    if (mappedParent !== undefined) {
      let rest = cloneTransform(node.transform);
      for (const helper of helpers)
        rest = composeLocalTransform(helper.transform, rest);
      return { parent: mappedParent, rest };
    }
    const parent = nodes.get(parentId)!;
    helpers.push(parent);
    parentId = parent.parent;
  }
  return { parent: null, rest: cloneTransform(node.transform) };
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

const cloneTransform = (
  transform: IAutoMovieTransform,
): IAutoMovieTransform => ({
  translation: { ...transform.translation },
  rotation: { ...transform.rotation },
  scale: { ...transform.scale },
});

const composeLocalTransform = (
  parent: IAutoMovieTransform,
  child: IAutoMovieTransform,
): IAutoMovieTransform => {
  const scaled = {
    x: parent.scale.x * child.translation.x,
    y: parent.scale.y * child.translation.y,
    z: parent.scale.z * child.translation.z,
  };
  const rotated = rotateVector(parent.rotation, scaled);
  return {
    translation: {
      x: parent.translation.x + rotated.x,
      y: parent.translation.y + rotated.y,
      z: parent.translation.z + rotated.z,
    },
    rotation: multiplyQuaternion(parent.rotation, child.rotation),
    scale: {
      x: parent.scale.x * child.scale.x,
      y: parent.scale.y * child.scale.y,
      z: parent.scale.z * child.scale.z,
    },
  };
};

const rotateVector = (
  quaternion: IAutoMovieTransform["rotation"],
  vector: IAutoMovieTransform["translation"],
): IAutoMovieTransform["translation"] => {
  const tx = 2 * (quaternion.y * vector.z - quaternion.z * vector.y);
  const ty = 2 * (quaternion.z * vector.x - quaternion.x * vector.z);
  const tz = 2 * (quaternion.x * vector.y - quaternion.y * vector.x);
  return {
    x: vector.x + quaternion.w * tx + (quaternion.y * tz - quaternion.z * ty),
    y: vector.y + quaternion.w * ty + (quaternion.z * tx - quaternion.x * tz),
    z: vector.z + quaternion.w * tz + (quaternion.x * ty - quaternion.y * tx),
  };
};

const multiplyQuaternion = (
  left: IAutoMovieTransform["rotation"],
  right: IAutoMovieTransform["rotation"],
): IAutoMovieTransform["rotation"] => ({
  x: left.w * right.x + left.x * right.w + left.y * right.z - left.z * right.y,
  y: left.w * right.y - left.x * right.z + left.y * right.w + left.z * right.x,
  z: left.w * right.z + left.x * right.y - left.y * right.x + left.z * right.w,
  w: left.w * right.w - left.x * right.x - left.y * right.y - left.z * right.z,
});

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
  tracks: clip.tracks.map((track) => ({
    ...track,
    channel: { ...track.channel },
    times: [...track.times],
    values: [...track.values],
  })),
});

const cloneSkeleton = (skeleton: IAutoMovieSkeleton): IAutoMovieSkeleton => ({
  id: skeleton.id,
  bones: skeleton.bones.map((bone) => ({
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
  })),
});

const compareCodeUnits = (left: string, right: string): number =>
  Number(left > right) - Number(left < right);

const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/u;
