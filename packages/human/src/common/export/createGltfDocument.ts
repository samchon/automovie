import {
  mergeAutoMovieMeshes,
  readAutoMovieImageFacts,
  tessellate,
  validateMeshTopology,
  validateModel,
} from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import { Document } from "@gltf-transform/core";
import {
  KHRMaterialsClearcoat,
  KHRMaterialsIOR,
  KHRMaterialsTransmission,
  KHRMaterialsVolume,
} from "@gltf-transform/extensions";
import typia from "typia";

import { float32MeshBuffers } from "../mesh/float32MeshBuffers";
import { placeMeshPreservingFaces } from "../mesh/placeMeshPreservingFaces";
import type { IAutoMovieHumanExportOptions } from "./IAutoMovieHumanExportOptions";
import type { IAutoMovieHumanStaticPartCorrespondence } from "./IAutoMovieHumanStaticPartCorrespondence";
import { applyHumanGltfTextureSampling } from "./applyHumanGltfTextureSampling";
import { groupHumanGltfParts } from "./groupHumanGltfParts";
import { readHumanMeshPhysicalVertices } from "./readHumanMeshPhysicalVertices";
import { readHumanStaticPartCorrespondence } from "./readHumanStaticPartCorrespondence";
import { resolveHumanGltfTextureReference } from "./resolveHumanGltfTextureReference";

/**
 * Convert a static AutoMovie model into portable glTF buffers and materials.
 * Metallic/roughness colour, emission, alpha modes and scalar optical material
 * fields and resident PNG or JPEG base-colour, normal and occlusion textures
 * are preserved, either as a legacy data-URI string (clamped, untransformed) or
 * as a structured reference on UV0 whose sampler and UV transform are encoded
 * (`resolveHumanGltfTextureReference`, `applyHumanGltfTextureSampling`).
 * Detail normals and overlays have no ratified glTF form and are omitted, as
 * the material contract states.
 * External images, other texture slots and rigs are refused. PNG headers and positive extents
 * are inspected here; the receiving image decoder owns payload decoding.
 * Positive volume
 * thickness requires a closed manifold. Writers must register the exported
 * extension set; clients must support every optical extension used by a model.
 * Geometry and closed optical volumes are checked again at the actual Float32
 * output boundary; a valid double-precision source can lose a face on export.
 * Members merge only within an exact material/TRS frame. Positions remain
 * local through Float32 conversion, and standard glTF nodes retain the source
 * placement (T * R * S, quaternion XYZW). Material-wide topology is checked in
 * model metres by applying those nodes to the actual packed local positions
 * in Float64, so splitting frames does not exempt cross-frame edges or volumes.
 * See https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#transformations.
 * Optical thickness follows retained node scale as a mesh-space glTF value.
 * This is a static model exporter, not a general scene-export API.
 * Prefer exportHumanFace for portable bytes. This low-level Document must be
 * written by the same glTF-Transform module instance that created it; mixing
 * CommonJS and ES-module instances can discard its geometry during writing.
 *
 * Source identity is an explicit opt-in. The same prepared material members
 * that enter the merge supply primitive-local element intervals; this source-part
 * namespace is absent by default. These IDs establish no anatomical qualification.
 * Supplied mesh physical correspondence is independent: the standard writer
 * always preserves its source-pair/null lineage in a separate JSON namespace
 * and unnormalized Uint16 VEC2 custom accessor containing low/high words of
 * each 32-bit table reference. Missing correspondence keeps legacy bytes.
 *
 * @evidence contracts/common.md#principled-implementation Exact material/TRS groups preserve local Float32 geometry and standard node placement; engine placement of actual packed buffers retains material-wide topology checks and the common reader admits complete source intervals.
 * @evidence contracts/common.md#clear-and-simple-design One constructor owns material membership, source-ID mapping and final primitive creation; no serialized grouping is reconstructed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional metadata changes neither source geometry nor the legacy default and conveys no anatomical certification.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes optional source identity and the existing static exporter limitations.
 */
export function createGltfDocument(
  model: IAutoMovieModel,
  options?: IAutoMovieHumanExportOptions,
): Document {
  const identity =
    typia.assertEquals<IAutoMovieHumanExportOptions>(
      options === undefined ? {} : options,
    ).sourcePartIdentity === true;
  if (
    model.skeleton !== null ||
    model.materials.some((m) =>
      [m.metallicRoughnessTexture, m.emissiveTexture].some(
        (binding) => binding !== null && binding !== undefined,
      ),
    )
  )
    throw new Error(
      "Model export accepts static models with resident base-colour, normal and occlusion PNG only.",
    );
  const document = new Document();
  const buffer = document.createBuffer();
  const scene = document.createScene(model.id);
  const textures = new Map<string, ReturnType<Document["createTexture"]>>();
  document.getRoot().setDefaultScene(scene);
  for (const finish of model.materials) {
    const members = model.parts.filter((part) => part.material === finish.id);
    if (members.length === 0) continue;
    const groups = groupHumanGltfParts(members).map((group) => {
      const meshes = group.parts.map((part) => {
        const mesh =
          part.geometry.type === "mesh"
            ? part.geometry.mesh
            : {
                ...tessellate(part.geometry.shape),
                uvs: null,
                skin: null,
              };
        if (part.attachedBone !== null || mesh.skin !== null)
          throw new Error("Model export does not flatten bone bindings.");
        // Identity preparation retains the engine's index, normal and physical
        // correspondence admission without baking placement into the buffers.
        return placeMeshPreservingFaces(mesh, {});
      });
      const mesh = mergeAutoMovieMeshes(meshes);
      const transform = group.transform;
      // Preserve the original full-TRS source redundancy classification.
      // The legacy nanometre grid depends on its coordinate origin even when
      // translation leaves mathematical area unchanged. Only classification
      // reads this world reference; conversion and directions stay local.
      const reference = transform === null
        ? mesh
        : placeMeshPreservingFaces(mesh, transform);
      const meshIdentity = "material:" + finish.id + " parts:" +
        group.parts.map((part) => part.id).join(",");
      let packed: ReturnType<typeof float32MeshBuffers> | undefined;
      let originalWorld: string | undefined;
      let publicationLocal: string | undefined;
      try {
        packed = float32MeshBuffers(mesh, meshIdentity, reference);
      } catch (error) {
        originalWorld = error instanceof Error ? error.message : String(error);
      }
      // World redundancy and the existing viewer's local redundancy each own
      // their original face population. Neither can exempt the other's loss.
      try {
        float32MeshBuffers(mesh, meshIdentity);
      } catch (error) {
        publicationLocal = error instanceof Error ? error.message : String(error);
      }
      if (packed === undefined || publicationLocal !== undefined)
        throw new Error((originalWorld ?? publicationLocal)! +
          " gltf-float32-guards:" + JSON.stringify({
            originalWorld: originalWorld ?? null,
            publicationLocal: publicationLocal ?? null,
          }));
      return { ...group, meshes, mesh, packed };
    });
    // Quantization can merge separate edges even while every individual face
    // retains its area. Check all final material groups for manifold/winding
    // agreement; only a positive optical thickness additionally requires closure.
    if (
      !validateMeshTopology({
        mesh: mergeAutoMovieMeshes(
          groups.map((group) =>
            placeMeshPreservingFaces(
              { ...group.mesh, positions: Array.from(group.packed.positions) },
              group.transform ?? {},
            ),
          ),
        ),
        expectClosed: (finish.thickness ?? 0) > 0,
      }).success
    )
      throw new Error(
        "Model Float32 material geometry must preserve its required topology: " +
          finish.id,
      );
    const alphaModes = {
      opaque: "OPAQUE",
      mask: "MASK",
      blend: "BLEND",
    } as const;
    const material = document
      .createMaterial(finish.id)
      .setBaseColorFactor([
        finish.baseColor.r,
        finish.baseColor.g,
        finish.baseColor.b,
        finish.opacity,
      ])
      .setMetallicFactor(finish.metallic)
      .setRoughnessFactor(finish.roughness)
      .setDoubleSided(finish.doubleSided ?? false)
      .setEmissiveFactor(
        finish.emissive === null
          ? [0, 0, 0]
          : [finish.emissive.r, finish.emissive.g, finish.emissive.b],
      )
      .setAlphaMode(
        finish.alphaMode === undefined
          ? finish.opacity < 1
            ? "BLEND"
            : "OPAQUE"
          : alphaModes[finish.alphaMode],
      )
      .setAlphaCutoff(finish.alphaCutoff ?? 0.5);
    for (const slot of [
      "baseColorTexture",
      "normalTexture",
      "occlusionTexture",
    ] as const) {
      const binding = finish[slot];
      if (binding === null || binding === undefined) continue;
      // glTF admits exactly two image encodings, and which one a map wants is
      // decided by what the map is. A generated mask is flat and needs its
      // exact bytes; a skin baked from a photograph has no flat region to
      // exploit and is several megabytes as PNG against a few hundred
      // kilobytes as JPEG, which is the difference between an appearance that
      // can ship with a face and one that cannot.
      const reference = resolveHumanGltfTextureReference(binding, slot);
      const mediaType = reference.mediaType;
      const prefix = `data:${mediaType};base64,`;
      if (
        groups.some(
          ({ mesh }) =>
            mesh.uvs === null ||
            mesh.uvs.length !== (mesh.positions.length / 3) * 2 ||
            !mesh.uvs.every(Number.isFinite),
        )
      )
        throw new Error(
          "Textured model groups require complete finite UV0 coordinates.",
        );
      let texture = textures.get(reference.uri);
      if (texture === undefined) {
        const bytes = Uint8Array.from(
          atob(reference.uri.slice(prefix.length)),
          (c) => c.charCodeAt(0),
        );
        // The header is read rather than trusted: the declared type has to be
        // the type the bytes actually are, or a viewer is handed a mislabelled
        // image that only fails once someone looks at the face.
        const facts = readAutoMovieImageFacts(bytes);
        if (
          facts?.mediaType !== mediaType ||
          facts.width <= 0 ||
          facts.height <= 0
        )
          throw new Error(
            "Model resident texture must contain a positive-size header of its declared type.",
          );
        texture = document
          .createTexture()
          .setImage(bytes)
          .setMimeType(mediaType);
        textures.set(reference.uri, texture);
      }
      if (slot === "baseColorTexture") {
        material.setBaseColorTexture(texture);
        applyHumanGltfTextureSampling(
          document,
          material.getBaseColorTextureInfo()!,
          reference,
        );
      } else if (slot === "normalTexture") {
        material
          .setNormalTexture(texture)
          .setNormalScale(finish.normalScale ?? 1);
        applyHumanGltfTextureSampling(
          document,
          material.getNormalTextureInfo()!,
          reference,
        );
      } else {
        material
          .setOcclusionTexture(texture)
          .setOcclusionStrength(finish.occlusionStrength ?? 1);
        applyHumanGltfTextureSampling(
          document,
          material.getOcclusionTextureInfo()!,
          reference,
        );
      }
    }
    if (finish.transmission !== undefined || finish.thickness !== undefined)
      material.setExtension(
        "KHR_materials_transmission",
        document
          .createExtension(KHRMaterialsTransmission)
          .setRequired(true)
          .createTransmission()
          .setTransmissionFactor(finish.transmission ?? 0),
      );
    if (finish.ior !== undefined)
      material.setExtension(
        "KHR_materials_ior",
        document
          .createExtension(KHRMaterialsIOR)
          .setRequired(true)
          .createIOR()
          .setIOR(finish.ior),
      );
    if (finish.thickness !== undefined)
      material.setExtension(
        "KHR_materials_volume",
        document
          .createExtension(KHRMaterialsVolume)
          .setRequired(true)
          .createVolume()
          .setThicknessFactor(finish.thickness),
      );
    if (finish.clearcoat !== undefined)
      material.setExtension(
        "KHR_materials_clearcoat",
        document
          .createExtension(KHRMaterialsClearcoat)
          .setRequired(true)
          .createClearcoat()
          .setClearcoatFactor(finish.clearcoat),
      );
    for (const [ordinal, group] of groups.entries()) {
      const { mesh, meshes, packed, parts: members } = group;
      const positions = document
        .createAccessor()
        .setType("VEC3")
        .setArray(packed.positions)
        .setBuffer(buffer);
      const indices = document
        .createAccessor()
        .setType("SCALAR")
        .setArray(packed.indices)
        .setBuffer(buffer);
      const primitive = document
        .createPrimitive()
        .setAttribute("POSITION", positions)
        .setIndices(indices)
        .setMaterial(material);
      if (packed.normals !== null)
        primitive.setAttribute(
          "NORMAL",
          document
            .createAccessor()
            .setType("VEC3")
            .setArray(packed.normals)
            .setBuffer(buffer),
        );
      if (mesh.colors !== undefined)
        primitive.setAttribute(
          "COLOR_0",
          document
            .createAccessor()
            .setType("VEC3")
            .setArray(new Float32Array(mesh.colors))
            .setBuffer(buffer),
        );
      if (packed.uvs !== null)
        primitive.setAttribute(
          "TEXCOORD_0",
          document
            .createAccessor()
            .setType("VEC2")
            .setArray(packed.uvs)
            .setBuffer(buffer),
        );
      if (identity) {
        let vertexOffset = 0;
        let indexOffset = 0;
        const correspondence: IAutoMovieHumanStaticPartCorrespondence = {
          version: 1,
          sourceModel: model.id,
          parts: members.map((part, ordinal) => {
            const prepared = meshes[ordinal];
            const vertexCount = prepared.positions.length / 3;
            const indexCount = prepared.indices!.length;
            const record = {
              id: part.id,
              vertexOffset,
              vertexCount,
              indexOffset,
              indexCount,
            };
            vertexOffset += vertexCount;
            indexOffset += indexCount;
            return record;
          }),
        };
        primitive.setExtras({ automovieSourceParts: correspondence });
        readHumanStaticPartCorrespondence(primitive);
      }
      if (mesh.physicalVertices !== undefined) {
        // Existing composition owns this pair table. Accessor values are local
        // references; opaque safe integer source IDs remain lossless JSON.
        // glTF 2.0 custom attributes cannot use uint32. Two unnormalized uint16
        // words preserve each 32-bit reference at four-byte vertex alignment.
        const references = new Uint16Array(
          mesh.physicalVertices.vertices.length * 2,
        );
        mesh.physicalVertices.vertices.forEach((reference, vertex) => {
          const value = reference === null ? 0 : reference + 1;
          references[vertex * 2] = value % 65536;
          references[vertex * 2 + 1] = Math.floor(value / 65536);
        });
        primitive.setAttribute(
          "_AUTOMOVIE_PHYSICAL_SOURCE",
          document
            .createAccessor()
            .setType("VEC2")
            .setNormalized(false)
            .setArray(references)
            .setBuffer(buffer),
        );
        primitive.setExtras({
          ...primitive.getExtras(),
          automoviePhysicalVertices: {
            version: 1,
            attribute: "_AUTOMOVIE_PHYSICAL_SOURCE",
            sources: mesh.physicalVertices.sources.map((source) => ({
              ...source,
            })),
          },
        });
        readHumanMeshPhysicalVertices(primitive);
      }
      const name = groups.length === 1 ? finish.id : finish.id + "/" + ordinal;
      const node = document
        .createNode(name)
        .setMesh(document.createMesh(name).addPrimitive(primitive));
      if (group.transform !== null) {
        const { translation, rotation, scale } = group.transform;
        node
          .setTranslation([translation.x, translation.y, translation.z])
          .setRotation([rotation.x, rotation.y, rotation.z, rotation.w])
          .setScale([scale.x, scale.y, scale.z]);
      }
      scene.addChild(node);
    }
  }
  if (
    model.parts.some(
      (part) => !model.materials.some((finish) => finish.id === part.material),
    )
  )
    throw new Error("Every model part must name a resident material.");
  const validation = validateModel({ model });
  if (!validation.success)
    throw new Error("Model model is invalid: " + JSON.stringify(validation));
  return document;
}
