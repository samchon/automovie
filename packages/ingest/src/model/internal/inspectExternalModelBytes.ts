import type {
  AutoMovieExternalModelIngestProfile,
  IAutoMovieExternalModelInspection,
  IAutoMovieExternalModelResource,
  IAutoMovieExternalMotionInspection,
} from "@automovie/interface";

import { COMPONENT_BYTES } from "./COMPONENT_BYTES";
import type { IAccessorSource } from "./IAccessorSource";
import type { IHumanoidSlot } from "./IHumanoidSlot";
import type { IParsedContainer } from "./IParsedContainer";
import { SHAPE_COMPONENTS } from "./SHAPE_COMPONENTS";
import { collectExternalResources } from "./collectExternalResources";
import { decodeGlb } from "./decodeGlb";
import { decodeJson } from "./decodeJson";
import { fileExtension } from "./fileExtension";
import { gltfHumanoidBones } from "./gltfHumanoidBones";
import { inspectExternalModelHierarchy } from "./inspectExternalModelHierarchy";
import { inspectExternalMotion } from "./inspectExternalMotion";
import { integerIndex } from "./integerIndex";
import { integerIndices } from "./integerIndices";
import { nonNegativeInteger } from "./nonNegativeInteger";
import { object } from "./object";
import { optionalArray } from "./optionalArray";
import { optionalObject } from "./optionalObject";
import { optionalStringArray } from "./optionalStringArray";
import { positiveInteger } from "./positiveInteger";
import { requiredArray } from "./requiredArray";
import { uniqueStrings } from "./uniqueStrings";
import { validateAccessorRange } from "./validateAccessorRange";
import { validateHumanoidSkinning } from "./validateHumanoidSkinning";
import { validatePayloadClosure } from "./validatePayloadClosure";
import { validateSparseAccessor } from "./validateSparseAccessor";
import { vrmHumanoidBones } from "./vrmHumanoidBones";
import { isExternalModelIngestProfile } from "./isExternalModelIngestProfile";

/*
 * Parse and validate exact external model bytes before compilation.
 *
 * The container is chosen by the path suffix: `.gltf` is UTF-8 JSON, `.glb` and
 * `.vrm` are GLB 2.0 with one JSON chunk and at most one BIN chunk. JSON that
 * is not strict UTF-8, does not parse, or repeats a member name after escape
 * decoding is refused, because a last-wins duplicate could hide the value
 * another loader reads. The document must declare asset version 2.0 and a
 * forest of nodes; node mesh/skin/child links, scene roots, skin joints,
 * primitive POSITION/indices and buffer/accessor references read here must
 * resolve; buffers, buffer views, accessors, sparse ranges and images must fit
 * their declared and resident bytes; and every non-data buffer sidecar must
 * come back from `resolveResource` with the declared length, while URI images
 * require nonempty bytes. The selected profile then adds its own requirements,
 * as AutoMovieExternalModelIngestProfile lists. This is a fixed-profile
 * admission gate, not a complete glTF validator: material/texture links and
 * unconsumed attributes are left to host loaders, sparse payload contents and
 * image media formats are not decoded here, and the skin/motion owners state
 * their additional restrictions. The inspector never guesses a profile or
 * repairs input: the first violation throws with the JSON path it concerns.
 *
 * Under `vrm-humanoid-v1`, `VRMC_vrm` is read with VRM 1.0 bone names, so a
 * 1.0-beta file that still writes thumbs the VRM 0.x way is read as 1.0.
 * Parameter props.path: Project-relative source path; its suffix selects the
 * container.
 * Parameter props.bytes: Resident container bytes; they are only read.
 * Parameter props.profile: Caller-selected profile, refused unless supported.
 * Parameter props.resolveResource: Returns a sidecar's bytes for a URI, or `null`
 * when unavailable; it is called once per external buffer and image URI
 * entry, with caller-owned cost and effects.
 * Returns: New facts that hold no reference to the input bytes.
 */
export function inspectExternalModelBytes(
  props: IAutoMovieExternalModelInspection.IProps,
): IAutoMovieExternalModelInspection {
  if (isExternalModelIngestProfile(props.profile) === false)
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
}
