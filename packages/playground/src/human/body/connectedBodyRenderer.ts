/**
 * Lower transferred body meshes with the viewer's material rules. A prepared
 * frame stays off screen until the editor commits it. Identical topology and
 * finish reuse the displayed Three buffers; changed topology or finish gets a
 * new group. Only the renderer owns and releases GPU and texture resources.
 */
import type { IAutoMovieModel } from "@automovie/interface";
import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine";
import {
  AutoMovieGeometryPhysicalVertices,
  AutoMovieTextureCache,
  buildModel,
  materialTextureBindings,
} from "@automovie/viewer";
import * as THREE from "three";

import { prepareHumanPreview } from "../common/previewScene";
import { releaseHumanPreviewGroup } from "../common/releaseHumanPreviewGroup";
import type { ConnectedBodyModel } from "./ConnectedBodyModel";
import type { IConnectedBodyFrame } from "./IConnectedBodyFrame";
import type { IConnectedBodyResident } from "./IConnectedBodyResident";
import { sameConnectedBodyStructure } from "./sameConnectedBodyStructure";

/** Own and publish the Three.js buffers used by one body editor viewport.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Displays the committed posed body and its material regions without changing its document.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Prepares resident geometry, reuses matching buffers and swaps visible frames only on publication.
 */
export function createConnectedBodyRenderer(props: {
  loadTexture: (asset: string) => Promise<THREE.Texture>;
  maxAnisotropy: number;
}) {
  let active: IConnectedBodyResident | undefined;
  const release = (resident: IConnectedBodyResident): void => {
    if (resident.released) return;
    resident.released = true;
    releaseHumanPreviewGroup(resident.group);
    void resident.textures.dispose();
  };
  return {
    prepare: async (model: ConnectedBodyModel): Promise<IConnectedBodyFrame> => {
      const physical = model.parts.map((part) => {
        const metadata = structuredClone(part.geometry.mesh.physicalVertices);
        if (metadata !== undefined)
          resolveAutoMovieMeshPhysicalVertices({
            positions: Array.from(part.geometry.mesh.positions),
            physicalVertices: metadata,
          });
        return metadata;
      });
      if (active !== undefined && sameConnectedBodyStructure(active, model))
        return { resident: active, model, physical };
      const textures = new AutoMovieTextureCache(async (asset) => {
        const texture = await props.loadTexture(asset);
        texture.flipY = false;
        return texture;
      });
      let group: THREE.Group | undefined;
      try {
        await textures.prime(model.materials.flatMap(materialTextureBindings));
        // Float32 attributes are array-like, but Three's setIndex treats a
        // Uint32Array as an already constructed BufferAttribute. Materialize
        // indices only when allocating a new resident group; deformation
        // previews reuse this group's index buffer.
        const viewModel = {
          ...model,
          parts: model.parts.map((part) => ({
            ...part,
            geometry: {
              type: "mesh" as const,
              mesh: {
                ...part.geometry.mesh,
                indices: Array.from(part.geometry.mesh.indices),
              },
            },
          })),
        };
        const built = buildModel(
          viewModel as unknown as IAutoMovieModel,
          textures.resolve,
        );
        group = built.object;
        prepareHumanPreview(group, props.maxAnisotropy);
        return {
          resident: {
            group,
            parts: model.parts,
            meshes: model.parts.map(
              (part) => built.parts.get(part.id) as THREE.Mesh,
            ),
            materials: JSON.stringify(model.materials),
            textures,
            released: false,
          },
          model,
          physical,
        };
      } catch (error) {
        if (group !== undefined) releaseHumanPreviewGroup(group);
        await textures.dispose();
        throw error;
      }
    },
    publish: (frame: IConnectedBodyFrame): THREE.Group => {
      const resident = frame.resident;
      if (resident.released)
        throw new Error("This prepared body has been released.");
      if (frame.model.parts.length !== frame.physical.length)
        throw new Error("Prepared body physical correspondence changed: parts.");
      // Finish every metadata/coordinate check before touching displayed buffers.
      for (const [index, part] of frame.model.parts.entries()) {
        const metadata = frame.physical[index];
        if (JSON.stringify(part.geometry.mesh.physicalVertices) !== JSON.stringify(metadata))
          throw new Error("Prepared body physical correspondence changed: " + part.id);
        if (metadata !== undefined)
          resolveAutoMovieMeshPhysicalVertices({
            positions: Array.from(part.geometry.mesh.positions),
            physicalVertices: metadata,
          });
      }
      for (const [index, part] of frame.model.parts.entries()) {
        const geometry = resident.meshes[index].geometry;
        const positions = geometry.getAttribute(
          "position",
        ) as THREE.BufferAttribute;
        positions.set(part.geometry.mesh.positions);
        positions.needsUpdate = true;
        const sourceNormals = part.geometry.mesh.normals;
        if (sourceNormals === null) geometry.computeVertexNormals();
        else {
          const normals = geometry.getAttribute(
            "normal",
          ) as THREE.BufferAttribute;
          normals.set(sourceNormals);
          normals.needsUpdate = true;
        }
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        AutoMovieGeometryPhysicalVertices.writeOwned(geometry, frame.physical[index]);
      }
      resident.group.name = frame.model.name ?? frame.model.id;
      resident.parts = frame.model.parts;
      if (active !== undefined && active !== resident) release(active);
      active = resident;
      return resident.group;
    },
    dispose: (frame: IConnectedBodyFrame): void => {
      if (frame.resident !== active) release(frame.resident);
    },
  };
}
