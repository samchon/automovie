import type { AutoMovieExternalModelIngestProfile } from "./AutoMovieExternalModelIngestProfile";
import type { IAutoMovieExternalModelInspection } from "./IAutoMovieExternalModelInspection";
import type { IAutoMovieExternalModelResource } from "./IAutoMovieExternalModelResource";
import type { IAutoMovieExternalMotionInspection } from "./IAutoMovieExternalMotionInspection";
import { COMPONENT_BYTES } from "./internal/COMPONENT_BYTES";
import type { IAccessorSource } from "./internal/IAccessorSource";
import type { IHumanoidSlot } from "./internal/IHumanoidSlot";
import type { IParsedContainer } from "./internal/IParsedContainer";
import { SHAPE_COMPONENTS } from "./internal/SHAPE_COMPONENTS";
import { collectExternalResources } from "./internal/collectExternalResources";
import { decodeGlb } from "./internal/decodeGlb";
import { decodeJson } from "./internal/decodeJson";
import { fileExtension } from "./internal/fileExtension";
import { gltfHumanoidBones } from "./internal/gltfHumanoidBones";
import { inspectExternalModelHierarchy } from "./internal/inspectExternalModelHierarchy";
import { inspectExternalMotion } from "./internal/inspectExternalMotion";
import { integerIndex } from "./internal/integerIndex";
import { integerIndices } from "./internal/integerIndices";
import { nonNegativeInteger } from "./internal/nonNegativeInteger";
import { object } from "./internal/object";
import { optionalArray } from "./internal/optionalArray";
import { optionalObject } from "./internal/optionalObject";
import { optionalStringArray } from "./internal/optionalStringArray";
import { positiveInteger } from "./internal/positiveInteger";
import { requiredArray } from "./internal/requiredArray";
import { uniqueStrings } from "./internal/uniqueStrings";
import { validateAccessorRange } from "./internal/validateAccessorRange";
import { validateHumanoidSkinning } from "./internal/validateHumanoidSkinning";
import { validatePayloadClosure } from "./internal/validatePayloadClosure";
import { validateSparseAccessor } from "./internal/validateSparseAccessor";
import { vrmHumanoidBones } from "./internal/vrmHumanoidBones";
import { isAutoMovieExternalModelIngestProfile } from "./isAutoMovieExternalModelIngestProfile";

/**
 * Parse and validate exact external model bytes before compilation.
 *
 * The container is chosen by the path suffix: `.gltf` is UTF-8 JSON, `.glb` and `.vrm` are GLB 2.0 with one JSON chunk and at most one BIN chunk. JSON that is not strict UTF-8, does not parse, or repeats a member name after escape decoding is refused, because a last-wins duplicate could hide the value another loader reads. The document must declare asset version 2.0 and a forest of nodes; node mesh/skin/child links, scene roots, skin joints, primitive POSITION/indices and buffer/accessor references read here must resolve; buffers, buffer views, accessors, sparse ranges and images must fit their declared and resident bytes; and every non-data buffer sidecar must come back from `resolveResource` with the declared length, while URI images require nonempty bytes. The selected profile then adds its own requirements, as {@link AutoMovieExternalModelIngestProfile} lists. This is a fixed-profile admission gate, not a complete glTF validator: material/texture links and unconsumed attributes are left to host loaders, sparse payload contents and image media formats are not decoded here, and the skin/motion owners state their additional restrictions. The inspector never guesses a profile or repairs input: the first violation throws with the JSON path it concerns.
 *
 * Under `vrm-humanoid-v1`, `VRMC_vrm` is read with VRM 1.0 bone names, so a 1.0-beta file that still writes thumbs the VRM 0.x way is read as 1.0.
 *
 * @param props.path Project-relative source path; its suffix selects the container.
 * @param props.bytes Resident container bytes; they are only read.
 * @param props.profile Caller-selected profile, refused unless supported.
 * @param props.resolveResource Returns a sidecar's bytes for a URI, or `null` when unavailable; it is called once per external buffer and image URI entry, with caller-owned cost and effects.
 * @returns New facts that hold no reference to the input bytes.
 *
 * @evidence contracts/common.md#principled-implementation The inspector follows the glTF 2.0 and GLB container rules: strict UTF-8 JSON with duplicate members refused by an iterative scan, index validation for the structural and profile fields it reads, forest and cycle checks by iterative parent walks, accessor and sparse ranges from component sizes with matrix column padding, payload lengths against declared buffers, and VRM 0.x thumbs migrated to VRM 1.0 slots by the published rename; the selected profile does not prove complete glTF validity, normalized complete skinning or anatomical correctness, and `VRMC_vrm` 1.0-beta thumb names are read as 1.0.
 * @evidence contracts/common.md#clear-and-simple-design The exported orchestrator sequences structural, payload and profile owners; source-preserving internal splits keep each concern within the file/export limits, while public result types have independent file-named owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Profiles and container suffixes are contract constants, no model or path is special-cased, the alias table is a `Map` so inherited names never resolve, and every refusal is the first violation found rather than a repaired value.
 * @evidence contracts/common.md#meaningful-documentation The documentation states how the container is chosen, every structural requirement, the duplicate-member reason, the no-guess no-repair rule, the VRM 1.0-beta limitation, each parameter's role and call frequency, and that the result holds no byte reference.
 * @evidence contracts/performance.md#efficient-algorithms Work follows container bytes for UTF-8/JSON and duplicate scanning, declared entries and name text, skinned components, motion values and encoded data URIs, plus full caller resolver work per external URI entry; resource/extension sorting uses O(U log U) and O(X log X) prefix-scanning comparisons. Per-accessor readers resolve views/strides once, and the BIN slice borrows container storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Within one inspection, a motion accessor is decoded once per accessor and type and shared by every channel that cites it, each track receiving its own copy, and a mesh and skin pair bound on several nodes is weight-checked once; the key is the accessor index or pair, which is valid because the document is immutable during the synchronous call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The decoded JSON, payload list, readers and caches live only for the call and are released on return or throw; the result retains copies proportional to resources, slots and motion data, and keeps neither the container nor sidecar bytes.
 */
export const inspectAutoMovieExternalModelBytes: (props: {
  /** Exact project-relative source path. */
  path: string;

  /** Exact resident container bytes. */
  bytes: Uint8Array;

  /** Caller-selected fixed interpretation profile. */
  profile: string;

  /** Exact sidecar bytes, resolved inside the builder-owned asset namespace. */
  resolveResource?: (uri: string) => Uint8Array | null;
}) => IAutoMovieExternalModelInspection = (props: {
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
    primitives.forEach(
      (primitiveValue: unknown, primitiveIndex: number): void => {
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
      },
    );
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
  const resources: IAutoMovieExternalModelResource[] = collectExternalResources(
    buffers,
    images,
  );
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
      humanoidMapping.some(
        (slot: IHumanoidSlot): boolean => slot.bone === "hips",
      ) === false)
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
      humanoidMapping.some(
        (slot: IHumanoidSlot): boolean => slot.bone === "hips",
      ) === false)
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
      (
        slot: IHumanoidSlot,
      ): IAutoMovieExternalModelInspection["humanoidBones"][number] => ({
        ...slot,
        weighted: weightedNodes.has(slot.node),
      }),
    ),
    ...(motion === undefined ? {} : { motion }),
  };
};
