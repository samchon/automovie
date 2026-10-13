import {
  AutoMovieHumanoidBone,
  IAutoMovieClip,
  IAutoMovieTrack,
  IAutoMovieTransform,
} from "@automovie/interface";

/**
 * One external URI whose exact resident bytes participate in model ingest.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalModelResource {
  /** URI as declared by glTF. */
  uri: string;
  /** Resource role. */
  kind: "buffer" | "image";
  /** Exact declared byte length for buffers; images carry no glTF length. */
  byteLength: number | null;
}

/**
 * Byte-level facts accepted by the external-model builder boundary.
 *
 * This inspection is intentionally synchronous: the production builder owns
 * exact resident bytes and must reject malformed glTF/GLB/VRM before source
 * materialization. Hosts still use their native loader to construct the final
 * render mesh from the same content-addressed asset.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalModelInspection {
  /** Fixed normalization profile applied to these facts. */
  profile: AutoMovieExternalModelIngestProfile;
  /** Parsed container family. */
  format: "gltf" | "glb" | "vrm";
  /** GlTF asset version. */
  version: "2.0";
  /** Declared scene graph inventory. */
  counts: {
    /** Declared node count. */
    nodes: number;
    /** Declared mesh count. */
    meshes: number;
    /** Declared skin count. */
    skins: number;
    /** Declared animation count. */
    animations: number;
  };
  /** Unique extension identities in code-unit order. */
  extensions: string[];
  /** Unique non-data external buffer/image dependencies in URI order. */
  resources: IAutoMovieExternalModelResource[];
  /**
   * Authoritative normalized humanoid mapping proved by the selected profile.
   */
  humanoidBones: Array<{
    /** Normalized humanoid role. */
    bone: AutoMovieHumanoidBone;
    /** Source node index carrying the role. */
    node: number;
    /** Whether validated skin weights visibly use the joint. */
    weighted: boolean;
  }>;
  /** Normalized node-track takes under the explicit motion profile. */
  motion?: IAutoMovieExternalMotionInspection;
}

/** Canonical glTF 2.0 spatial interpretation used by motion inspection. */
export const AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE =
  "gltf-2.0-meter-right-handed-y-up" as const;

/**
 * One source-order node whose local rest basis was read from motion bytes.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionNodeInspection {
  /**
   * Stable source-order node identity used by normalized tracks and mappings.
   */
  id: string;
  /** Exact zero-based node index in the inspected glTF revision. */
  index: number;
  /** Non-empty source display name when one was declared, otherwise null. */
  name: string | null;
  /** Stable immediate parent node identity, or null for a source root. */
  parent: string | null;
  /** Parent-local rest transform under the declared glTF interpretation. */
  transform: IAutoMovieTransform;
}

/**
 * Animation facts normalized from one exact glTF, GLB, or VRM byte revision.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionInspection {
  /** Exact path whose container suffix selected the bounded decoder. */
  path: string;
  /** Resident byte length inspected by the decoder. */
  byteLength: number;
  /** Fixed meter, right-handed, Y-up interpretation of every node and track. */
  interpretation: typeof AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE;
  /** Source-order node identity, hierarchy, and normalized local rest facts. */
  nodes: IAutoMovieExternalMotionNodeInspection[];
  /** Stable node identities available to an explicit source-rig mapping. */
  nodeIds: string[];
  /** Source-order takes rewritten as deterministic AutoMovie node tracks. */
  takes: IAutoMovieClip[];
}

/** Supported fixed normalization profiles at the builder ingest boundary. */
export type AutoMovieExternalModelIngestProfile =
  | "gltf-static-v1"
  | "gltf-humanoid-v1"
  | "gltf-motion-v1"
  | "vrm-humanoid-v1";

const INGEST_PROFILE_REGISTRY = {
  "gltf-static-v1": true,
  "gltf-humanoid-v1": true,
  "gltf-motion-v1": true,
  "vrm-humanoid-v1": true,
} satisfies Record<AutoMovieExternalModelIngestProfile, true>;

/**
 * Every supported ingest profile literal, in declaration order.
 *
 * The object above is pinned to the profile union by `satisfies`, so a literal
 * added to or removed from the type changes this runtime vocabulary in the same
 * edit; a command surface that consults it cannot lag behind the inspector.
 */
export const AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES: readonly AutoMovieExternalModelIngestProfile[] =
  Object.freeze(
    Object.keys(
      INGEST_PROFILE_REGISTRY,
    ) as AutoMovieExternalModelIngestProfile[],
  );

/** Whether an untyped selection names one supported ingest profile. */
export const isAutoMovieExternalModelIngestProfile = (
  value: unknown,
): value is AutoMovieExternalModelIngestProfile =>
  typeof value === "string" && SUPPORTED_PROFILES.has(value);

/**
 * Parse and validate exact external model bytes before compilation.
 *
 * The inspector accepts glTF 2.0 JSON, GLB 2.0, and VRM 0.x/1.x GLB containers,
 * validates scene forests, referenced indices and structural profile promises,
 * and returns every sidecar URI the builder must bind to manifest-owned bytes.
 * It never guesses a profile or repairs malformed input.
 */
export const inspectAutoMovieExternalModelBytes = (props: {
  /** Exact project-relative source path. */
  path: string;
  /** Exact resident container bytes. */
  bytes: Uint8Array;
  /** Caller-selected fixed interpretation profile. */
  profile: string;
  /** Exact sidecar bytes, resolved inside the builder-owned asset namespace. */
  resolveResource?: (uri: string) => Uint8Array | null;
}): IAutoMovieExternalModelInspection => {
  if (!SUPPORTED_PROFILES.has(props.profile))
    throw new Error(
      `Unsupported external-model ingest profile "${props.profile}".`,
    );
  const extension = fileExtension(props.path);
  const parsed =
    extension === ".gltf"
      ? { json: decodeJson(props.bytes), format: "gltf" as const, bin: null }
      : extension === ".glb" || extension === ".vrm"
        ? decodeGlb(props.bytes, extension === ".vrm")
        : (() => {
            throw new Error(
              `External model "${props.path}" must end in .gltf, .glb, or .vrm.`,
            );
          })();
  const document = object(parsed.json, "glTF root");
  const asset = object(document.asset, "glTF asset");
  if (asset.version !== "2.0")
    throw new Error('External models must declare glTF asset.version "2.0".');

  const nodes = optionalArray(document.nodes, "nodes");
  const meshes = optionalArray(document.meshes, "meshes");
  const skins = optionalArray(document.skins, "skins");
  const animations = optionalArray(document.animations, "animations");
  const scenes = optionalArray(document.scenes, "scenes");
  const buffers = optionalArray(document.buffers, "buffers");
  const bufferViews = optionalArray(document.bufferViews, "bufferViews");
  const accessors = optionalArray(document.accessors, "accessors");
  const images = optionalArray(document.images, "images");

  nodes.forEach((value, index) => {
    const node = object(value, `nodes[${index}]`);
    integerIndex(node.mesh, meshes.length, `nodes[${index}].mesh`);
    integerIndex(node.skin, skins.length, `nodes[${index}].skin`);
    integerIndices(node.children, nodes.length, `nodes[${index}].children`);
  });
  const parentByIndex = inspectExternalModelHierarchy(nodes);
  scenes.forEach((value, index) => {
    const path = `scenes[${index}].nodes`;
    const roots = object(value, `scenes[${index}]`).nodes;
    integerIndices(roots, nodes.length, path);
    const seen = new Set<number>();
    optionalArray(roots, path).forEach((entry, rootIndex) => {
      const nodeIndex = entry as number;
      if (seen.has(nodeIndex))
        throw new Error(
          `${path}[${rootIndex}] repeats root node ${nodeIndex}.`,
        );
      if (parentByIndex[nodeIndex] !== undefined)
        throw new Error(
          `${path}[${rootIndex}] references non-root node ${nodeIndex}.`,
        );
      seen.add(nodeIndex);
    });
  });
  integerIndex(document.scene, scenes.length, "scene");
  buffers.forEach((value, index) => {
    const buffer = object(value, `buffers[${index}]`);
    positiveInteger(buffer.byteLength, `buffers[${index}].byteLength`);
    if (parsed.format === "gltf" && buffer.uri === undefined)
      throw new Error(
        `buffers[${index}].uri is required by a JSON glTF container.`,
      );
  });
  meshes.forEach((value, meshIndex) => {
    const mesh = object(value, `meshes[${meshIndex}]`);
    const primitives = requiredArray(
      mesh.primitives,
      `meshes[${meshIndex}].primitives`,
    );
    if (primitives.length === 0)
      throw new Error(`meshes[${meshIndex}] has no render primitive.`);
    primitives.forEach((primitiveValue, primitiveIndex) => {
      const primitive = object(
        primitiveValue,
        `meshes[${meshIndex}].primitives[${primitiveIndex}]`,
      );
      const attributes = object(
        primitive.attributes,
        `meshes[${meshIndex}].primitives[${primitiveIndex}].attributes`,
      );
      integerIndex(
        attributes.POSITION,
        accessors.length,
        `meshes[${meshIndex}].primitives[${primitiveIndex}].attributes.POSITION`,
        true,
      );
      integerIndex(
        primitive.indices,
        accessors.length,
        `meshes[${meshIndex}].primitives[${primitiveIndex}].indices`,
      );
    });
  });
  skins.forEach((value, index) => {
    const skin = object(value, `skins[${index}]`);
    const joints = requiredArray(skin.joints, `skins[${index}].joints`);
    if (joints.length === 0) throw new Error(`skins[${index}] has no joints.`);
    integerIndices(joints, nodes.length, `skins[${index}].joints`);
  });
  bufferViews.forEach((value, index) => {
    const view = object(value, `bufferViews[${index}]`);
    integerIndex(
      view.buffer,
      buffers.length,
      `bufferViews[${index}].buffer`,
      true,
    );
    positiveInteger(view.byteLength, `bufferViews[${index}].byteLength`);
    nonNegativeInteger(
      view.byteOffset ?? 0,
      `bufferViews[${index}].byteOffset`,
    );
    if (
      view.byteStride !== undefined &&
      (typeof view.byteStride !== "number" ||
        Number.isSafeInteger(view.byteStride) === false ||
        view.byteStride < 4 ||
        view.byteStride > 252 ||
        view.byteStride % 4 !== 0)
    )
      throw new Error(
        `bufferViews[${index}].byteStride must be a 4-byte-aligned integer from 4 through 252.`,
      );
  });
  accessors.forEach((value, index) => {
    const accessor = object(value, `accessors[${index}]`);
    integerIndex(
      accessor.bufferView,
      bufferViews.length,
      `accessors[${index}].bufferView`,
    );
    positiveInteger(accessor.count, `accessors[${index}].count`);
    nonNegativeInteger(
      accessor.byteOffset ?? 0,
      `accessors[${index}].byteOffset`,
    );
    if (
      typeof accessor.componentType !== "number" ||
      [5120, 5121, 5122, 5123, 5125, 5126].includes(accessor.componentType) ===
        false ||
      typeof accessor.type !== "string" ||
      ["SCALAR", "VEC2", "VEC3", "VEC4", "MAT2", "MAT3", "MAT4"].includes(
        accessor.type,
      ) === false
    )
      throw new Error(
        `accessors[${index}] has an unsupported componentType or shape.`,
      );
    validateAccessorRange(accessor, index, bufferViews);
    validateSparseAccessor(accessor, index, bufferViews);
  });
  images.forEach((value, index) => {
    const image = object(value, `images[${index}]`);
    if (image.uri === undefined)
      integerIndex(
        image.bufferView,
        bufferViews.length,
        `images[${index}].bufferView`,
        true,
      );
  });

  const extensions = uniqueStrings([
    ...optionalStringArray(document.extensionsUsed, "extensionsUsed"),
    ...Object.keys(optionalObject(document.extensions, "extensions")),
  ]);
  const resources = collectExternalResources(buffers, images);
  const payloads = validatePayloadClosure({
    format: parsed.format,
    bin: parsed.bin,
    buffers,
    bufferViews,
    images,
    resolveResource: props.resolveResource,
  });
  const motion =
    props.profile === "gltf-motion-v1"
      ? inspectExternalMotion({
          path: props.path,
          byteLength: props.bytes.byteLength,
          animations,
          nodes,
          parentByIndex,
          accessors,
          bufferViews,
          payloads,
        })
      : undefined;
  if (props.profile === "gltf-motion-v1" && motion === undefined)
    throw new Error(
      'Profile "gltf-motion-v1" requires at least one animation.',
    );
  if (props.profile !== "gltf-motion-v1" && meshes.length === 0)
    throw new Error("External model has no mesh to render or review.");
  const humanoidMapping =
    props.profile === "gltf-humanoid-v1"
      ? gltfHumanoidBones(nodes, skins)
      : props.profile === "vrm-humanoid-v1"
        ? vrmHumanoidBones(document, nodes)
        : [];
  if (
    props.profile === "gltf-humanoid-v1" &&
    (skins.length === 0 ||
      humanoidMapping.some((bone) => bone.bone === "hips") === false)
  )
    throw new Error(
      'Profile "gltf-humanoid-v1" requires a skin and a normalized hips/pelvis joint.',
    );
  const weightedNodes =
    props.profile === "gltf-static-v1" || props.profile === "gltf-motion-v1"
      ? new Set<number>()
      : validateHumanoidSkinning({
          nodes,
          meshes,
          skins,
          accessors,
          bufferViews,
          payloads,
        });
  const humanoidBones = humanoidMapping.map((mapping) => ({
    ...mapping,
    weighted: weightedNodes.has(mapping.node),
  }));
  if (
    props.profile === "vrm-humanoid-v1" &&
    (parsed.format === "gltf" ||
      extensions.some((name) => name === "VRM" || name === "VRMC_vrm") ===
        false ||
      skins.length === 0 ||
      humanoidBones.some((bone) => bone.bone === "hips") === false)
  )
    throw new Error(
      'Profile "vrm-humanoid-v1" requires a GLB/VRM container with VRM or VRMC_vrm metadata.',
    );

  return {
    profile: props.profile as AutoMovieExternalModelIngestProfile,
    format: extensions.some((name) => name === "VRM" || name === "VRMC_vrm")
      ? "vrm"
      : parsed.format,
    version: "2.0",
    counts: {
      nodes: nodes.length,
      meshes: meshes.length,
      skins: skins.length,
      animations: animations.length,
    },
    extensions,
    resources,
    humanoidBones,
    ...(motion === undefined ? {} : { motion }),
  };
};

const SUPPORTED_PROFILES: ReadonlySet<string> = new Set<string>(
  AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES,
);

const inspectExternalMotion = (props: {
  path: string;
  byteLength: number;
  animations: unknown[];
  nodes: unknown[];
  parentByIndex: readonly (number | undefined)[];
  accessors: unknown[];
  bufferViews: unknown[];
  payloads: Uint8Array[];
}): IAutoMovieExternalMotionInspection | undefined => {
  if (props.animations.length === 0) return undefined;
  const nodes = inspectExternalMotionNodes(props.nodes, props.parentByIndex);
  const nodeIds = nodes.map((node) => node.id);
  const takes = props.animations.map((value, animationIndex) => {
    const animation = object(value, `animations[${animationIndex}]`);
    const samplers = requiredArray(
      animation.samplers,
      `animations[${animationIndex}].samplers`,
    );
    const channels = requiredArray(
      animation.channels,
      `animations[${animationIndex}].channels`,
    );
    if (samplers.length === 0 || channels.length === 0)
      throw new Error(
        `animations[${animationIndex}] needs at least one sampler and channel.`,
      );
    const targets = new Set<string>();
    const tracks = channels.map((value, channelIndex): IAutoMovieTrack => {
      const channelPath = `animations[${animationIndex}].channels[${channelIndex}]`;
      const channel = object(value, channelPath);
      integerIndex(
        channel.sampler,
        samplers.length,
        `${channelPath}.sampler`,
        true,
      );
      const target = object(channel.target, `${channelPath}.target`);
      integerIndex(
        target.node,
        props.nodes.length,
        `${channelPath}.target.node`,
        true,
      );
      if (
        typeof target.path !== "string" ||
        MOTION_TARGET_PATHS.has(target.path) === false
      )
        throw new Error(
          `${channelPath}.target.path must be translation, rotation, scale, or weights.`,
        );
      const targetKey = `${String(target.node)}\u0000${target.path}`;
      if (targets.has(targetKey))
        throw new Error(
          `${channelPath} duplicates the ${target.path} channel for node ${String(target.node)}.`,
        );
      targets.add(targetKey);

      const samplerPath = `animations[${animationIndex}].samplers[${String(channel.sampler)}]`;
      const sampler = object(samplers[channel.sampler as number], samplerPath);
      integerIndex(
        sampler.input,
        props.accessors.length,
        `${samplerPath}.input`,
        true,
      );
      integerIndex(
        sampler.output,
        props.accessors.length,
        `${samplerPath}.output`,
        true,
      );
      const interpolation = motionInterpolation(
        sampler.interpolation,
        `${samplerPath}.interpolation`,
      );
      const times = readMotionAccessor({
        ...props,
        accessorIndex: sampler.input as number,
        expectedType: "SCALAR",
        path: `${samplerPath}.input`,
      });
      const outputType =
        target.path === "rotation"
          ? "VEC4"
          : target.path === "weights"
            ? "SCALAR"
            : "VEC3";
      const values = readMotionAccessor({
        ...props,
        accessorIndex: sampler.output as number,
        expectedType: outputType,
        path: `${samplerPath}.output`,
      });
      validateMotionTimes(times, `${samplerPath}.input`);
      validateMotionOutput({
        path: `${samplerPath}.output`,
        targetPath: target.path as AutoMovieMotionTargetPath,
        interpolation,
        keyframes: times.length,
        values,
      });
      return {
        channel: {
          kind: "node",
          node: nodeIds[target.node as number]!,
          path: target.path as AutoMovieMotionTargetPath,
        },
        times,
        values,
        interpolation,
      };
    });
    const name = animation.name;
    if (name !== undefined && typeof name !== "string")
      throw new Error(`animations[${animationIndex}].name must be a string.`);
    return {
      id: `clip_${animationIndex}`,
      name: name === undefined || name.length === 0 ? null : name,
      duration: tracks.reduce(
        (maximum, track) =>
          Math.max(maximum, track.times[track.times.length - 1]!),
        0,
      ),
      loop: false,
      tracks,
    } satisfies IAutoMovieClip;
  });
  return {
    path: props.path,
    byteLength: props.byteLength,
    interpretation: AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE,
    nodes,
    nodeIds,
    takes,
  };
};

/**
 * Check the index-validated node forest before any profile-specific inspection.
 * Parent walks are iterative so source depth never becomes call-stack depth.
 */
const inspectExternalModelHierarchy = (
  values: unknown[],
): Array<number | undefined> => {
  const parentByIndex: Array<number | undefined> = new Array(values.length);
  values.forEach((value, parentIndex) => {
    const node = object(value, `nodes[${parentIndex}]`);
    optionalArray(node.children, `nodes[${parentIndex}].children`).forEach(
      (entry) => {
        const childIndex = entry as number;
        const previous = parentByIndex[childIndex];
        if (previous === parentIndex)
          throw new Error(
            `nodes[${parentIndex}].children repeats node ${childIndex}.`,
          );
        if (previous !== undefined)
          throw new Error(
            `nodes[${childIndex}] has multiple parents ${previous} and ${parentIndex}.`,
          );
        parentByIndex[childIndex] = parentIndex;
      },
    );
  });

  const state = new Uint8Array(values.length);
  values.forEach((_value, start) => {
    if (state[start] !== 0) return;
    const path: number[] = [];
    let index: number | undefined = start;
    while (index !== undefined && state[index] === 0) {
      state[index] = 1;
      path.push(index);
      index = parentByIndex[index];
    }
    if (index !== undefined && state[index] === 1)
      throw new Error(`nodes[${index}] belongs to a parent cycle.`);
    path.forEach((entry) => (state[entry] = 2));
  });
  return parentByIndex;
};

const inspectExternalMotionNodes = (
  values: unknown[],
  parentByIndex: readonly (number | undefined)[],
): IAutoMovieExternalMotionNodeInspection[] =>
  values.map((value, index) => {
    const node = object(value, `nodes[${index}]`);
    if (node.matrix !== undefined)
      throw new Error(
        `nodes[${index}].matrix is unsupported by the glTF motion interpretation profile; declare translation, rotation, and scale explicitly.`,
      );
    if (node.name !== undefined && typeof node.name !== "string")
      throw new Error(`nodes[${index}].name must be a string.`);
    const translation = finiteTuple(
      node.translation,
      `nodes[${index}].translation`,
      [0, 0, 0],
    );
    const rotation = finiteTuple(
      node.rotation,
      `nodes[${index}].rotation`,
      [0, 0, 0, 1],
    );
    const scale = finiteTuple(node.scale, `nodes[${index}].scale`, [1, 1, 1]);
    if (scale.some((component) => component <= 0))
      throw new Error(
        `nodes[${index}].scale must contain only positive values.`,
      );
    const magnitude = Math.hypot(...rotation);
    if (Math.abs(magnitude - 1) > 1e-4)
      throw new Error(`nodes[${index}].rotation must be a unit quaternion.`);
    return {
      id: `node_${index}`,
      index,
      name:
        typeof node.name === "string" && node.name.length !== 0
          ? node.name
          : null,
      parent:
        parentByIndex[index] === undefined
          ? null
          : `node_${parentByIndex[index]}`,
      transform: {
        translation: {
          x: translation[0]!,
          y: translation[1]!,
          z: translation[2]!,
        },
        rotation: {
          x: rotation[0]! / magnitude,
          y: rotation[1]! / magnitude,
          z: rotation[2]! / magnitude,
          w: rotation[3]! / magnitude,
        },
        scale: { x: scale[0]!, y: scale[1]!, z: scale[2]! },
      },
    };
  });

const finiteTuple = (
  value: unknown,
  path: string,
  fallback: readonly number[],
): number[] => {
  if (value === undefined) return [...fallback];
  if (Array.isArray(value) === false || value.length !== fallback.length)
    throw new Error(
      `${path} must contain exactly ${fallback.length} finite numbers.`,
    );
  return value.map((entry, index) => {
    if (typeof entry !== "number" || Number.isFinite(entry) === false)
      throw new Error(`${path}[${index}] must be finite.`);
    return entry;
  });
};

type AutoMovieMotionTargetPath =
  | "translation"
  | "rotation"
  | "scale"
  | "weights";

const MOTION_TARGET_PATHS: ReadonlySet<string> =
  new Set<AutoMovieMotionTargetPath>([
    "translation",
    "rotation",
    "scale",
    "weights",
  ]);

const motionInterpolation = (
  value: unknown,
  path: string,
): IAutoMovieTrack["interpolation"] => {
  if (value === undefined || value === "LINEAR") return "linear";
  if (value === "STEP") return "step";
  if (value === "CUBICSPLINE") return "cubicspline";
  throw new Error(`${path} must be LINEAR, STEP, or CUBICSPLINE.`);
};

const readMotionAccessor = (props: {
  accessors: unknown[];
  bufferViews: unknown[];
  payloads: Uint8Array[];
  accessorIndex: number;
  expectedType: "SCALAR" | "VEC3" | "VEC4";
  path: string;
}): number[] => {
  const accessor = object(
    props.accessors[props.accessorIndex],
    `accessors[${props.accessorIndex}]`,
  );
  if (
    accessor.componentType !== 5126 ||
    accessor.type !== props.expectedType ||
    accessor.bufferView === undefined ||
    accessor.sparse !== undefined
  )
    throw new Error(
      `${props.path} must resolve to a non-sparse FLOAT ${props.expectedType} accessor.`,
    );
  const width =
    props.expectedType === "SCALAR" ? 1 : props.expectedType === "VEC3" ? 3 : 4;
  const values: number[] = [];
  for (let element = 0; element < (accessor.count as number); ++element)
    for (let component = 0; component < width; ++component) {
      const value = readAccessorComponent(
        props,
        props.accessorIndex,
        element,
        component,
      );
      if (Number.isFinite(value) === false)
        throw new Error(`${props.path} contains a non-finite value.`);
      values.push(value);
    }
  return values;
};

const validateMotionTimes = (times: number[], path: string): void => {
  for (let index = 0; index < times.length; ++index)
    if (times[index]! < 0 || (index > 0 && times[index]! <= times[index - 1]!))
      throw new Error(
        `${path} keyframe times must be non-negative and strictly increasing.`,
      );
};

const validateMotionOutput = (props: {
  path: string;
  targetPath: AutoMovieMotionTargetPath;
  interpolation: IAutoMovieTrack["interpolation"];
  keyframes: number;
  values: number[];
}): void => {
  const factor = props.interpolation === "cubicspline" ? 3 : 1;
  const width =
    props.targetPath === "rotation"
      ? 4
      : props.targetPath === "weights"
        ? null
        : 3;
  const group = props.keyframes * factor;
  if (
    group === 0 ||
    (width === null
      ? props.values.length === 0 || props.values.length % group !== 0
      : props.values.length !== group * width)
  )
    throw new Error(
      `${props.path} does not match the ${props.targetPath} keyframe arity.`,
    );
  if (props.targetPath !== "rotation") return;
  for (let frame = 0; frame < props.keyframes; ++frame) {
    const quaternion =
      (props.interpolation === "cubicspline" ? frame * 3 + 1 : frame) * 4;
    const magnitude = Math.hypot(
      ...props.values.slice(quaternion, quaternion + 4),
    );
    if (Math.abs(magnitude - 1) > 1e-4)
      throw new Error(`${props.path} contains a non-unit rotation keyframe.`);
  }
};

const GLB_MAGIC = 0x46546c67;
const GLB_JSON_CHUNK = 0x4e4f534a;
const GLB_BIN_CHUNK = 0x004e4942;

const decodeGlb = (
  input: Uint8Array,
  vrmExtension: boolean,
): { json: unknown; format: "glb" | "vrm"; bin: Uint8Array | null } => {
  const bytes = new Uint8Array(input);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 20)
    throw new Error("GLB/VRM container is shorter than its mandatory header.");
  if (view.getUint32(0, true) !== GLB_MAGIC)
    throw new Error("GLB/VRM container has an invalid magic value.");
  if (view.getUint32(4, true) !== 2)
    throw new Error("Only GLB container version 2 is supported.");
  if (view.getUint32(8, true) !== bytes.length)
    throw new Error("GLB declared length does not match resident bytes.");
  const jsonLength = view.getUint32(12, true);
  if (
    jsonLength === 0 ||
    jsonLength % 4 !== 0 ||
    view.getUint32(16, true) !== GLB_JSON_CHUNK ||
    20 + jsonLength > bytes.length
  )
    throw new Error("GLB first chunk is not one aligned JSON chunk.");
  let cursor = 20 + jsonLength;
  let bin: Uint8Array | null = null;
  while (cursor < bytes.length) {
    if (cursor + 8 > bytes.length)
      throw new Error("GLB contains a truncated chunk header.");
    const length = view.getUint32(cursor, true);
    if (length % 4 !== 0 || cursor + 8 + length > bytes.length)
      throw new Error("GLB contains an unaligned or truncated chunk.");
    const type = view.getUint32(cursor + 4, true);
    if (type !== GLB_BIN_CHUNK || bin !== null)
      throw new Error(
        "GLB may contain only one optional BIN chunk after its JSON chunk.",
      );
    bin = bytes.subarray(cursor + 8, cursor + 8 + length);
    cursor += 8 + length;
  }
  return {
    json: decodeJson(bytes.subarray(20, 20 + jsonLength)),
    format: vrmExtension ? "vrm" : "glb",
    bin,
  };
};

const decodeJson = (bytes: Uint8Array): unknown => {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    throw new Error(
      `External model JSON is invalid: ${(error as Error).message}.`,
    );
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `External model JSON is invalid: ${(error as Error).message}.`,
    );
  }
  try {
    assertUniqueJsonObjectMembers(text);
  } catch (error) {
    throw new Error(
      `External model JSON is invalid: ${(error as Error).message}.`,
    );
  }
  return value;
};

/**
 * Refuse decoded-equivalent member names before last-wins JSON can escape.
 *
 * The walk runs only over text `JSON.parse` has already accepted, so it needs
 * no error recovery of its own: it tracks object scopes and decodes each member
 * name through `JSON.parse` so an escaped spelling of a name collides with its
 * plain spelling. It lives
 * here rather than reusing the production package's structured JSON ingress
 * because ingest depends on `@automovie/interface` alone and production sits
 * above it in the dependency graph.
 */
const assertUniqueJsonObjectMembers = (text: string): void => {
  let cursor = 0;
  const whitespace = (): void => {
    while (/\s/u.test(text.charAt(cursor))) ++cursor;
  };
  const string = (): string => {
    const start = cursor++;
    while (text[cursor] !== '"') {
      if (text[cursor] === "\\") {
        ++cursor;
        if (text[cursor] === "u") cursor += 4;
      }
      ++cursor;
    }
    ++cursor;
    return JSON.parse(text.slice(start, cursor)) as string;
  };
  const value = (): void => {
    whitespace();
    if (text[cursor] === "{") object();
    else if (text[cursor] === "[") array();
    else if (text[cursor] === '"') void string();
    else {
      while (cursor < text.length && /[^\s,\]}]/u.test(text[cursor]!)) ++cursor;
    }
    whitespace();
  };
  const object = (): void => {
    ++cursor;
    whitespace();
    const names = new Set<string>();
    if (text[cursor] === "}") {
      ++cursor;
      return;
    }
    while (true) {
      const name = string();
      if (names.has(name))
        throw new Error(`duplicate member ${JSON.stringify(name)}`);
      names.add(name);
      whitespace();
      ++cursor;
      value();
      if (text[cursor] === "}") {
        ++cursor;
        return;
      }
      ++cursor;
      whitespace();
    }
  };
  const array = (): void => {
    ++cursor;
    whitespace();
    if (text[cursor] === "]") {
      ++cursor;
      return;
    }
    while (true) {
      value();
      if (text[cursor] === "]") {
        ++cursor;
        return;
      }
      ++cursor;
    }
  };
  value();
};

const object = (value: unknown, path: string): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${path} must be an object.`);
  return value as Record<string, unknown>;
};

const optionalObject = (
  value: unknown,
  path: string,
): Record<string, unknown> => (value === undefined ? {} : object(value, path));

const requiredArray = (value: unknown, path: string): unknown[] => {
  if (Array.isArray(value) === false)
    throw new Error(`${path} must be an array.`);
  return value;
};

const optionalArray = (value: unknown, path: string): unknown[] =>
  value === undefined ? [] : requiredArray(value, path);

const optionalStringArray = (value: unknown, path: string): string[] =>
  optionalArray(value, path).map((entry, index) => {
    if (typeof entry !== "string" || entry.trim().length === 0)
      throw new Error(`${path}[${index}] must be a non-blank string.`);
    return entry;
  });

const integerIndex = (
  value: unknown,
  length: number,
  path: string,
  required = false,
): void => {
  if (value === undefined && required === false) return;
  if (
    typeof value !== "number" ||
    Number.isSafeInteger(value) === false ||
    value < 0 ||
    value >= length
  )
    throw new Error(`${path} does not resolve inside its declared inventory.`);
};

const integerIndices = (value: unknown, length: number, path: string): void => {
  if (value === undefined) return;
  requiredArray(value, path).forEach((entry, index) =>
    integerIndex(entry, length, `${path}[${index}]`, true),
  );
};

const positiveInteger = (value: unknown, path: string): void => {
  if (
    typeof value !== "number" ||
    Number.isSafeInteger(value) === false ||
    value <= 0
  )
    throw new Error(`${path} must be a positive safe integer.`);
};

const nonNegativeInteger = (value: unknown, path: string): void => {
  if (
    typeof value !== "number" ||
    Number.isSafeInteger(value) === false ||
    value < 0
  )
    throw new Error(`${path} must be a non-negative safe integer.`);
};

const externalUri = (value: unknown, path: string): string | null => {
  if (value === undefined) return null;
  if (typeof value !== "string" || value.length === 0)
    throw new Error(`${path} must be a non-empty URI string.`);
  return value.startsWith("data:") ? null : value;
};

const uniqueStrings = (values: string[]): string[] =>
  [...new Set(values)].sort(compareCodeUnits);

const compareCodeUnits = (left: string, right: string): number =>
  Number(left > right) - Number(left < right);

const fileExtension = (value: string): string => {
  const name = value.slice(value.lastIndexOf("/") + 1);
  const index = name.lastIndexOf(".");
  return index < 0 ? "" : name.slice(index).toLowerCase();
};

const collectExternalResources = (
  buffers: unknown[],
  images: unknown[],
): IAutoMovieExternalModelResource[] => {
  const byUri = new Map<string, IAutoMovieExternalModelResource>();
  buffers.forEach((value, index) => {
    const buffer = object(value, `buffers[${index}]`);
    const uri = externalUri(buffer.uri, `buffers[${index}].uri`);
    if (uri === null) return;
    const byteLength = buffer.byteLength as number;
    const prior = byUri.get(uri);
    if (
      prior !== undefined &&
      (prior.kind !== "buffer" || prior.byteLength !== byteLength)
    )
      throw new Error(
        `External URI "${uri}" is declared with conflicting resource roles or lengths.`,
      );
    byUri.set(uri, { uri, kind: "buffer", byteLength });
  });
  images.forEach((value, index) => {
    const image = object(value, `images[${index}]`);
    const uri = externalUri(image.uri, `images[${index}].uri`);
    if (uri === null) return;
    const prior = byUri.get(uri);
    if (prior !== undefined && prior.kind !== "image")
      throw new Error(
        `External URI "${uri}" is declared as both a buffer and an image.`,
      );
    byUri.set(uri, { uri, kind: "image", byteLength: null });
  });
  return [...byUri.values()].sort((left, right) =>
    compareCodeUnits(left.uri, right.uri),
  );
};

const validatePayloadClosure = (props: {
  format: "gltf" | "glb" | "vrm";
  bin: Uint8Array | null;
  buffers: unknown[];
  bufferViews: unknown[];
  images: unknown[];
  resolveResource?: (uri: string) => Uint8Array | null;
}): Uint8Array[] => {
  const payloads = props.buffers.map((value, index) => {
    const buffer = object(value, `buffers[${index}]`);
    const length = buffer.byteLength as number;
    let bytes: Uint8Array | null;
    if (buffer.uri === undefined) {
      if (props.format === "gltf" || index !== 0)
        throw new Error(
          `buffers[${index}] cannot use the GLB BIN chunk in this container.`,
        );
      bytes = props.bin;
      if (bytes === null)
        throw new Error(
          `buffers[${index}] declares ${length} bytes but the GLB has no BIN chunk.`,
        );
      if (bytes.byteLength < length || bytes.byteLength > length + 3)
        throw new Error(
          `GLB BIN chunk length ${bytes.byteLength} does not cover buffers[${index}].byteLength ${length} with at most three padding bytes.`,
        );
    } else {
      const uri = buffer.uri as string;
      if (uri.startsWith("data:")) {
        bytes = decodeDataUri(uri, `buffers[${index}].uri`);
        if (bytes.byteLength !== length)
          throw new Error(
            `buffers[${index}] data URI has ${bytes.byteLength} bytes, not declared byteLength ${length}.`,
          );
      } else {
        bytes = props.resolveResource?.(uri) ?? null;
        if (bytes === null)
          throw new Error(
            `External buffer "${uri}" has no builder-resolved resident bytes.`,
          );
        if (bytes.byteLength !== length)
          throw new Error(
            `External buffer "${uri}" has ${bytes.byteLength} bytes, not declared byteLength ${length}.`,
          );
      }
    }
    return bytes;
  });
  if (props.bin !== null && props.buffers.length === 0)
    throw new Error("GLB contains a BIN chunk but declares no buffer.");
  if (
    props.bin !== null &&
    object(props.buffers[0], "buffers[0]").uri !== undefined
  )
    throw new Error(
      "GLB BIN chunk is orphaned because buffers[0] declares an external URI.",
    );
  props.bufferViews.forEach((value, index) => {
    const view = object(value, `bufferViews[${index}]`);
    const bufferIndex = view.buffer as number;
    const offset = (view.byteOffset as number | undefined) ?? 0;
    const length = view.byteLength as number;
    const declared = object(
      props.buffers[bufferIndex],
      `buffers[${bufferIndex}]`,
    ).byteLength as number;
    if (
      offset + length > declared ||
      offset + length > payloads[bufferIndex]!.byteLength
    )
      throw new Error(
        `bufferViews[${index}] range ${offset}..${offset + length} exceeds buffers[${bufferIndex}].byteLength ${declared}.`,
      );
  });
  props.images.forEach((value, index) => {
    const image = object(value, `images[${index}]`);
    if (typeof image.uri !== "string") return;
    const bytes = image.uri.startsWith("data:")
      ? decodeDataUri(image.uri, `images[${index}].uri`)
      : (props.resolveResource?.(image.uri) ?? null);
    if (bytes === null || bytes.byteLength === 0)
      throw new Error(
        `External image "${image.uri}" has no non-empty builder-resolved resident bytes.`,
      );
  });
  return payloads;
};

const decodeDataUri = (uri: string, path: string): Uint8Array => {
  const comma = uri.indexOf(",");
  if (comma < 5) throw new Error(`${path} is not a complete data URI.`);
  const metadata = uri.slice(5, comma);
  const payload = uri.slice(comma + 1);
  try {
    if (metadata.split(";").includes("base64")) {
      if (
        payload.length % 4 !== 0 ||
        /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(
          payload,
        ) === false
      )
        throw new Error("base64 payload is not canonical");
      return Uint8Array.from(atob(payload), (character) =>
        character.charCodeAt(0),
      );
    }
    const output: number[] = [];
    for (let index = 0; index < payload.length; ++index) {
      if (payload[index] === "%") {
        const hex = payload.slice(index + 1, index + 3);
        if (/^[0-9A-Fa-f]{2}$/u.test(hex) === false)
          throw new Error("percent escape is incomplete");
        output.push(Number.parseInt(hex, 16));
        index += 2;
      } else {
        const encoded = new TextEncoder().encode(payload[index]!);
        output.push(...encoded);
      }
    }
    return Uint8Array.from(output);
  } catch (error) {
    throw new Error(
      `${path} has an invalid data payload: ${(error as Error).message}.`,
    );
  }
};

const validateAccessorRange = (
  accessor: Record<string, unknown>,
  index: number,
  bufferViews: unknown[],
): void => {
  if (accessor.bufferView === undefined) {
    if (accessor.sparse === undefined)
      throw new Error(
        `accessors[${index}] needs a bufferView or a complete sparse payload.`,
      );
    return;
  }
  const view = object(
    bufferViews[accessor.bufferView as number],
    `bufferViews[${accessor.bufferView as number}]`,
  );
  const element = accessorElementByteLength(
    accessor.componentType as number,
    accessor.type as string,
  );
  const stride = (view.byteStride as number | undefined) ?? element;
  if (stride < element)
    throw new Error(
      `accessors[${index}] element size ${element} exceeds bufferView byteStride ${stride}.`,
    );
  const offset = (accessor.byteOffset as number | undefined) ?? 0;
  const count = accessor.count as number;
  const end = offset + (count - 1) * stride + element;
  if (end > (view.byteLength as number))
    throw new Error(
      `accessors[${index}] requires ${end} bytes inside a bufferView of ${String(view.byteLength)} bytes.`,
    );
};

const validateSparseAccessor = (
  accessor: Record<string, unknown>,
  index: number,
  bufferViews: unknown[],
): void => {
  if (accessor.sparse === undefined) return;
  const sparse = object(accessor.sparse, `accessors[${index}].sparse`);
  positiveInteger(sparse.count, `accessors[${index}].sparse.count`);
  if ((sparse.count as number) > (accessor.count as number))
    throw new Error(
      `accessors[${index}].sparse.count exceeds the accessor count.`,
    );
  const indices = object(sparse.indices, `accessors[${index}].sparse.indices`);
  const values = object(sparse.values, `accessors[${index}].sparse.values`);
  integerIndex(
    indices.bufferView,
    bufferViews.length,
    `accessors[${index}].sparse.indices.bufferView`,
    true,
  );
  integerIndex(
    values.bufferView,
    bufferViews.length,
    `accessors[${index}].sparse.values.bufferView`,
    true,
  );
  if (
    typeof indices.componentType !== "number" ||
    [5121, 5123, 5125].includes(indices.componentType) === false
  )
    throw new Error(
      `accessors[${index}].sparse.indices.componentType must be unsigned byte, short or int.`,
    );
  const count = sparse.count as number;
  validateSubViewRange(
    bufferViews,
    indices.bufferView as number,
    (indices.byteOffset as number | undefined) ?? 0,
    count * componentByteLength(indices.componentType),
    `accessors[${index}].sparse.indices`,
  );
  validateSubViewRange(
    bufferViews,
    values.bufferView as number,
    (values.byteOffset as number | undefined) ?? 0,
    count *
      accessorElementByteLength(
        accessor.componentType as number,
        accessor.type as string,
      ),
    `accessors[${index}].sparse.values`,
  );
};

const validateSubViewRange = (
  bufferViews: unknown[],
  viewIndex: number,
  offset: number,
  length: number,
  path: string,
): void => {
  nonNegativeInteger(offset, `${path}.byteOffset`);
  const view = object(bufferViews[viewIndex], `bufferViews[${viewIndex}]`);
  if (offset + length > (view.byteLength as number))
    throw new Error(`${path} exceeds its bufferView range.`);
};

const componentByteLength = (componentType: number): number =>
  componentType === 5120 || componentType === 5121
    ? 1
    : componentType === 5122 || componentType === 5123
      ? 2
      : 4;

const accessorElementByteLength = (
  componentType: number,
  shape: string,
): number => {
  const component = componentByteLength(componentType);
  const components: Record<string, number> = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16,
  };
  const raw = component * components[shape]!;
  if (shape === "MAT2" && component === 1) return 8;
  if (shape === "MAT3" && component === 1) return 12;
  if (shape === "MAT3" && component === 2) return 24;
  return raw;
};

const validateHumanoidSkinning = (props: {
  nodes: unknown[];
  meshes: unknown[];
  skins: unknown[];
  accessors: unknown[];
  bufferViews: unknown[];
  payloads: Uint8Array[];
}): Set<number> => {
  let skinnedPrimitiveCount = 0;
  const weightedNodes = new Set<number>();
  props.nodes.forEach((value, nodeIndex) => {
    const node = object(value, `nodes[${nodeIndex}]`);
    if (node.skin === undefined) return;
    if (node.mesh === undefined)
      throw new Error(
        `nodes[${nodeIndex}] binds a skin without a render mesh.`,
      );
    const skin = object(
      props.skins[node.skin as number],
      `skins[${node.skin as number}]`,
    );
    const joints = requiredArray(
      skin.joints,
      `skins[${node.skin as number}].joints`,
    );
    const mesh = object(
      props.meshes[node.mesh as number],
      `meshes[${node.mesh as number}]`,
    );
    requiredArray(
      mesh.primitives,
      `meshes[${node.mesh as number}].primitives`,
    ).forEach((value, primitiveIndex) => {
      const primitive = object(
        value,
        `meshes[${node.mesh as number}].primitives[${primitiveIndex}]`,
      );
      const attributes = object(
        primitive.attributes,
        `meshes[${node.mesh as number}].primitives[${primitiveIndex}].attributes`,
      );
      integerIndex(
        attributes.JOINTS_0,
        props.accessors.length,
        `meshes[${node.mesh as number}].primitives[${primitiveIndex}].attributes.JOINTS_0`,
        true,
      );
      integerIndex(
        attributes.WEIGHTS_0,
        props.accessors.length,
        `meshes[${node.mesh as number}].primitives[${primitiveIndex}].attributes.WEIGHTS_0`,
        true,
      );
      const position = object(
        props.accessors[attributes.POSITION as number],
        `accessors[${attributes.POSITION as number}]`,
      );
      const jointAccessor = object(
        props.accessors[attributes.JOINTS_0 as number],
        `accessors[${attributes.JOINTS_0 as number}]`,
      );
      const weightAccessor = object(
        props.accessors[attributes.WEIGHTS_0 as number],
        `accessors[${attributes.WEIGHTS_0 as number}]`,
      );
      if (
        jointAccessor.type !== "VEC4" ||
        (jointAccessor.componentType !== 5121 &&
          jointAccessor.componentType !== 5123) ||
        weightAccessor.type !== "VEC4" ||
        (weightAccessor.componentType !== 5126 &&
          weightAccessor.componentType !== 5121 &&
          weightAccessor.componentType !== 5123) ||
        (weightAccessor.componentType !== 5126 &&
          weightAccessor.normalized !== true) ||
        jointAccessor.count !== position.count ||
        weightAccessor.count !== position.count
      )
        throw new Error(
          `Skinned primitive ${String(node.mesh)}:${primitiveIndex} needs count-matched JOINTS_0 and normalized WEIGHTS_0 VEC4 accessors.`,
        );
      for (let vertex = 0; vertex < (position.count as number); ++vertex) {
        let weightSum = 0;
        for (let component = 0; component < 4; ++component) {
          const weight = readAccessorComponent(
            props,
            attributes.WEIGHTS_0 as number,
            vertex,
            component,
          );
          const joint = readAccessorComponent(
            props,
            attributes.JOINTS_0 as number,
            vertex,
            component,
          );
          weightSum += weight;
          if (
            weight > 0 &&
            (Number.isSafeInteger(joint) === false ||
              joint < 0 ||
              joint >= joints.length)
          )
            throw new Error(
              `Skinned primitive ${String(node.mesh)}:${primitiveIndex} vertex ${vertex} cites joint ${joint} outside skin ${String(node.skin)}.`,
            );
          if (weight > 0) weightedNodes.add(joints[joint] as number);
        }
        if (Number.isFinite(weightSum) === false || weightSum <= 0)
          throw new Error(
            `Skinned primitive ${String(node.mesh)}:${primitiveIndex} vertex ${vertex} has no positive skin weight.`,
          );
      }
      ++skinnedPrimitiveCount;
    });
  });
  if (skinnedPrimitiveCount === 0)
    throw new Error(
      "Humanoid profiles require at least one mesh node with a complete skin binding.",
    );
  return weightedNodes;
};

const readAccessorComponent = (
  props: {
    accessors: unknown[];
    bufferViews: unknown[];
    payloads: Uint8Array[];
  },
  accessorIndex: number,
  element: number,
  component: number,
): number => {
  const accessor = object(
    props.accessors[accessorIndex],
    `accessors[${accessorIndex}]`,
  );
  if (accessor.sparse !== undefined)
    throw new Error(
      `Skin accessor ${accessorIndex} may not use sparse overrides at the production ingest boundary.`,
    );
  const viewIndex = accessor.bufferView as number;
  const bufferView = object(
    props.bufferViews[viewIndex],
    `bufferViews[${viewIndex}]`,
  );
  const type = accessor.componentType as number;
  const size = componentByteLength(type);
  const stride =
    (bufferView.byteStride as number | undefined) ??
    accessorElementByteLength(type, accessor.type as string);
  const offset =
    ((bufferView.byteOffset as number | undefined) ?? 0) +
    ((accessor.byteOffset as number | undefined) ?? 0) +
    element * stride +
    component * size;
  const bytes = props.payloads[bufferView.buffer as number]!;
  const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const value =
    type === 5121
      ? data.getUint8(offset)
      : type === 5123
        ? data.getUint16(offset, true)
        : data.getFloat32(offset, true);
  return accessor.normalized === true
    ? type === 5121
      ? value / 255
      : type === 5123
        ? value / 65535
        : value
    : value;
};

const gltfHumanoidBones = (
  nodes: unknown[],
  skins: unknown[],
): Array<{ bone: AutoMovieHumanoidBone; node: number }> => {
  const joints = new Set(
    skins.flatMap((value, index) =>
      requiredArray(
        object(value, `skins[${index}]`).joints,
        `skins[${index}].joints`,
      ),
    ),
  );
  const used = new Set<AutoMovieHumanoidBone>();
  return nodes.flatMap((value, index) => {
    if (joints.has(index) === false) return [];
    const name = object(value, `nodes[${index}]`).name;
    if (typeof name !== "string") return [];
    const bone = HUMANOID_ALIASES[normalizeBoneName(name)];
    if (bone === undefined || used.has(bone)) return [];
    used.add(bone);
    return [{ bone, node: index }];
  });
};

const vrmHumanoidBones = (
  document: Record<string, unknown>,
  nodes: unknown[],
): Array<{ bone: AutoMovieHumanoidBone; node: number }> => {
  const extensions = optionalObject(document.extensions, "extensions");
  if (extensions.VRMC_vrm !== undefined) {
    const vrm = object(extensions.VRMC_vrm, "extensions.VRMC_vrm");
    const humanoid = object(vrm.humanoid, "extensions.VRMC_vrm.humanoid");
    const bones = object(
      humanoid.humanBones,
      "extensions.VRMC_vrm.humanoid.humanBones",
    );
    return Object.entries(bones)
      .sort(([left], [right]) => compareCodeUnits(left, right))
      .map(([bone, value]) => {
        if (HUMANOID_BONES.has(bone as AutoMovieHumanoidBone) === false)
          throw new Error(`VRMC_vrm declares unknown humanoid bone "${bone}".`);
        const node = object(
          value,
          `extensions.VRMC_vrm.humanoid.humanBones.${bone}`,
        ).node;
        if (validNodeIndex(node, nodes.length) === false)
          throw new Error(
            `VRMC_vrm humanoid bone "${bone}" does not resolve to a node.`,
          );
        return { bone: bone as AutoMovieHumanoidBone, node: node as number };
      });
  }
  if (extensions.VRM !== undefined) {
    const vrm = object(extensions.VRM, "extensions.VRM");
    const humanoid = object(vrm.humanoid, "extensions.VRM.humanoid");
    const used = new Set<AutoMovieHumanoidBone>();
    return requiredArray(
      humanoid.humanBones,
      "extensions.VRM.humanoid.humanBones",
    ).map((value, index) => {
      const bone = object(
        value,
        `extensions.VRM.humanoid.humanBones[${index}]`,
      );
      if (
        typeof bone.bone !== "string" ||
        HUMANOID_BONES.has(bone.bone as AutoMovieHumanoidBone) === false ||
        validNodeIndex(bone.node, nodes.length) === false ||
        used.has(bone.bone as AutoMovieHumanoidBone)
      )
        throw new Error(
          `VRM humanoid entry ${index} has an unknown, duplicate or dangling bone mapping.`,
        );
      used.add(bone.bone as AutoMovieHumanoidBone);
      return {
        bone: bone.bone as AutoMovieHumanoidBone,
        node: bone.node as number,
      };
    });
  }
  return [];
};

const validNodeIndex = (value: unknown, length: number): boolean =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  value < length;

const normalizeBoneName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/^mixamorig:?/u, "")
    .replace(/[\s_.:|-]/gu, "");

const HUMANOID_BONES = new Set<AutoMovieHumanoidBone>([
  "hips",
  "spine",
  "chest",
  "upperChest",
  "neck",
  "head",
  "leftEye",
  "rightEye",
  "jaw",
  "leftShoulder",
  "leftUpperArm",
  "leftLowerArm",
  "leftHand",
  "rightShoulder",
  "rightUpperArm",
  "rightLowerArm",
  "rightHand",
  "leftUpperLeg",
  "leftLowerLeg",
  "leftFoot",
  "leftToes",
  "rightUpperLeg",
  "rightLowerLeg",
  "rightFoot",
  "rightToes",
  "leftThumbMetacarpal",
  "leftThumbProximal",
  "leftThumbDistal",
  "leftIndexProximal",
  "leftIndexIntermediate",
  "leftIndexDistal",
  "leftMiddleProximal",
  "leftMiddleIntermediate",
  "leftMiddleDistal",
  "leftRingProximal",
  "leftRingIntermediate",
  "leftRingDistal",
  "leftLittleProximal",
  "leftLittleIntermediate",
  "leftLittleDistal",
  "rightThumbMetacarpal",
  "rightThumbProximal",
  "rightThumbDistal",
  "rightIndexProximal",
  "rightIndexIntermediate",
  "rightIndexDistal",
  "rightMiddleProximal",
  "rightMiddleIntermediate",
  "rightMiddleDistal",
  "rightRingProximal",
  "rightRingIntermediate",
  "rightRingDistal",
  "rightLittleProximal",
  "rightLittleIntermediate",
  "rightLittleDistal",
]);

const HUMANOID_ALIASES: Readonly<Record<string, AutoMovieHumanoidBone>> = {
  hips: "hips",
  pelvis: "hips",
  spine: "spine",
  spine01: "spine",
  spine1: "chest",
  chest: "chest",
  spine02: "chest",
  spine2: "upperChest",
  spine03: "upperChest",
  upperchest: "upperChest",
  neck: "neck",
  head: "head",
  leftshoulder: "leftShoulder",
  leftclavicle: "leftShoulder",
  leftarm: "leftUpperArm",
  leftupperarm: "leftUpperArm",
  leftforearm: "leftLowerArm",
  leftlowerarm: "leftLowerArm",
  lefthand: "leftHand",
  rightshoulder: "rightShoulder",
  rightclavicle: "rightShoulder",
  rightarm: "rightUpperArm",
  rightupperarm: "rightUpperArm",
  rightforearm: "rightLowerArm",
  rightlowerarm: "rightLowerArm",
  righthand: "rightHand",
  leftupleg: "leftUpperLeg",
  leftupperleg: "leftUpperLeg",
  leftleg: "leftLowerLeg",
  leftlowerleg: "leftLowerLeg",
  leftfoot: "leftFoot",
  lefttoebase: "leftToes",
  lefttoes: "leftToes",
  rightupleg: "rightUpperLeg",
  rightupperleg: "rightUpperLeg",
  rightleg: "rightLowerLeg",
  rightlowerleg: "rightLowerLeg",
  rightfoot: "rightFoot",
  righttoebase: "rightToes",
  righttoes: "rightToes",
};
