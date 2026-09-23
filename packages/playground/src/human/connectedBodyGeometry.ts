/**
 * Pack the evaluated static body's mesh into independently owned Float32 and
 * Uint32 preview arrays. This matches the GLB precision boundary before a
 * buffer is transferred. The GLB exporter separately validates merged
 * material groups, while this boundary validates each mesh the GPU receives.
 */
import { validateMeshTopology } from "@automovie/engine";
import { portraitMeshBuffers } from "@automovie/human";
import type { IAutoMovieModel } from "@automovie/interface";

import type {
  ConnectedBodyModel,
  ConnectedBodyPart,
} from "./connectedBodyProtocol";

/** Validate and pack the local meshes before ownership moves to the page. */
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
    const packed = portraitMeshBuffers(mesh);
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
          skin: null,
        },
      },
    };
  });
  return { ...model, parts };
}
