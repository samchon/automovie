import { ITessellation, tessellate } from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";
import type {
  Buffer as GLTFBuffer,
  Document,
  Material,
  Node,
  Primitive,
  Scene,
} from "@gltf-transform/core";

/**
 * Serialize an `IAutoMovieModel` into the bytes of a binary glTF 2.0 (`.glb`)
 * file with all geometry in one embedded buffer.
 *
 * Each skeleton bone becomes a node under its parent, or under the scene for a
 * root bone, carrying its rest translation and rotation with unit scale. Each
 * part becomes a mesh node with its own transform, parented to its
 * `attachedBone` node so the file articulates by rotating bone nodes, or to the
 * scene when it has no bone. A primitive part is tessellated by the engine's
 * `tessellate`, so a capsule exports as its cylinder approximation; a mesh part
 * exports its positions, its normals, its vertex colors as `COLOR_0`, and its
 * indices. Materials map onto glTF metallic-roughness with the same alpha mode,
 * cutoff and sidedness the viewer applies, and with `opacity` folded into the
 * base color alpha because the viewer renders `opacity` and ignores
 * `baseColor.a`.
 *
 * The export keeps fewer facts than the live viewer renders. A skinned part
 * exports as a static mesh at its rest shape, with no joints, weights or glTF
 * skin. Texture bindings, mesh UVs, and the transmission, index of refraction,
 * thickness, clear-coat, subsurface and overlay fields are not written. A mesh
 * without authored normals exports smooth area-weighted vertex normals when
 * indexed, as the viewer computes them, and no `NORMAL` when non-indexed,
 * where glTF's flat shading equals the viewer's.
 *
 * Throws when a bone names a missing parent or a part names a missing material
 * or bone. Other model validity, such as a cyclic skeleton, is the engine
 * validator's responsibility and is not rechecked.
 *
 * @evidence contracts/common.md#principled-implementation The mapping follows the glTF 2.0 node hierarchy and metallic-roughness material, so any conforming reader reproduces the rig and surfaces; where the viewer deviates from a naive mapping, opacity versus base alpha, unit bone-rest scale and computed normals, the export copies the viewer's rule so external viewers show what automovie shows; the remaining limitation is the unwritten skin, textures, UVs and extension material fields listed above.
 * @evidence contracts/common.md#clear-and-simple-design One function walks materials, bones and parts in that order because parts reference both, with three private helpers for the two transform conventions and the normal computation; the glTF serializer is loaded at the call because a module-scope import would load it for every importer of the Node entry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The deferred import is a load-time boundary, not a patch of the serializer, and no model, part or material id is special-cased; every rule applies to the field it reads.
 * @evidence contracts/common.md#meaningful-documentation The doc states the node hierarchy and transform conventions, how each geometry kind and attribute is written, the material mapping including alpha and sidedness, every fidelity reduction against the viewer, and the reference refusals with what is left to the validator.
 * @evidence contracts/performance.md#efficient-algorithms For B bones, P parts and V vertices, materials and bones are indexed in maps so every reference resolves in constant time, each attribute array is converted to a typed array once, and normals are computed in one pass over the indices and one over the vertices, so time and memory are linear in the model size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call serializes one caller-owned model into fresh bytes; the module loader's cache already shares the deferred `@gltf-transform/core` module across calls, and no export result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The glTF document, its typed arrays and the lookup maps are held only until the bytes are written and are then unreachable; the returned array is the caller's, and no file handle or task is opened.
 * @author Samchon
 */
export const exportModelToGLB = async (
  model: IAutoMovieModel,
): Promise<Uint8Array> => {
  // Loaded here rather than at module scope because this is the workspace's
  // only runtime edge to `@gltf-transform/core`: a module-scope import would
  // load a glTF serializer for every importer of the Node entry, including one
  // that never calls this. Under the pinned Node 22.15 that load fails, because
  // the package's `require` condition serves `dist/index.cjs`, which requires
  // the ESM-only `property-graph`, and the ESM-to-CJS translator returns
  // undefined for it. Node 24.18 loads it. Deferring the load means a path that
  // never exports never pays for or trips over it; the callers that do export
  // run where the load succeeds.
  const gltf: typeof import("@gltf-transform/core") = await import(
    "@gltf-transform/core"
  );
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
 * One glTF metallic-roughness material with the viewer's alpha rule: the
 * authored `alphaMode`, or `blend` below full opacity and `opaque` otherwise,
 * a cutoff of 0.5 by default under `mask`, and back faces only when
 * `doubleSided` is true.
 */
const toMaterial = (doc: Document, m: IAutoMovieMaterial): Material => {
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
      alphaMode === "blend" ? "BLEND" : alphaMode === "mask" ? "MASK" : "OPAQUE",
    );
  if (alphaMode === "mask") material.setAlphaCutoff(m.alphaCutoff ?? 0.5);
  if (m.emissive !== null)
    material.setEmissiveFactor([m.emissive.r, m.emissive.g, m.emissive.b]);
  return material;
};

/** One primitive holding a part's tessellated or authored geometry. */
const toPrimitive = (
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
  if (
    part.geometry.type === "mesh" &&
    part.geometry.mesh.colors !== undefined
  )
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
const setTRS = (node: Node, t: IAutoMovieTransform | null): Node => {
  if (t === null) return node;
  return node
    .setTranslation([t.translation.x, t.translation.y, t.translation.z])
    .setRotation([t.rotation.x, t.rotation.y, t.rotation.z, t.rotation.w])
    .setScale([t.scale.x, t.scale.y, t.scale.z]);
};

/**
 * Area-weighted smooth vertex normals over an indexed triangle list, the
 * computation three's `computeVertexNormals` performs for the live viewer:
 * each triangle's unnormalized cross product, whose length is twice its area,
 * accumulates onto its three vertices, and each sum is then normalized. A
 * vertex with no area keeps the zero normal rather than NaN.
 */
const computeSmoothNormals = (
  positions: number[],
  indices: number[],
): number[] => {
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
 * Apply a bone's rest translation and rotation with unit scale. The engine's
 * forward kinematics and the live viewer both ignore bone-rest scale, so
 * exporting it would let external viewers compound a scale into every
 * descendant that no automovie renderer shows. Part nodes keep their scale
 * through `setTRS`.
 */
const setBoneRest = (node: Node, bone: IAutoMovieBone): Node =>
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
