import {
  AutoMovieHumanoidBone,
  IAutoMovieClip,
  IAutoMovieTrack,
  IAutoMovieTransform,
} from "@automovie/interface";

import { humanoidBoneOfName } from "./internal/humanoidBoneOfName";

/**
 * One external URI whose resident bytes the builder must bind before ingest.
 *
 * Data URIs are decoded in place and never listed; only a URI that names a
 * sidecar file appears here.
 *
 * @evidence contracts/common.md#principled-implementation A resource is keyed by its exact declared URI and role, the two facts the builder needs to bind manifest-owned bytes, and a buffer keeps its glTF `byteLength` because the resolved bytes must match it.
 * @evidence contracts/common.md#clear-and-simple-design Buffers and images share one record discriminated by `kind`, since both resolve through the same `resolveResource` seam.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Data URIs are excluded rather than listed as resolvable, and an image carries `null` instead of an invented length.
 * @evidence contracts/common.md#meaningful-documentation The comments state that only sidecar URIs appear, that the URI is undecoded, which array declares each kind, and why an image has no length.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record is a three-field type with no runtime code.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This interface carries no work that two consumers could share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three scalar fields per sidecar URI; the record never holds the resolved bytes.
 * @author Samchon
 */
export interface IAutoMovieExternalModelResource {
  /** URI exactly as the glTF declares it, unresolved and undecoded. */
  uri: string;

  /** Whether a `buffers` or an `images` entry declares the URI. */
  kind: "buffer" | "image";

  /**
   * Declared `byteLength` of a buffer, which the resolved bytes must equal;
   * `null` for an image, which glTF gives no length.
   */
  byteLength: number | null;
}

/**
 * Byte-level facts the external-model builder accepts before materializing a
 * source.
 *
 * Inspection is synchronous because the production builder already holds the
 * exact resident bytes and must reject malformed glTF, GLB or VRM before
 * anything is built from them. Hosts still construct the render mesh with their
 * own loader from the same content-addressed asset; these facts only gate it.
 *
 * @evidence contracts/common.md#principled-implementation The record reports only facts read from the declared JSON and checked against resident bytes: counts of the top-level arrays, the extension union, sidecar URIs, profile-proved humanoid slots with weight usage, and motion takes when the motion profile ran.
 * @evidence contracts/common.md#clear-and-simple-design One inspection result serves every profile, with `humanoidBones` empty and `motion` absent where a profile does not compute them, so the production inventory reads one shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `format` reports `vrm` from declared VRM extensions rather than trusting the suffix, and the documentation says so instead of implying the suffix decides.
 * @evidence contracts/common.md#meaningful-documentation The comments state why inspection is synchronous, that hosts still load the render mesh themselves, how `format` is decided, the order of `extensions` and `resources`, how each profile fills `humanoidBones`, and when `motion` is present.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface types the inspector's result and has no code; inspection cost is answered on `inspectAutoMovieExternalModelBytes`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A plain result record has nothing to share between consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record holds new arrays proportional to extensions, resources, slots and motion data, owned by the caller, and no reference to the container bytes.
 * @author Samchon
 */
export interface IAutoMovieExternalModelInspection {
  /** Profile the caller selected and the inspection enforced. */
  profile: AutoMovieExternalModelIngestProfile;

  /**
   * Container family: `vrm` whenever `VRM` or `VRMC_vrm` appears among the
   * extensions, whatever the file suffix, otherwise `gltf` or `glb` by suffix.
   */
  format: "gltf" | "glb" | "vrm";

  /** GlTF asset version; only 2.0 is accepted. */
  version: "2.0";

  /** Lengths of the declared top-level arrays; an absent array counts zero. */
  counts: {
    /** Number of `nodes` entries. */
    nodes: number;

    /** Number of `meshes` entries. */
    meshes: number;

    /** Number of `skins` entries. */
    skins: number;

    /** Number of `animations` entries, read even when no motion is inspected. */
    animations: number;
  };

  /**
   * Union of `extensionsUsed` and the root `extensions` keys, deduplicated and
   * sorted in code-unit order.
   */
  extensions: string[];

  /**
   * Sidecar buffers and images, one entry per distinct URI, sorted by URI in
   * code-unit order.
   */
  resources: IAutoMovieExternalModelResource[];

  /**
   * Humanoid slots the profile proved, empty for the static and motion
   * profiles. `gltf-humanoid-v1` lists skin joints in node order whose names
   * map to a slot, first node per slot; `vrm-humanoid-v1` lists the VRM
   * declaration, with VRM 0.x thumb names migrated to their VRM 1.0 slots.
   */
  humanoidBones: Array<{
    /** Normalized humanoid slot. */
    bone: AutoMovieHumanoidBone;

    /** Zero-based index of the node carrying the slot. */
    node: number;

    /** Whether some skinned vertex gives this joint a positive weight. */
    weighted: boolean;
  }>;

  /** Normalized takes; present only under `gltf-motion-v1`. */
  motion?: IAutoMovieExternalMotionInspection;
}

/**
 * Spatial interpretation motion inspection applies to every node and track:
 * glTF 2.0's meters, right-handed axes and +Y up, taken as declared with no
 * conversion.
 */
export const AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE =
  "gltf-2.0-meter-right-handed-y-up" as const;

/**
 * One node of a motion source with the local rest basis read from its bytes.
 *
 * @evidence contracts/common.md#principled-implementation Each node carries its index-derived id, parent id and a canonical local TRS with glTF defaults, rotation renormalized after a tolerance check, which is the basis motion adoption recomputes rest poses from.
 * @evidence contracts/common.md#clear-and-simple-design The record keeps both the stable id and the raw index so tracks and mappings cite ids while diagnostics can still name the source index.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A node `matrix` is refused rather than decomposed, so the TRS here is always what the file declared instead of a guessed decomposition.
 * @evidence contracts/common.md#meaningful-documentation The comments give the id form, the index base, the name and parent null cases, and every normalization the transform received.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This node record is data; the cost of producing it belongs to the inspector.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Node records are produced once per inspection and carry no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One small transform object per source node, owned by the inspection result.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionNodeInspection {
  /** `node_{index}`, the id tracks and source-rig mappings cite. */
  id: string;

  /** Zero-based node index in the inspected glTF revision. */
  index: number;

  /** Declared name when non-empty, otherwise `null`. */
  name: string | null;

  /** Id of the node listing this one as a child, or `null` for a root. */
  parent: string | null;

  /**
   * Parent-local rest TRS with glTF defaults for absent fields, finite
   * components, positive scale, and the rotation renormalized to unit length
   * after a 1e-4 magnitude tolerance check.
   */
  transform: IAutoMovieTransform;
}

/**
 * Animation facts normalized from one exact glTF, GLB or VRM byte revision.
 *
 * @evidence contracts/common.md#principled-implementation Takes are rewritten from FLOAT accessors to node tracks with exact copied keyframes under one declared spatial interpretation, so motion data is reproducible from the bytes alone.
 * @evidence contracts/common.md#clear-and-simple-design `nodeIds` duplicates the node ids as a plain list because mapping authors and the inventory consume the list without the transforms.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The interpretation is a single literal type, so a consumer cannot receive motion under an unannounced axis or unit convention.
 * @evidence contracts/common.md#meaningful-documentation The comments state that the path and length repeat for adoption checks, the length excludes sidecars, and how takes are ordered, named, timed and flagged as non-looping.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The motion record is a result type with no code.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Motion facts are a data shape; the inspector shares decoded accessors while building them.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retained size is proportional to nodes and keyframe values, owned by the inspection result; no handle or task.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionInspection {
  /** Path whose suffix selected the decoder, repeated for adoption checks. */
  path: string;

  /** Length of the inspected container bytes, excluding sidecars. */
  byteLength: number;

  /** The fixed interpretation every node and track is read under. */
  interpretation: typeof AUTOMOVIE_GLTF_MOTION_INTERPRETATION_PROFILE;

  /** Every node in source order with its hierarchy and rest basis. */
  nodes: IAutoMovieExternalMotionNodeInspection[];

  /** The node ids in source order, for an explicit source-rig mapping. */
  nodeIds: string[];

  /**
   * One clip `clip_{index}` per animation in source order, its tracks in
   * channel order with FLOAT keyframes copied exactly, duration the latest
   * keyframe time, and `loop` false.
   */
  takes: IAutoMovieClip[];
}

/**
 * Fixed normalization profiles the builder may select for an external model.
 *
 * `gltf-static-v1` checks structure and resources of a model with at least one
 * mesh. `gltf-humanoid-v1` also requires a skin, a joint whose name maps to
 * `hips`, and complete skin weights. `gltf-motion-v1` inspects animations
 * instead of meshes and requires at least one. `vrm-humanoid-v1` requires a GLB
 * or VRM container with VRM metadata declaring `hips`, and complete skin
 * weights.
 *
 * @evidence contracts/common.md#principled-implementation A closed union of four versioned profile literals makes the caller choose an interpretation explicitly instead of the inspector sniffing one.
 * @evidence contracts/common.md#clear-and-simple-design The union is mirrored at run time by a registry typed as a `Record` over it, so the type and the accepted strings cannot drift.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default profile exists; an unknown string is refused by the inspector and by the runtime guard.
 * @evidence contracts/common.md#meaningful-documentation The documentation states what each of the four profiles adds to the structural checks.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The profile union is a type and has no runtime cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A literal union of profile names coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The union allocates nothing; its runtime list is a frozen four-element constant.
 * @author Samchon
 */
export type AutoMovieExternalModelIngestProfile =
  | "gltf-static-v1"
  | "gltf-humanoid-v1"
  | "gltf-motion-v1"
  | "vrm-humanoid-v1";

/** Runtime registry whose `Record` type requires exactly the union's keys. */
const INGEST_PROFILE_REGISTRY: Readonly<
  Record<AutoMovieExternalModelIngestProfile, true>
> = {
  "gltf-static-v1": true,
  "gltf-humanoid-v1": true,
  "gltf-motion-v1": true,
  "vrm-humanoid-v1": true,
};

/**
 * Every supported ingest profile literal, in declaration order and frozen.
 *
 * The registry it is read from is typed as a `Record` over the profile union,
 * so a literal added to or removed from the type changes this list in the same
 * edit and a command surface that consults it cannot lag behind the inspector.
 */
export const AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES: readonly AutoMovieExternalModelIngestProfile[] =
  Object.freeze(
    Object.keys(
      INGEST_PROFILE_REGISTRY,
    ) as AutoMovieExternalModelIngestProfile[],
  );

/**
 * Whether an untyped selection, such as a command-line or manifest value,
 * names one supported ingest profile exactly.
 *
 * Only an own key of the profile registry passes, so `toString` and other
 * inherited names are refused.
 *
 * @param value Candidate selection of any type.
 * @returns `true` when `value` is one of the profile literals.
 *
 * @evidence contracts/common.md#principled-implementation `Object.hasOwn` on the registry typed as a `Record` over the union admits exactly the profile literals and no inherited key such as `toString`.
 * @evidence contracts/common.md#clear-and-simple-design The guard reads the same registry the exported profile list comes from, replacing a second set built from that list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The guard does no trimming or case folding, so a near-miss spelling is refused rather than accepted.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the intended untyped inputs, the exact-match rule, and the inherited-name refusal.
 * @evidence contracts/performance.md#efficient-algorithms One `typeof` check and one own-property lookup per call, constant time with no allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A constant-time check has nothing worth reusing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The guard retains nothing and reads a module constant.
 * @author Samchon
 */
export const isAutoMovieExternalModelIngestProfile = (
  value: unknown,
): value is AutoMovieExternalModelIngestProfile =>
  typeof value === "string" && Object.hasOwn(INGEST_PROFILE_REGISTRY, value);

/**
 * Parse and validate exact external model bytes before compilation.
 *
 * The container is chosen by the path suffix: `.gltf` is UTF-8 JSON, `.glb`
 * and `.vrm` are GLB 2.0 with one JSON chunk and at most one BIN chunk. JSON
 * that is not strict UTF-8, does not parse, or repeats a member name after
 * escape decoding is refused, because a last-wins duplicate could hide the
 * value another loader reads. The document must declare asset version 2.0 and
 * a forest of nodes; every index it uses must resolve; buffers, buffer views,
 * accessors, sparse ranges and images must fit their declared and resident
 * bytes; and every non-data sidecar must come back from `resolveResource` with
 * the declared length. The selected profile then adds its own requirements, as
 * {@link AutoMovieExternalModelIngestProfile} lists. The inspector never
 * guesses a profile or repairs input: the first violation throws with the JSON
 * path it concerns.
 *
 * Under `vrm-humanoid-v1`, `VRMC_vrm` is read with VRM 1.0 bone names, so a
 * 1.0-beta file that still writes thumbs the VRM 0.x way is read as 1.0.
 *
 * @param props.path Project-relative source path; its suffix selects the
 *   container.
 * @param props.bytes Resident container bytes; they are only read.
 * @param props.profile Caller-selected profile, refused unless supported.
 * @param props.resolveResource Returns a sidecar's bytes for a URI, or `null`
 *   when the builder has none; it is called once per buffer and image URI
 *   entry.
 * @returns New facts that hold no reference to the input bytes.
 *
 * @evidence contracts/common.md#principled-implementation The inspector follows the glTF 2.0 and GLB container rules: strict UTF-8 JSON with duplicate members refused by an iterative scan, index validation for every reference, forest and cycle checks by iterative parent walks, accessor and sparse ranges from component sizes with matrix column padding, payload lengths against declared buffers, and VRM 0.x thumbs migrated to VRM 1.0 slots by the published rename; its one stated limitation is reading `VRMC_vrm` 1.0-beta thumb names as 1.0.
 * @evidence contracts/common.md#clear-and-simple-design The exported function sequences structural checks, payload closure and profile inspection, with each concern in a private helper of this file and name aliases in the shared internal module; the file still exceeds the repository's 500-line limit and exports several symbols, a structural split left open.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Profiles and container suffixes are contract constants, no model or path is special-cased, the alias table is a `Map` so inherited names never resolve, and every refusal is the first violation found rather than a repaired value.
 * @evidence contracts/common.md#meaningful-documentation The documentation states how the container is chosen, every structural requirement, the duplicate-member reason, the no-guess no-repair rule, the VRM 1.0-beta limitation, each parameter's role and call frequency, and that the result holds no byte reference.
 * @evidence contracts/performance.md#efficient-algorithms Cost is linear in container bytes for the UTF-8 decode, the JSON parse and one duplicate scan, plus the declared array sizes, plus skinned vertices for weight checks and keyframe values for motion; each accessor's view, stride and `DataView` are resolved once per accessor read instead of once per component, and the GLB bytes are no longer copied.
 * @evidence contracts/performance.md#reuse-equivalent-work Within one inspection, a motion accessor is decoded once per accessor and type and shared by every channel that cites it, each track receiving its own copy, and a mesh and skin pair bound on several nodes is weight-checked once; the key is the accessor index or pair, which is valid because the document is immutable during the synchronous call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The decoded JSON, payload list, readers and caches live only for the call and are released on return or throw; the result retains copies proportional to resources, slots and motion data, and keeps neither the container nor sidecar bytes.
 * @author Samchon
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
  if (isAutoMovieExternalModelIngestProfile(props.profile) === false)
    throw new Error(
      `Unsupported external-model ingest profile "${props.profile}".`,
    );
  const profile: AutoMovieExternalModelIngestProfile =
    props.profile as AutoMovieExternalModelIngestProfile;
  const extension: string = fileExtension(props.path);
  if (extension !== ".gltf" && extension !== ".glb" && extension !== ".vrm")
    throw new Error(
      `External model "${props.path}" must end in .gltf, .glb, or .vrm.`,
    );
  const parsed: IParsedContainer =
    extension === ".gltf"
      ? { json: decodeJson(props.bytes), format: "gltf", bin: null }
      : decodeGlb(props.bytes, extension === ".vrm");
  const document: Record<string, unknown> = object(parsed.json, "glTF root");
  const asset: Record<string, unknown> = object(document.asset, "glTF asset");
  if (asset.version !== "2.0")
    throw new Error('External models must declare glTF asset.version "2.0".');

  const nodes: unknown[] = optionalArray(document.nodes, "nodes");
  const meshes: unknown[] = optionalArray(document.meshes, "meshes");
  const skins: unknown[] = optionalArray(document.skins, "skins");
  const animations: unknown[] = optionalArray(
    document.animations,
    "animations",
  );
  const scenes: unknown[] = optionalArray(document.scenes, "scenes");
  const buffers: unknown[] = optionalArray(document.buffers, "buffers");
  const bufferViews: unknown[] = optionalArray(
    document.bufferViews,
    "bufferViews",
  );
  const accessors: unknown[] = optionalArray(document.accessors, "accessors");
  const images: unknown[] = optionalArray(document.images, "images");

  nodes.forEach((value: unknown, index: number): void => {
    const node: Record<string, unknown> = object(value, `nodes[${index}]`);
    integerIndex(node.mesh, meshes.length, `nodes[${index}].mesh`);
    integerIndex(node.skin, skins.length, `nodes[${index}].skin`);
    integerIndices(node.children, nodes.length, `nodes[${index}].children`);
  });
  const parentByIndex: Array<number | undefined> =
    inspectExternalModelHierarchy(nodes);
  scenes.forEach((value: unknown, index: number): void => {
    const path: string = `scenes[${index}].nodes`;
    const roots: unknown = object(value, `scenes[${index}]`).nodes;
    integerIndices(roots, nodes.length, path);
    const seen: Set<number> = new Set<number>();
    optionalArray(roots, path).forEach(
      (entry: unknown, rootIndex: number): void => {
        const nodeIndex: number = entry as number;
        if (seen.has(nodeIndex))
          throw new Error(
            `${path}[${rootIndex}] repeats root node ${nodeIndex}.`,
          );
        if (parentByIndex[nodeIndex] !== undefined)
          throw new Error(
            `${path}[${rootIndex}] references non-root node ${nodeIndex}.`,
          );
        seen.add(nodeIndex);
      },
    );
  });
  integerIndex(document.scene, scenes.length, "scene");
  buffers.forEach((value: unknown, index: number): void => {
    const buffer: Record<string, unknown> = object(value, `buffers[${index}]`);
    positiveInteger(buffer.byteLength, `buffers[${index}].byteLength`);
    if (parsed.format === "gltf" && buffer.uri === undefined)
      throw new Error(
        `buffers[${index}].uri is required by a JSON glTF container.`,
      );
  });
  meshes.forEach((value: unknown, meshIndex: number): void => {
    const mesh: Record<string, unknown> = object(value, `meshes[${meshIndex}]`);
    const primitives: unknown[] = requiredArray(
      mesh.primitives,
      `meshes[${meshIndex}].primitives`,
    );
    if (primitives.length === 0)
      throw new Error(`meshes[${meshIndex}] has no render primitive.`);
    primitives.forEach((primitiveValue: unknown, primitiveIndex: number): void => {
      const path: string = `meshes[${meshIndex}].primitives[${primitiveIndex}]`;
      const primitive: Record<string, unknown> = object(primitiveValue, path);
      const attributes: Record<string, unknown> = object(
        primitive.attributes,
        `${path}.attributes`,
      );
      integerIndex(
        attributes.POSITION,
        accessors.length,
        `${path}.attributes.POSITION`,
        true,
      );
      integerIndex(primitive.indices, accessors.length, `${path}.indices`);
    });
  });
  skins.forEach((value: unknown, index: number): void => {
    const skin: Record<string, unknown> = object(value, `skins[${index}]`);
    const joints: unknown[] = requiredArray(
      skin.joints,
      `skins[${index}].joints`,
    );
    if (joints.length === 0) throw new Error(`skins[${index}] has no joints.`);
    integerIndices(joints, nodes.length, `skins[${index}].joints`);
  });
  bufferViews.forEach((value: unknown, index: number): void => {
    const view: Record<string, unknown> = object(
      value,
      `bufferViews[${index}]`,
    );
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
  accessors.forEach((value: unknown, index: number): void => {
    const accessor: Record<string, unknown> = object(
      value,
      `accessors[${index}]`,
    );
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
      COMPONENT_BYTES.has(accessor.componentType) === false ||
      typeof accessor.type !== "string" ||
      Object.hasOwn(SHAPE_COMPONENTS, accessor.type) === false
    )
      throw new Error(
        `accessors[${index}] has an unsupported componentType or shape.`,
      );
    validateAccessorRange(accessor, index, bufferViews);
    validateSparseAccessor(accessor, index, bufferViews);
  });
  images.forEach((value: unknown, index: number): void => {
    const image: Record<string, unknown> = object(value, `images[${index}]`);
    if (image.uri === undefined)
      integerIndex(
        image.bufferView,
        bufferViews.length,
        `images[${index}].bufferView`,
        true,
      );
  });

  const extensions: string[] = uniqueStrings([
    ...optionalStringArray(document.extensionsUsed, "extensionsUsed"),
    ...Object.keys(optionalObject(document.extensions, "extensions")),
  ]);
  const resources: IAutoMovieExternalModelResource[] =
    collectExternalResources(buffers, images);
  const payloads: Uint8Array[] = validatePayloadClosure({
    format: parsed.format,
    bin: parsed.bin,
    buffers,
    bufferViews,
    images,
    resolveResource: props.resolveResource,
  });
  const source: IAccessorSource = { accessors, bufferViews, payloads };
  const motion: IAutoMovieExternalMotionInspection | undefined =
    profile === "gltf-motion-v1"
      ? inspectExternalMotion({
          path: props.path,
          byteLength: props.bytes.byteLength,
          animations,
          nodes,
          parentByIndex,
          source,
        })
      : undefined;
  if (profile === "gltf-motion-v1" && motion === undefined)
    throw new Error(
      'Profile "gltf-motion-v1" requires at least one animation.',
    );
  if (profile !== "gltf-motion-v1" && meshes.length === 0)
    throw new Error("External model has no mesh to render or review.");
  const humanoidMapping: IHumanoidSlot[] =
    profile === "gltf-humanoid-v1"
      ? gltfHumanoidBones(nodes, skins)
      : profile === "vrm-humanoid-v1"
        ? vrmHumanoidBones(document, nodes)
        : [];
  if (
    profile === "gltf-humanoid-v1" &&
    (skins.length === 0 ||
      humanoidMapping.some((slot: IHumanoidSlot): boolean => slot.bone === "hips") ===
        false)
  )
    throw new Error(
      'Profile "gltf-humanoid-v1" requires a skin and a normalized hips/pelvis joint.',
    );
  const weightedNodes: Set<number> =
    profile === "gltf-static-v1" || profile === "gltf-motion-v1"
      ? new Set<number>()
      : validateHumanoidSkinning({ nodes, meshes, skins, source });
  const vrm: boolean = extensions.some(
    (name: string): boolean => name === "VRM" || name === "VRMC_vrm",
  );
  if (
    profile === "vrm-humanoid-v1" &&
    (parsed.format === "gltf" ||
      vrm === false ||
      skins.length === 0 ||
      humanoidMapping.some((slot: IHumanoidSlot): boolean => slot.bone === "hips") ===
        false)
  )
    throw new Error(
      'Profile "vrm-humanoid-v1" requires a GLB/VRM container with VRM or VRMC_vrm metadata.',
    );

  return {
    profile,
    format: vrm ? "vrm" : parsed.format,
    version: "2.0",
    counts: {
      nodes: nodes.length,
      meshes: meshes.length,
      skins: skins.length,
      animations: animations.length,
    },
    extensions,
    resources,
    humanoidBones: humanoidMapping.map(
      (slot: IHumanoidSlot): IAutoMovieExternalModelInspection["humanoidBones"][number] => ({
        ...slot,
        weighted: weightedNodes.has(slot.node),
      }),
    ),
    ...(motion === undefined ? {} : { motion }),
  };
};

interface IParsedContainer {
  json: unknown;
  format: "gltf" | "glb" | "vrm";
  bin: Uint8Array | null;
}

/** The validated arrays and resident buffers accessor reads resolve against. */
interface IAccessorSource {
  accessors: unknown[];
  bufferViews: unknown[];
  payloads: Uint8Array[];
}

interface IHumanoidSlot {
  bone: AutoMovieHumanoidBone;
  node: number;
}

type AutoMovieMotionTargetPath =
  | "translation"
  | "rotation"
  | "scale"
  | "weights";

/** Accessor shape each target path's output must use. */
const MOTION_OUTPUT_TYPES: Readonly<
  Record<AutoMovieMotionTargetPath, "SCALAR" | "VEC3" | "VEC4">
> = {
  translation: "VEC3",
  rotation: "VEC4",
  scale: "VEC3",
  weights: "SCALAR",
};

/** Bytes per component for each glTF component type. */
const COMPONENT_BYTES: ReadonlyMap<number, number> = new Map<number, number>([
  [5120, 1],
  [5121, 1],
  [5122, 2],
  [5123, 2],
  [5125, 4],
  [5126, 4],
]);

/** Components per element for each glTF accessor shape. */
const SHAPE_COMPONENTS: Readonly<Record<string, number>> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

const inspectExternalMotion = (props: {
  path: string;
  byteLength: number;
  animations: unknown[];
  nodes: unknown[];
  parentByIndex: readonly (number | undefined)[];
  source: IAccessorSource;
}): IAutoMovieExternalMotionInspection | undefined => {
  if (props.animations.length === 0) return undefined;
  const nodes: IAutoMovieExternalMotionNodeInspection[] =
    inspectExternalMotionNodes(props.nodes, props.parentByIndex);
  const nodeIds: string[] = nodes.map(
    (node: IAutoMovieExternalMotionNodeInspection): string => node.id,
  );
  // Exporters commonly share one keyframe-time accessor across channels, so
  // each accessor is decoded and checked once per inspection; every track
  // still receives its own copy.
  const decoded: Map<string, number[]> = new Map<string, number[]>();
  const readOnce = (
    accessorIndex: number,
    expectedType: "SCALAR" | "VEC3" | "VEC4",
    path: string,
  ): number[] => {
    const key: string = `${accessorIndex}:${expectedType}`;
    let values: number[] | undefined = decoded.get(key);
    if (values === undefined) {
      values = readMotionAccessor(
        props.source,
        accessorIndex,
        expectedType,
        path,
      );
      decoded.set(key, values);
    }
    return values.slice();
  };
  const takes: IAutoMovieClip[] = props.animations.map(
    (value: unknown, animationIndex: number): IAutoMovieClip => {
      const animation: Record<string, unknown> = object(
        value,
        `animations[${animationIndex}]`,
      );
      const samplers: unknown[] = requiredArray(
        animation.samplers,
        `animations[${animationIndex}].samplers`,
      );
      const channels: unknown[] = requiredArray(
        animation.channels,
        `animations[${animationIndex}].channels`,
      );
      if (samplers.length === 0 || channels.length === 0)
        throw new Error(
          `animations[${animationIndex}] needs at least one sampler and channel.`,
        );
      const targets: Set<string> = new Set<string>();
      const tracks: IAutoMovieTrack[] = channels.map(
        (channelValue: unknown, channelIndex: number): IAutoMovieTrack => {
          const channelPath: string = `animations[${animationIndex}].channels[${channelIndex}]`;
          const channel: Record<string, unknown> = object(
            channelValue,
            channelPath,
          );
          integerIndex(
            channel.sampler,
            samplers.length,
            `${channelPath}.sampler`,
            true,
          );
          const target: Record<string, unknown> = object(
            channel.target,
            `${channelPath}.target`,
          );
          integerIndex(
            target.node,
            props.nodes.length,
            `${channelPath}.target.node`,
            true,
          );
          if (
            typeof target.path !== "string" ||
            Object.hasOwn(MOTION_OUTPUT_TYPES, target.path) === false
          )
            throw new Error(
              `${channelPath}.target.path must be translation, rotation, scale, or weights.`,
            );
          const targetPath: AutoMovieMotionTargetPath =
            target.path as AutoMovieMotionTargetPath;
          const targetKey: string = `${String(target.node)}\u0000${targetPath}`;
          if (targets.has(targetKey))
            throw new Error(
              `${channelPath} duplicates the ${targetPath} channel for node ${String(target.node)}.`,
            );
          targets.add(targetKey);

          const samplerPath: string = `animations[${animationIndex}].samplers[${String(channel.sampler)}]`;
          const sampler: Record<string, unknown> = object(
            samplers[channel.sampler as number],
            samplerPath,
          );
          integerIndex(
            sampler.input,
            props.source.accessors.length,
            `${samplerPath}.input`,
            true,
          );
          integerIndex(
            sampler.output,
            props.source.accessors.length,
            `${samplerPath}.output`,
            true,
          );
          const interpolation: IAutoMovieTrack["interpolation"] =
            motionInterpolation(
              sampler.interpolation,
              `${samplerPath}.interpolation`,
            );
          const times: number[] = readOnce(
            sampler.input as number,
            "SCALAR",
            `${samplerPath}.input`,
          );
          const values: number[] = readOnce(
            sampler.output as number,
            MOTION_OUTPUT_TYPES[targetPath],
            `${samplerPath}.output`,
          );
          validateMotionTimes(times, `${samplerPath}.input`);
          validateMotionOutput({
            path: `${samplerPath}.output`,
            targetPath,
            interpolation,
            keyframes: times.length,
            values,
          });
          return {
            channel: {
              kind: "node",
              node: nodeIds[target.node as number]!,
              path: targetPath,
            },
            times,
            values,
            interpolation,
          };
        },
      );
      const name: unknown = animation.name;
      if (name !== undefined && typeof name !== "string")
        throw new Error(
          `animations[${animationIndex}].name must be a string.`,
        );
      return {
        id: `clip_${animationIndex}`,
        name: name === undefined || name.length === 0 ? null : name,
        duration: tracks.reduce(
          (maximum: number, track: IAutoMovieTrack): number =>
            Math.max(maximum, track.times[track.times.length - 1]!),
          0,
        ),
        loop: false,
        tracks,
      };
    },
  );
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
  const parentByIndex: Array<number | undefined> = new Array<
    number | undefined
  >(values.length);
  values.forEach((value: unknown, parentIndex: number): void => {
    const node: Record<string, unknown> = object(
      value,
      `nodes[${parentIndex}]`,
    );
    optionalArray(node.children, `nodes[${parentIndex}].children`).forEach(
      (entry: unknown): void => {
        const childIndex: number = entry as number;
        const previous: number | undefined = parentByIndex[childIndex];
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

  // 0 = unvisited, 1 = on the current walk, 2 = proven to reach a root.
  const state: Uint8Array = new Uint8Array(values.length);
  for (let start: number = 0; start < values.length; ++start) {
    if (state[start] !== 0) continue;
    const path: number[] = [];
    let index: number | undefined = start;
    while (index !== undefined && state[index] === 0) {
      state[index] = 1;
      path.push(index);
      index = parentByIndex[index];
    }
    if (index !== undefined && state[index] === 1)
      throw new Error(`nodes[${index}] belongs to a parent cycle.`);
    for (const entry of path) state[entry] = 2;
  }
  return parentByIndex;
};

const inspectExternalMotionNodes = (
  values: unknown[],
  parentByIndex: readonly (number | undefined)[],
): IAutoMovieExternalMotionNodeInspection[] =>
  values.map(
    (value: unknown, index: number): IAutoMovieExternalMotionNodeInspection => {
      const node: Record<string, unknown> = object(value, `nodes[${index}]`);
      if (node.matrix !== undefined)
        throw new Error(
          `nodes[${index}].matrix is unsupported by the glTF motion interpretation profile; declare translation, rotation, and scale explicitly.`,
        );
      if (node.name !== undefined && typeof node.name !== "string")
        throw new Error(`nodes[${index}].name must be a string.`);
      const translation: number[] = finiteTuple(
        node.translation,
        `nodes[${index}].translation`,
        [0, 0, 0],
      );
      const rotation: number[] = finiteTuple(
        node.rotation,
        `nodes[${index}].rotation`,
        [0, 0, 0, 1],
      );
      const scale: number[] = finiteTuple(
        node.scale,
        `nodes[${index}].scale`,
        [1, 1, 1],
      );
      if (scale.some((component: number): boolean => component <= 0))
        throw new Error(
          `nodes[${index}].scale must contain only positive values.`,
        );
      const magnitude: number = Math.hypot(...rotation);
      if (Math.abs(magnitude - 1) > 1e-4)
        throw new Error(`nodes[${index}].rotation must be a unit quaternion.`);
      const parent: number | undefined = parentByIndex[index];
      return {
        id: `node_${index}`,
        index,
        name:
          typeof node.name === "string" && node.name.length !== 0
            ? node.name
            : null,
        parent: parent === undefined ? null : `node_${parent}`,
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
    },
  );

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
  return (value as unknown[]).map((entry: unknown, index: number): number => {
    if (typeof entry !== "number" || Number.isFinite(entry) === false)
      throw new Error(`${path}[${index}] must be finite.`);
    return entry;
  });
};

const motionInterpolation = (
  value: unknown,
  path: string,
): IAutoMovieTrack["interpolation"] => {
  if (value === undefined || value === "LINEAR") return "linear";
  if (value === "STEP") return "step";
  if (value === "CUBICSPLINE") return "cubicspline";
  throw new Error(`${path} must be LINEAR, STEP, or CUBICSPLINE.`);
};

const readMotionAccessor = (
  source: IAccessorSource,
  accessorIndex: number,
  expectedType: "SCALAR" | "VEC3" | "VEC4",
  path: string,
): number[] => {
  const accessor: Record<string, unknown> = object(
    source.accessors[accessorIndex],
    `accessors[${accessorIndex}]`,
  );
  if (
    accessor.componentType !== 5126 ||
    accessor.type !== expectedType ||
    accessor.bufferView === undefined ||
    accessor.sparse !== undefined
  )
    throw new Error(
      `${path} must resolve to a non-sparse FLOAT ${expectedType} accessor.`,
    );
  const width: number = SHAPE_COMPONENTS[expectedType]!;
  const count: number = accessor.count as number;
  const read: AccessorReader = accessorReader(
    source,
    accessorIndex,
    `Motion accessor ${accessorIndex}`,
  );
  const values: number[] = new Array<number>(count * width);
  for (let element: number = 0; element < count; ++element)
    for (let component: number = 0; component < width; ++component) {
      const value: number = read(element, component);
      if (Number.isFinite(value) === false)
        throw new Error(`${path} contains a non-finite value.`);
      values[element * width + component] = value;
    }
  return values;
};

const validateMotionTimes = (times: number[], path: string): void => {
  for (let index: number = 0; index < times.length; ++index)
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
  const factor: number = props.interpolation === "cubicspline" ? 3 : 1;
  const width: number | null =
    props.targetPath === "weights"
      ? null
      : SHAPE_COMPONENTS[MOTION_OUTPUT_TYPES[props.targetPath]]!;
  const group: number = props.keyframes * factor;
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
  for (let frame: number = 0; frame < props.keyframes; ++frame) {
    // A cubic-spline keyframe stores in-tangent, value, out-tangent; only the
    // value must be a unit quaternion.
    const at: number =
      (props.interpolation === "cubicspline" ? frame * 3 + 1 : frame) * 4;
    const magnitude: number = Math.hypot(
      props.values[at]!,
      props.values[at + 1]!,
      props.values[at + 2]!,
      props.values[at + 3]!,
    );
    if (Math.abs(magnitude - 1) > 1e-4)
      throw new Error(`${props.path} contains a non-unit rotation keyframe.`);
  }
};

const GLB_MAGIC: number = 0x46546c67;
const GLB_JSON_CHUNK: number = 0x4e4f534a;
const GLB_BIN_CHUNK: number = 0x004e4942;

/**
 * Split a GLB 2.0 container into its JSON and optional BIN chunk. The BIN view
 * aliases the input bytes, which the synchronous inspection only reads.
 */
const decodeGlb = (
  bytes: Uint8Array,
  vrmExtension: boolean,
): IParsedContainer => {
  if (bytes.byteLength < 20)
    throw new Error("GLB/VRM container is shorter than its mandatory header.");
  const view: DataView = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  if (view.getUint32(0, true) !== GLB_MAGIC)
    throw new Error("GLB/VRM container has an invalid magic value.");
  if (view.getUint32(4, true) !== 2)
    throw new Error("Only GLB container version 2 is supported.");
  if (view.getUint32(8, true) !== bytes.byteLength)
    throw new Error("GLB declared length does not match resident bytes.");
  const jsonLength: number = view.getUint32(12, true);
  if (
    jsonLength === 0 ||
    jsonLength % 4 !== 0 ||
    view.getUint32(16, true) !== GLB_JSON_CHUNK ||
    20 + jsonLength > bytes.byteLength
  )
    throw new Error("GLB first chunk is not one aligned JSON chunk.");
  let cursor: number = 20 + jsonLength;
  let bin: Uint8Array | null = null;
  while (cursor < bytes.byteLength) {
    if (cursor + 8 > bytes.byteLength)
      throw new Error("GLB contains a truncated chunk header.");
    const length: number = view.getUint32(cursor, true);
    if (length % 4 !== 0 || cursor + 8 + length > bytes.byteLength)
      throw new Error("GLB contains an unaligned or truncated chunk.");
    const type: number = view.getUint32(cursor + 4, true);
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

/** Decode strict UTF-8 JSON and refuse duplicate member names. */
const decodeJson = (bytes: Uint8Array): unknown => {
  try {
    const text: string = new TextDecoder("utf-8", { fatal: true }).decode(
      bytes,
    );
    const value: unknown = JSON.parse(text);
    assertUniqueJsonObjectMembers(text);
    return value;
  } catch (error) {
    throw new Error(
      `External model JSON is invalid: ${(error as Error).message}.`,
    );
  }
};

/**
 * Refuse decoded-equivalent member names before last-wins JSON can hide one.
 *
 * The scan runs only over text `JSON.parse` has already accepted, so it needs
 * no syntax checks: one pass keeps a stack of open containers, with a name set
 * for each object, and treats the string after `{` or after `,` inside an
 * object as a member name. A name containing an escape is decoded through
 * `JSON.parse`, so an escaped spelling collides with its plain spelling. The
 * stack replaces recursion, so nesting depth never becomes call-stack depth.
 * It lives here rather than reusing the production package's structured JSON
 * ingress because ingest depends on `@automovie/interface` alone and
 * production sits above it in the dependency graph.
 */
const assertUniqueJsonObjectMembers = (text: string): void => {
  const scopes: Array<Set<string> | null> = [];
  let expectName: boolean = false;
  let cursor: number = 0;
  while (cursor < text.length) {
    const code: number = text.charCodeAt(cursor);
    if (code === 0x22) {
      const start: number = cursor;
      let escaped: boolean = false;
      ++cursor;
      while (text.charCodeAt(cursor) !== 0x22) {
        if (text.charCodeAt(cursor) === 0x5c) {
          escaped = true;
          ++cursor;
        }
        ++cursor;
      }
      ++cursor;
      if (expectName) {
        const name: string = escaped
          ? (JSON.parse(text.slice(start, cursor)) as string)
          : text.slice(start + 1, cursor - 1);
        const names: Set<string> = scopes[scopes.length - 1]!;
        if (names.has(name))
          throw new Error(`duplicate member ${JSON.stringify(name)}`);
        names.add(name);
        expectName = false;
      }
      continue;
    }
    if (code === 0x7b) {
      scopes.push(new Set<string>());
      expectName = true;
    } else if (code === 0x5b) scopes.push(null);
    else if (code === 0x7d || code === 0x5d) {
      scopes.pop();
      expectName = false;
    }
    else if (code === 0x2c) expectName = scopes[scopes.length - 1] !== null;
    ++cursor;
  }
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
  return value as unknown[];
};

const optionalArray = (value: unknown, path: string): unknown[] =>
  value === undefined ? [] : requiredArray(value, path);

const optionalStringArray = (value: unknown, path: string): string[] =>
  optionalArray(value, path).map((entry: unknown, index: number): string => {
    if (typeof entry !== "string" || entry.trim().length === 0)
      throw new Error(`${path}[${index}] must be a non-blank string.`);
    return entry;
  });

const integerIndex = (
  value: unknown,
  length: number,
  path: string,
  required: boolean = false,
): void => {
  if (value === undefined && required === false) return;
  if (validNodeIndex(value, length) === false)
    throw new Error(`${path} does not resolve inside its declared inventory.`);
};

const integerIndices = (value: unknown, length: number, path: string): void => {
  if (value === undefined) return;
  requiredArray(value, path).forEach((entry: unknown, index: number): void =>
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
  [...new Set<string>(values)].sort(compareCodeUnits);

const compareCodeUnits = (left: string, right: string): number =>
  Number(left > right) - Number(left < right);

const fileExtension = (value: string): string => {
  const name: string = value.slice(value.lastIndexOf("/") + 1);
  const index: number = name.lastIndexOf(".");
  return index < 0 ? "" : name.slice(index).toLowerCase();
};

const collectExternalResources = (
  buffers: unknown[],
  images: unknown[],
): IAutoMovieExternalModelResource[] => {
  const byUri: Map<string, IAutoMovieExternalModelResource> = new Map<
    string,
    IAutoMovieExternalModelResource
  >();
  buffers.forEach((value: unknown, index: number): void => {
    const buffer: Record<string, unknown> = object(value, `buffers[${index}]`);
    const uri: string | null = externalUri(
      buffer.uri,
      `buffers[${index}].uri`,
    );
    if (uri === null) return;
    const byteLength: number = buffer.byteLength as number;
    const prior: IAutoMovieExternalModelResource | undefined = byUri.get(uri);
    if (
      prior !== undefined &&
      (prior.kind !== "buffer" || prior.byteLength !== byteLength)
    )
      throw new Error(
        `External URI "${uri}" is declared with conflicting resource roles or lengths.`,
      );
    byUri.set(uri, { uri, kind: "buffer", byteLength });
  });
  images.forEach((value: unknown, index: number): void => {
    const image: Record<string, unknown> = object(value, `images[${index}]`);
    const uri: string | null = externalUri(image.uri, `images[${index}].uri`);
    if (uri === null) return;
    const prior: IAutoMovieExternalModelResource | undefined = byUri.get(uri);
    if (prior !== undefined && prior.kind !== "image")
      throw new Error(
        `External URI "${uri}" is declared as both a buffer and an image.`,
      );
    byUri.set(uri, { uri, kind: "image", byteLength: null });
  });
  return [...byUri.values()].sort(
    (
      left: IAutoMovieExternalModelResource,
      right: IAutoMovieExternalModelResource,
    ): number => compareCodeUnits(left.uri, right.uri),
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
  const payloads: Uint8Array[] = props.buffers.map(
    (value: unknown, index: number): Uint8Array => {
      const buffer: Record<string, unknown> = object(
        value,
        `buffers[${index}]`,
      );
      const length: number = buffer.byteLength as number;
      if (buffer.uri === undefined) {
        if (props.format === "gltf" || index !== 0)
          throw new Error(
            `buffers[${index}] cannot use the GLB BIN chunk in this container.`,
          );
        if (props.bin === null)
          throw new Error(
            `buffers[${index}] declares ${length} bytes but the GLB has no BIN chunk.`,
          );
        if (
          props.bin.byteLength < length ||
          props.bin.byteLength > length + 3
        )
          throw new Error(
            `GLB BIN chunk length ${props.bin.byteLength} does not cover buffers[${index}].byteLength ${length} with at most three padding bytes.`,
          );
        return props.bin;
      }
      const uri: string = buffer.uri as string;
      if (uri.startsWith("data:")) {
        const bytes: Uint8Array = decodeDataUri(uri, `buffers[${index}].uri`);
        if (bytes.byteLength !== length)
          throw new Error(
            `buffers[${index}] data URI has ${bytes.byteLength} bytes, not declared byteLength ${length}.`,
          );
        return bytes;
      }
      const bytes: Uint8Array | null = props.resolveResource?.(uri) ?? null;
      if (bytes === null)
        throw new Error(
          `External buffer "${uri}" has no builder-resolved resident bytes.`,
        );
      if (bytes.byteLength !== length)
        throw new Error(
          `External buffer "${uri}" has ${bytes.byteLength} bytes, not declared byteLength ${length}.`,
        );
      return bytes;
    },
  );
  if (props.bin !== null && props.buffers.length === 0)
    throw new Error("GLB contains a BIN chunk but declares no buffer.");
  if (
    props.bin !== null &&
    object(props.buffers[0], "buffers[0]").uri !== undefined
  )
    throw new Error(
      "GLB BIN chunk is orphaned because buffers[0] declares an external URI.",
    );
  props.bufferViews.forEach((value: unknown, index: number): void => {
    const view: Record<string, unknown> = object(
      value,
      `bufferViews[${index}]`,
    );
    const bufferIndex: number = view.buffer as number;
    const offset: number = (view.byteOffset as number | undefined) ?? 0;
    const length: number = view.byteLength as number;
    const declared: number = object(
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
  props.images.forEach((value: unknown, index: number): void => {
    const image: Record<string, unknown> = object(value, `images[${index}]`);
    if (typeof image.uri !== "string") return;
    const bytes: Uint8Array | null = image.uri.startsWith("data:")
      ? decodeDataUri(image.uri, `images[${index}].uri`)
      : (props.resolveResource?.(image.uri) ?? null);
    if (bytes === null || bytes.byteLength === 0)
      throw new Error(
        `External image "${image.uri}" has no non-empty builder-resolved resident bytes.`,
      );
  });
  return payloads;
};

/**
 * Decode an RFC 2397 data URI's payload: canonical base64 when the metadata
 * carries `;base64`, otherwise `%XX` escapes as octets and every other
 * character as its UTF-8 bytes, whole code points at a time.
 */
const decodeDataUri = (uri: string, path: string): Uint8Array => {
  const comma: number = uri.indexOf(",");
  if (comma < 5) throw new Error(`${path} is not a complete data URI.`);
  const metadata: string = uri.slice(5, comma);
  const payload: string = uri.slice(comma + 1);
  try {
    if (metadata.split(";").includes("base64")) {
      if (
        payload.length % 4 !== 0 ||
        /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(
          payload,
        ) === false
      )
        throw new Error("base64 payload is not canonical");
      const binary: string = atob(payload);
      const bytes: Uint8Array = new Uint8Array(binary.length);
      for (let index: number = 0; index < binary.length; ++index)
        bytes[index] = binary.charCodeAt(index);
      return bytes;
    }
    const encoder: TextEncoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    let literal: number = 0;
    for (let index: number = 0; index < payload.length; ++index) {
      if (payload.charCodeAt(index) !== 0x25) continue;
      const hex: string = payload.slice(index + 1, index + 3);
      if (/^[0-9A-Fa-f]{2}$/u.test(hex) === false)
        throw new Error("percent escape is incomplete");
      chunks.push(
        encoder.encode(payload.slice(literal, index)),
        Uint8Array.of(Number.parseInt(hex, 16)),
      );
      index += 2;
      literal = index + 1;
    }
    chunks.push(encoder.encode(payload.slice(literal)));
    const output: Uint8Array = new Uint8Array(
      chunks.reduce(
        (total: number, chunk: Uint8Array): number => total + chunk.byteLength,
        0,
      ),
    );
    let offset: number = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return output;
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
  const view: Record<string, unknown> = object(
    bufferViews[accessor.bufferView as number],
    `bufferViews[${accessor.bufferView as number}]`,
  );
  const element: number = accessorElementByteLength(
    accessor.componentType as number,
    accessor.type as string,
  );
  const stride: number = (view.byteStride as number | undefined) ?? element;
  if (stride < element)
    throw new Error(
      `accessors[${index}] element size ${element} exceeds bufferView byteStride ${stride}.`,
    );
  const offset: number = (accessor.byteOffset as number | undefined) ?? 0;
  const count: number = accessor.count as number;
  const end: number = offset + (count - 1) * stride + element;
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
  const sparse: Record<string, unknown> = object(
    accessor.sparse,
    `accessors[${index}].sparse`,
  );
  positiveInteger(sparse.count, `accessors[${index}].sparse.count`);
  if ((sparse.count as number) > (accessor.count as number))
    throw new Error(
      `accessors[${index}].sparse.count exceeds the accessor count.`,
    );
  const indices: Record<string, unknown> = object(
    sparse.indices,
    `accessors[${index}].sparse.indices`,
  );
  const values: Record<string, unknown> = object(
    sparse.values,
    `accessors[${index}].sparse.values`,
  );
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
    indices.componentType !== 5121 &&
    indices.componentType !== 5123 &&
    indices.componentType !== 5125
  )
    throw new Error(
      `accessors[${index}].sparse.indices.componentType must be unsigned byte, short or int.`,
    );
  const count: number = sparse.count as number;
  validateSubViewRange(
    bufferViews,
    indices.bufferView as number,
    (indices.byteOffset as number | undefined) ?? 0,
    count * COMPONENT_BYTES.get(indices.componentType as number)!,
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
  const view: Record<string, unknown> = object(
    bufferViews[viewIndex],
    `bufferViews[${viewIndex}]`,
  );
  if (offset + length > (view.byteLength as number))
    throw new Error(`${path} exceeds its bufferView range.`);
};

/**
 * Bytes one element occupies, including the padding glTF requires at the
 * start of each matrix column so columns stay 4-byte aligned.
 */
const accessorElementByteLength = (
  componentType: number,
  shape: string,
): number => {
  const component: number = COMPONENT_BYTES.get(componentType)!;
  if (shape === "MAT2" && component === 1) return 8;
  if (shape === "MAT3" && component === 1) return 12;
  if (shape === "MAT3" && component === 2) return 24;
  return component * SHAPE_COMPONENTS[shape]!;
};

/** Reads one component of one element, decoded to a number. */
type AccessorReader = (element: number, component: number) => number;

/**
 * Resolve an accessor's buffer view, stride and payload once and return a
 * reader over them. Only the unsigned byte, unsigned short and float component
 * types the skin and motion profiles admit are readable; normalized integers
 * decode as `c / max`.
 */
const accessorReader = (
  source: IAccessorSource,
  accessorIndex: number,
  role: string,
): AccessorReader => {
  const accessor: Record<string, unknown> = object(
    source.accessors[accessorIndex],
    `accessors[${accessorIndex}]`,
  );
  if (accessor.sparse !== undefined)
    throw new Error(
      `${role} may not use sparse overrides at the production ingest boundary.`,
    );
  const viewIndex: number = accessor.bufferView as number;
  const bufferView: Record<string, unknown> = object(
    source.bufferViews[viewIndex],
    `bufferViews[${viewIndex}]`,
  );
  const type: number = accessor.componentType as number;
  if (type !== 5121 && type !== 5123 && type !== 5126)
    throw new Error(
      `${role} uses componentType ${type}, which this profile does not read.`,
    );
  const size: number = COMPONENT_BYTES.get(type)!;
  const stride: number =
    (bufferView.byteStride as number | undefined) ??
    accessorElementByteLength(type, accessor.type as string);
  const base: number =
    ((bufferView.byteOffset as number | undefined) ?? 0) +
    ((accessor.byteOffset as number | undefined) ?? 0);
  const bytes: Uint8Array = source.payloads[bufferView.buffer as number]!;
  const data: DataView = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  const scale: number =
    accessor.normalized === true && type !== 5126
      ? type === 5121
        ? 1 / 255
        : 1 / 65535
      : 1;
  return (element: number, component: number): number => {
    const offset: number = base + element * stride + component * size;
    const value: number =
      type === 5121
        ? data.getUint8(offset)
        : type === 5123
          ? data.getUint16(offset, true)
          : data.getFloat32(offset, true);
    return scale === 1 ? value : value * scale;
  };
};

const validateHumanoidSkinning = (props: {
  nodes: unknown[];
  meshes: unknown[];
  skins: unknown[];
  source: IAccessorSource;
}): Set<number> => {
  let skinnedPrimitiveCount: number = 0;
  const weightedNodes: Set<number> = new Set<number>();
  // Instanced characters bind the same mesh and skin on several nodes; the
  // weights are the same, so each pair is read once.
  const checkedBindings: Set<string> = new Set<string>();
  props.nodes.forEach((value: unknown, nodeIndex: number): void => {
    const node: Record<string, unknown> = object(value, `nodes[${nodeIndex}]`);
    if (node.skin === undefined) return;
    if (node.mesh === undefined)
      throw new Error(
        `nodes[${nodeIndex}] binds a skin without a render mesh.`,
      );
    const skinIndex: number = node.skin as number;
    const meshIndex: number = node.mesh as number;
    const binding: string = `${meshIndex}:${skinIndex}`;
    if (checkedBindings.has(binding)) return;
    checkedBindings.add(binding);
    const joints: unknown[] = requiredArray(
      object(props.skins[skinIndex], `skins[${skinIndex}]`).joints,
      `skins[${skinIndex}].joints`,
    );
    const mesh: Record<string, unknown> = object(
      props.meshes[meshIndex],
      `meshes[${meshIndex}]`,
    );
    requiredArray(mesh.primitives, `meshes[${meshIndex}].primitives`).forEach(
      (primitiveValue: unknown, primitiveIndex: number): void => {
        const path: string = `meshes[${meshIndex}].primitives[${primitiveIndex}]`;
        const primitive: Record<string, unknown> = object(primitiveValue, path);
        const attributes: Record<string, unknown> = object(
          primitive.attributes,
          `${path}.attributes`,
        );
        integerIndex(
          attributes.JOINTS_0,
          props.source.accessors.length,
          `${path}.attributes.JOINTS_0`,
          true,
        );
        integerIndex(
          attributes.WEIGHTS_0,
          props.source.accessors.length,
          `${path}.attributes.WEIGHTS_0`,
          true,
        );
        const jointIndex: number = attributes.JOINTS_0 as number;
        const weightIndex: number = attributes.WEIGHTS_0 as number;
        const position: Record<string, unknown> = object(
          props.source.accessors[attributes.POSITION as number],
          `accessors[${attributes.POSITION as number}]`,
        );
        const jointAccessor: Record<string, unknown> = object(
          props.source.accessors[jointIndex],
          `accessors[${jointIndex}]`,
        );
        const weightAccessor: Record<string, unknown> = object(
          props.source.accessors[weightIndex],
          `accessors[${weightIndex}]`,
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
            `Skinned primitive ${meshIndex}:${primitiveIndex} needs count-matched JOINTS_0 and normalized WEIGHTS_0 VEC4 accessors.`,
          );
        const readWeight: AccessorReader = accessorReader(
          props.source,
          weightIndex,
          `Skin accessor ${weightIndex}`,
        );
        const readJoint: AccessorReader = accessorReader(
          props.source,
          jointIndex,
          `Skin accessor ${jointIndex}`,
        );
        for (
          let vertex: number = 0;
          vertex < (position.count as number);
          ++vertex
        ) {
          let weightSum: number = 0;
          for (let component: number = 0; component < 4; ++component) {
            const weight: number = readWeight(vertex, component);
            weightSum += weight;
            if ((weight > 0) === false) continue;
            const joint: number = readJoint(vertex, component);
            if (Number.isSafeInteger(joint) === false || joint >= joints.length)
              throw new Error(
                `Skinned primitive ${meshIndex}:${primitiveIndex} vertex ${vertex} cites joint ${joint} outside skin ${skinIndex}.`,
              );
            weightedNodes.add(joints[joint] as number);
          }
          if (Number.isFinite(weightSum) === false || weightSum <= 0)
            throw new Error(
              `Skinned primitive ${meshIndex}:${primitiveIndex} vertex ${vertex} has no positive skin weight.`,
            );
        }
        ++skinnedPrimitiveCount;
      },
    );
  });
  if (skinnedPrimitiveCount === 0)
    throw new Error(
      "Humanoid profiles require at least one mesh node with a complete skin binding.",
    );
  return weightedNodes;
};

const gltfHumanoidBones = (
  nodes: unknown[],
  skins: unknown[],
): IHumanoidSlot[] => {
  const joints: Set<unknown> = new Set<unknown>(
    skins.flatMap((value: unknown, index: number): unknown[] =>
      requiredArray(
        object(value, `skins[${index}]`).joints,
        `skins[${index}].joints`,
      ),
    ),
  );
  const used: Set<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>();
  const slots: IHumanoidSlot[] = [];
  nodes.forEach((value: unknown, index: number): void => {
    if (joints.has(index) === false) return;
    const name: unknown = object(value, `nodes[${index}]`).name;
    if (typeof name !== "string") return;
    const bone: AutoMovieHumanoidBone | undefined = humanoidBoneOfName(name);
    if (bone === undefined || used.has(bone)) return;
    used.add(bone);
    slots.push({ bone, node: index });
  });
  return slots;
};

const vrmHumanoidBones = (
  document: Record<string, unknown>,
  nodes: unknown[],
): IHumanoidSlot[] => {
  const extensions: Record<string, unknown> = optionalObject(
    document.extensions,
    "extensions",
  );
  if (extensions.VRMC_vrm !== undefined) {
    const vrm: Record<string, unknown> = object(
      extensions.VRMC_vrm,
      "extensions.VRMC_vrm",
    );
    const humanoid: Record<string, unknown> = object(
      vrm.humanoid,
      "extensions.VRMC_vrm.humanoid",
    );
    const bones: Record<string, unknown> = object(
      humanoid.humanBones,
      "extensions.VRMC_vrm.humanoid.humanBones",
    );
    return Object.entries(bones)
      .sort(
        ([left]: [string, unknown], [right]: [string, unknown]): number =>
          compareCodeUnits(left, right),
      )
      .map(([bone, value]: [string, unknown]): IHumanoidSlot => {
        if (Object.hasOwn(HUMANOID_BONES, bone) === false)
          throw new Error(`VRMC_vrm declares unknown humanoid bone "${bone}".`);
        const node: unknown = object(
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
    const vrm: Record<string, unknown> = object(
      extensions.VRM,
      "extensions.VRM",
    );
    const humanoid: Record<string, unknown> = object(
      vrm.humanoid,
      "extensions.VRM.humanoid",
    );
    const used: Set<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>();
    return requiredArray(
      humanoid.humanBones,
      "extensions.VRM.humanoid.humanBones",
    ).map((value: unknown, index: number): IHumanoidSlot => {
      const entry: Record<string, unknown> = object(
        value,
        `extensions.VRM.humanoid.humanBones[${index}]`,
      );
      const bone: AutoMovieHumanoidBone | undefined = vrm0Bone(entry.bone);
      if (
        bone === undefined ||
        validNodeIndex(entry.node, nodes.length) === false ||
        used.has(bone)
      )
        throw new Error(
          `VRM humanoid entry ${index} has an unknown, duplicate or dangling bone mapping.`,
        );
      used.add(bone);
      return { bone, node: entry.node as number };
    });
  }
  return [];
};

/**
 * Read a VRM 0.x bone name as its VRM 1.0 slot. VRM 1.0 renamed the thumb
 * chain, so 0.x `ThumbProximal` is the 1.0 `ThumbMetacarpal` and 0.x
 * `ThumbIntermediate` the 1.0 `ThumbProximal`; every other name is shared.
 */
const vrm0Bone = (value: unknown): AutoMovieHumanoidBone | undefined => {
  if (typeof value !== "string") return undefined;
  const migrated: string = Object.hasOwn(VRM0_THUMB_NAMES, value)
    ? VRM0_THUMB_NAMES[value]!
    : value;
  return Object.hasOwn(HUMANOID_BONES, migrated)
    ? (migrated as AutoMovieHumanoidBone)
    : undefined;
};

const VRM0_THUMB_NAMES: Readonly<Record<string, AutoMovieHumanoidBone>> = {
  leftThumbProximal: "leftThumbMetacarpal",
  leftThumbIntermediate: "leftThumbProximal",
  rightThumbProximal: "rightThumbMetacarpal",
  rightThumbIntermediate: "rightThumbProximal",
};

const validNodeIndex = (value: unknown, length: number): boolean =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  value < length;

/** Every humanoid slot; the `Record` type requires exactly the union's keys. */
const HUMANOID_BONES: Readonly<Record<AutoMovieHumanoidBone, true>> = {
  hips: true,
  spine: true,
  chest: true,
  upperChest: true,
  neck: true,
  head: true,
  leftEye: true,
  rightEye: true,
  jaw: true,
  leftShoulder: true,
  leftUpperArm: true,
  leftLowerArm: true,
  leftHand: true,
  rightShoulder: true,
  rightUpperArm: true,
  rightLowerArm: true,
  rightHand: true,
  leftUpperLeg: true,
  leftLowerLeg: true,
  leftFoot: true,
  leftToes: true,
  rightUpperLeg: true,
  rightLowerLeg: true,
  rightFoot: true,
  rightToes: true,
  leftThumbMetacarpal: true,
  leftThumbProximal: true,
  leftThumbDistal: true,
  leftIndexProximal: true,
  leftIndexIntermediate: true,
  leftIndexDistal: true,
  leftMiddleProximal: true,
  leftMiddleIntermediate: true,
  leftMiddleDistal: true,
  leftRingProximal: true,
  leftRingIntermediate: true,
  leftRingDistal: true,
  leftLittleProximal: true,
  leftLittleIntermediate: true,
  leftLittleDistal: true,
  rightThumbMetacarpal: true,
  rightThumbProximal: true,
  rightThumbDistal: true,
  rightIndexProximal: true,
  rightIndexIntermediate: true,
  rightIndexDistal: true,
  rightMiddleProximal: true,
  rightMiddleIntermediate: true,
  rightMiddleDistal: true,
  rightRingProximal: true,
  rightRingIntermediate: true,
  rightRingDistal: true,
  rightLittleProximal: true,
  rightLittleIntermediate: true,
  rightLittleDistal: true,
};
