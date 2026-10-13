import { validateMeshTopology } from "@automovie/engine";
import { float32MeshBuffers } from "../../common/mesh/float32MeshBuffers";
import type { IAutoMovieMaterial, IAutoMovieMesh, IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";

import type { ConnectedBodyModel } from "./ConnectedBodyModel";
import type { ConnectedBodyPart } from "./ConnectedBodyPart";

/**
 * Pack an admitted static model into owned Float32 attributes and Uint32 incidence before worker transfer. Skeletons, attached parts, procedural geometry and skinned meshes refuse. The shared precision owner checks finite aligned attributes, direction and face preservation; topology then checks each rounded mesh with the material's thickness deciding expected closure.
 *
 * Physical source records and nullable integer mappings are copied without GPU narrowing. Colors receive a new Float32 buffer, while outer model/material metadata, part transforms and other non-geometry fields remain borrowed until transport clones them. Packing itself performs neither transfer nor clinical qualification, and failure leaves the input unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Static admission precedes the shared precision conversion and rounded-position topology check, with expected closure derived from the actual matching material thickness.
 * @evidence contracts/common.md#clear-and-simple-design The packer owns transport representation and delegates face/normal preservation and topology to their existing numerical boundaries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No part is exempted by fixture identity; exact physical source IDs remain structured integers, and packed preview geometry does not assert clinical acceptance.
 * @evidence contracts/common.md#meaningful-documentation The prose states static refusals, distinct precision/topology checks, fresh geometry versus borrowed metadata, and transfer/failure effects.
 * @evidence contracts/performance.md#efficient-algorithms Conversion and copying scale with attributes and incidence plus delegated weld/topology scans; each of P parts searches M material records, adding O(PM). Metadata is shared rather than deeply rebuilt.
 * @evidence contracts/performance.md#reuse-equivalent-work Each part's packed buffers serve its topology check and output; equivalent admission work is shared with glTF through float32MeshBuffers rather than a duplicate conversion policy, and no mutable model cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned geometry owns its typed buffers and copied physical mappings; temporary rounded number arrays and topology results are call-local, with no GPU handle, task or persistent cache acquired.
 */
export function packConnectedBodyModel(
  model: IAutoMovieModel,
): ConnectedBodyModel {
  if (model.skeleton !== null)
    throw new Error("Body previews require a static posed model.");
  const parts: ConnectedBodyPart[] = model.parts.map((part: IAutoMovieModelPart): ConnectedBodyPart => {
    if (
      part.geometry.type !== "mesh" ||
      part.attachedBone !== null ||
      part.geometry.mesh.skin !== null
    )
      throw new Error("Body previews require static mesh parts.");
    const mesh: IAutoMovieMesh = part.geometry.mesh;
    const packed: ReturnType<typeof float32MeshBuffers> = float32MeshBuffers(mesh);
    const material: IAutoMovieMaterial | undefined = model.materials.find((one: IAutoMovieMaterial): boolean => one.id === part.material);
    if (
      !validateMeshTopology({
        mesh: { ...mesh, positions: Array.from(packed.positions) },
        expectClosed: (material?.thickness ?? 0) > 0,
      }).success
    )
      throw new Error("Body Float32 topology is invalid: " + part.id);
    return {
      ...part,
      geometry: {
        type: "mesh",
        mesh: {
          ...packed,
          ...(mesh.colors === undefined
            ? {}
            : { colors: new Float32Array(mesh.colors) }),
          ...(mesh.physicalVertices === undefined
            ? {}
            : {
                physicalVertices: {
                  sources: mesh.physicalVertices.sources.map((source: NonNullable<IAutoMovieMesh["physicalVertices"]>["sources"][number]): NonNullable<IAutoMovieMesh["physicalVertices"]>["sources"][number] => ({
                    ...source,
                  })),
                  vertices: mesh.physicalVertices.vertices.slice(),
                },
              }),
          skin: null,
        },
      },
    };
  });
  return { ...model, parts };
}
