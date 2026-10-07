/**
 * Pack the evaluated static body's mesh into independently owned Float32 and
 * Uint32 preview arrays. This matches the GLB precision boundary before a
 * buffer is transferred. The GLB exporter separately validates merged
 * material groups, while this boundary validates each mesh the GPU receives.
 * Declared physical source-pair/null arrays are copied as structured data,
 * preserving opaque safe integer IDs through postMessage without narrowing
 * them to GPU precision. Omission keeps the original preview payload.
 */
import { validateMeshTopology } from "@automovie/engine";
import { float32MeshBuffers } from "@automovie/human/common/mesh/float32MeshBuffers";
import type { IAutoMovieModel } from "@automovie/interface";

import type { ConnectedBodyModel } from "./ConnectedBodyModel";
import type { ConnectedBodyPart } from "./ConnectedBodyPart";

/** Validate and pack the local meshes before ownership moves to the page.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Supplies the exact posed surface shown by the body editor.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Checks and packs Float32 resident meshes before display preparation.
 */
export function packConnectedBodyModel(
  model: IAutoMovieModel,
): ConnectedBodyModel {
  if (model.skeleton !== null)
    throw new Error("Body previews require a static posed model.");
  const parts: ConnectedBodyPart[] = model.parts.map((part) => {
    if (
      part.geometry.type !== "mesh" ||
      part.attachedBone !== null ||
      part.geometry.mesh.skin !== null
    )
      throw new Error("Body previews require static mesh parts.");
    const mesh = part.geometry.mesh;
    const packed = float32MeshBuffers(mesh);
    const material = model.materials.find((one) => one.id === part.material);
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
                  sources: mesh.physicalVertices.sources.map((source) => ({
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
