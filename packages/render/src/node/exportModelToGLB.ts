import { ITessellation, tessellate } from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";
import type {
  Document,
  Buffer as GLTFBuffer,
  Material,
  Node,
  Primitive,
  Scene,
} from "@gltf-transform/core";

import { loadModelGltfCore } from "./loadModelGltfCore";

/**
 * Serialize an `IAutoMovieModel` into binary glTF 2.0 (`.glb`) bytes with all geometry in one embedded buffer.
 *
 * Each skeleton bone becomes a node under its parent, or under the scene for a root, carrying rest translation and rotation with unit scale. Each part becomes a mesh node with its own transform under its `attachedBone`, or under the scene when unattached. Engine tessellation exports a capsule's hemispheres and cylindrical body; authored meshes export positions, normals, vertex colors as `COLOR_0`, and indices.
 *
 * Materials use glTF metallic-roughness, authored alpha mode or an opacity-derived default, mask cutoff 0.5 by default, and authored sidedness. Exported base alpha is `(baseColor.a ?? 1) * opacity`; the live viewer currently uses opacity alone, so authored base alpha can produce a different appearance.
 *
 * Skinned parts export as static rest meshes without joints, weights or glTF skin. Texture bindings, mesh UVs, transmission, index of refraction, thickness, clear-coat, subsurface and overlay fields are omitted. Indexed meshes without authored normals get area-weighted smooth normals; unindexed meshes omit `NORMAL` and leave shading to the reader.
 *
 * Call with an engine-validated model whose numeric attributes are representable by the exported Float32/Uint32 arrays. Missing parent, material and attached-bone references throw; this function does not repeat graph or numeric validation, and the serializer can also reject its document.
 *
 * @evidence contracts/common.md#principled-implementation glTF nodes carry the represented rest hierarchy and transforms, while accessors and metallic-roughness materials carry the emitted static surface facts. Engine tessellation and indexed normal accumulation supply geometry; Float32/Uint32 conversion assumes validated representable inputs. The documented alpha difference and omitted skin, texture and extension fields prevent claiming complete live-viewer equivalence.
 * @evidence contracts/common.md#clear-and-simple-design Materials, bones and parts are visited in dependency order, with helpers for material conversion, geometry, part transforms, indexed normals and bone-rest transforms. The Node entry exposes this exporter, and its callers receive bytes without file writing; the serializer is loaded only when export is requested.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Deferred SDK loading is a load-time boundary, not a patch of the serializer, and no model, part or material id is special-cased; every rule applies to the field it reads.
 * @evidence contracts/common.md#meaningful-documentation The doc names the validated-model premise, emitted hierarchy and attributes, material defaults and alpha difference, omitted capabilities, Float32/Uint32 conversion, reference refusals and serializer failure boundary. Callers get static GLB bytes rather than a validated visual delivery or animation.
 * @evidence contracts/performance.md#efficient-algorithms Local work visits M materials, B bones, P parts and their V attribute elements plus I triangle indices, using maps for expected constant-time reference lookup and linear indexed normal accumulation. Typed arrays, document objects and the serialized binary coexist during writing; the SDK's graph bookkeeping and serialization add their own work and allocations, so neither a total linear bound nor a fixed peak multiplier is asserted. Input and output size have no independent quota here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call serializes one caller-owned model into fresh bytes; the module loader's cache already shares the deferred `@gltf-transform/core` module across calls, and no export result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The pending module import or binary write can retain the invocation, document, maps and typed arrays until settlement; this function adds no timeout or cancellation. After settlement it keeps no result cache or persistent document handle, while the module loader retains the loaded serializer and the caller owns the returned bytes. No output file is opened.
 * @author Samchon
 */
export const exportModelToGLB: (
  model: IAutoMovieModel,
) => Promise<Uint8Array> = async (
  model: IAutoMovieModel,
): Promise<Uint8Array> => {
  // The deferred CommonJS loader shares the SDK's supported require branch
  // and its nominal declaration graph without eager SDK initialization.
  const gltf: typeof import("@gltf-transform/core") = await loadModelGltfCore();
  const doc: Document = new gltf.Document();
  const buffer: GLTFBuffer = doc.createBuffer();
  const scene: Scene = doc.createScene(model.name ?? model.id);

  const materials: Map<string, Material> = new Map();
  for (const m of model.materials) materials.set(m.id, toMaterial(doc, m));

  const boneNodes: Map<string, Node> = new Map();
  if (model.skeleton !== null) {
    for (const bone of model.skeleton.bones)
      boneNodes.set(bone.bone, setBoneRest(doc.createNode(bone.bone), bone));
    for (const bone of model.skeleton.bones) {
      const node: Node = boneNodes.get(bone.bone)!;
      if (bone.parent === null) {
        scene.addChild(node);
        continue;
      }
      const parent: Node | undefined = boneNodes.get(bone.parent);
      if (parent === undefined)
        throw new Error(
          `skeleton bone "${bone.bone}" references missing parent "${bone.parent}"`,
        );
      parent.addChild(node);
    }
  }

  for (const part of model.parts) {
    const prim: Primitive = toPrimitive(doc, buffer, part);
    if (part.material !== null) {
      const material: Material | undefined = materials.get(part.material);
      if (material === undefined)
        throw new Error(
          `part "${part.id}" references missing material "${part.material}"`,
        );
      prim.setMaterial(material);
    }
    const label: string = part.name ?? part.id;
    const node: Node = setTRS(
      doc.createNode(label).setMesh(doc.createMesh(label).addPrimitive(prim)),
      part.transform,
    );
    if (part.attachedBone === null) {
      scene.addChild(node);
      continue;
    }
    const boneNode: Node | undefined = boneNodes.get(part.attachedBone);
    if (boneNode === undefined)
      throw new Error(
        `part "${part.id}" references missing attachedBone "${part.attachedBone}"`,
      );
    boneNode.addChild(node);
  }

  return new gltf.NodeIO().writeBinary(doc);
};

/**
 * Convert one material with authored alpha mode or an opacity-derived default, default mask cutoff 0.5, and authored sidedness. Base alpha multiplies authored alpha by opacity, which differs from the live viewer's opacity-only rule.
 */
const toMaterial: (doc: Document, m: IAutoMovieMaterial) => Material = (
  doc: Document,
  m: IAutoMovieMaterial,
): Material => {
  const alphaMode: "opaque" | "mask" | "blend" =
    m.alphaMode ?? (m.opacity < 1 ? "blend" : "opaque");
  const material: Material = doc
    .createMaterial(m.name ?? m.id)
    .setBaseColorFactor([
      m.baseColor.r,
      m.baseColor.g,
      m.baseColor.b,
      (m.baseColor.a ?? 1) * m.opacity,
    ])
    .setMetallicFactor(m.metallic)
    .setRoughnessFactor(m.roughness)
    .setDoubleSided(m.doubleSided === true)
    .setAlphaMode(
      alphaMode === "blend"
        ? "BLEND"
        : alphaMode === "mask"
          ? "MASK"
          : "OPAQUE",
    );
  if (alphaMode === "mask") material.setAlphaCutoff(m.alphaCutoff ?? 0.5);
  if (m.emissive !== null)
    material.setEmissiveFactor([m.emissive.r, m.emissive.g, m.emissive.b]);
  return material;
};

/** One primitive holding a part's tessellated or authored geometry. */
const toPrimitive: (
  doc: Document,
  buffer: GLTFBuffer,
  part: IAutoMovieModelPart,
) => Primitive = (
  doc: Document,
  buffer: GLTFBuffer,
  part: IAutoMovieModelPart,
): Primitive => {
  const geometry: ITessellation =
    part.geometry.type === "primitive"
      ? tessellate(part.geometry.shape)
      : {
          positions: part.geometry.mesh.positions,
          normals:
            part.geometry.mesh.normals ??
            (part.geometry.mesh.indices === null
              ? []
              : computeSmoothNormals(
                  part.geometry.mesh.positions,
                  part.geometry.mesh.indices,
                )),
          indices: part.geometry.mesh.indices ?? [],
        };
  const prim: Primitive = doc
    .createPrimitive()
    .setAttribute(
      "POSITION",
      doc
        .createAccessor()
        .setType("VEC3")
        .setArray(new Float32Array(geometry.positions))
        .setBuffer(buffer),
    );
  if (geometry.normals.length !== 0)
    prim.setAttribute(
      "NORMAL",
      doc
        .createAccessor()
        .setType("VEC3")
        .setArray(new Float32Array(geometry.normals))
        .setBuffer(buffer),
    );
  if (part.geometry.type === "mesh" && part.geometry.mesh.colors !== undefined)
    prim.setAttribute(
      "COLOR_0",
      doc
        .createAccessor()
        .setType("VEC3")
        .setArray(new Float32Array(part.geometry.mesh.colors))
        .setBuffer(buffer),
    );
  if (geometry.indices.length !== 0)
    prim.setIndices(
      doc
        .createAccessor()
        .setType("SCALAR")
        .setArray(new Uint32Array(geometry.indices))
        .setBuffer(buffer),
    );
  return prim;
};

/** Apply a part's translation, rotation and scale to its node; `null` is identity. */
const setTRS: (node: Node, t: IAutoMovieTransform | null) => Node = (
  node: Node,
  t: IAutoMovieTransform | null,
): Node => {
  if (t === null) return node;
  return node
    .setTranslation([t.translation.x, t.translation.y, t.translation.z])
    .setRotation([t.rotation.x, t.rotation.y, t.rotation.z, t.rotation.w])
    .setScale([t.scale.x, t.scale.y, t.scale.z]);
};

/**
 * Accumulate each indexed triangle's unnormalized cross product onto its three vertices, then normalize each sum to obtain area-weighted smooth normals. Vertices with no area keep zero normals; validated indices and representable numeric inputs are assumed.
 */
const computeSmoothNormals: (
  positions: number[],
  indices: number[],
) => number[] = (positions: number[], indices: number[]): number[] => {
  const normals: number[] = new Array<number>(positions.length).fill(0);
  for (let i: number = 0; i + 2 < indices.length; i += 3) {
    const a: number = indices[i]! * 3;
    const b: number = indices[i + 1]! * 3;
    const c: number = indices[i + 2]! * 3;
    const abx: number = positions[b]! - positions[a]!;
    const aby: number = positions[b + 1]! - positions[a + 1]!;
    const abz: number = positions[b + 2]! - positions[a + 2]!;
    const acx: number = positions[c]! - positions[a]!;
    const acy: number = positions[c + 1]! - positions[a + 1]!;
    const acz: number = positions[c + 2]! - positions[a + 2]!;
    const nx: number = aby * acz - abz * acy;
    const ny: number = abz * acx - abx * acz;
    const nz: number = abx * acy - aby * acx;
    for (const v of [a, b, c]) {
      normals[v] = normals[v]! + nx;
      normals[v + 1] = normals[v + 1]! + ny;
      normals[v + 2] = normals[v + 2]! + nz;
    }
  }
  for (let v: number = 0; v < normals.length; v += 3) {
    const length: number = Math.hypot(
      normals[v]!,
      normals[v + 1]!,
      normals[v + 2]!,
    );
    if (length === 0) continue;
    normals[v] = normals[v]! / length;
    normals[v + 1] = normals[v + 1]! / length;
    normals[v + 2] = normals[v + 2]! / length;
  }
  return normals;
};

/**
 * Apply bone-rest translation and rotation with unit scale, matching engine forward kinematics and the live viewer. Part nodes retain their own scale through `setTRS`.
 */
const setBoneRest: (node: Node, bone: IAutoMovieBone) => Node = (
  node: Node,
  bone: IAutoMovieBone,
): Node =>
  node
    .setTranslation([
      bone.rest.translation.x,
      bone.rest.translation.y,
      bone.rest.translation.z,
    ])
    .setRotation([
      bone.rest.rotation.x,
      bone.rest.rotation.y,
      bone.rest.rotation.z,
      bone.rest.rotation.w,
    ]);
