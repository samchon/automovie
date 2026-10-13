/**
 * Lower transferred body meshes with the viewer's material rules. A prepared
 * frame stays off screen until the editor commits it. Identical topology and
 * finish reuse the displayed Three buffers; changed topology or finish gets a
 * new group. Only the renderer owns and releases GPU and texture resources.
 */
import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import {
  AutoMovieGeometryPhysicalVertices,
  AutoMovieTextureCache,
  buildModel,
  materialTextureBindings,
} from "../../index.js";
import * as THREE from "three";
import { AutoMovieResourceRetirementScope } from "../../AutoMovieResourceRetirementScope.js";
import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";

import { prepareHumanPreview } from "../common/prepareHumanPreview.js";
import { releaseHumanPreviewGroup } from "../common/releaseHumanPreviewGroup.js";
import type { ConnectedBodyModel } from "@automovie/human/body/runtime/ConnectedBodyModel";
import type { IConnectedBodyFrame } from "./IConnectedBodyFrame.js";
import type { IConnectedBodyRendererProps } from "./IConnectedBodyRendererProps.js";
import type { IConnectedBodyResident } from "./IConnectedBodyResident.js";
import { sameConnectedBodyStructure } from "./sameConnectedBodyStructure.js";

/**
 * Own and publish the Three.js buffers used by one body editor viewport.
 * Publication remains synchronous. Independent group/cache retirement starts
 * after its call stack and has an explicit settlement; failure retains unknown
 * ownership and blocks new allocation. Final close includes preparing caches,
 * while the viewport's borrowed renderer and context remain untouched.
 */
export function createConnectedBodyRenderer(
  props: IConnectedBodyRendererProps,
) {
  let active: IConnectedBodyResident | undefined;
  const retirement = new AutoMovieResourceRetirementScope();
  const release = (resident: IConnectedBodyResident): void => {
    if (resident.released) return;
    resident.released = true;
    retirement.release(resident.textures);
  };
  return {
    prepare: async (
      model: ConnectedBodyModel,
    ): Promise<IConnectedBodyFrame> => {
      await retirement.ready();
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
      retirement.own(textures, createAutoMovieResourceRetirement([
        () => { if (group !== undefined) releaseHumanPreviewGroup(group); },
        () => textures.dispose(),
      ]));
      try {
        await textures.prime(model.materials.flatMap(materialTextureBindings));
        retirement.requireOpen();
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
        retirement.release(textures);
        return createAutoMovieResourceRetirement(
          [() => retirement.settle()], { error },
        )();
      }
    },
    publish: (frame: IConnectedBodyFrame): THREE.Group => {
      retirement.requireOpen();
      const resident = frame.resident;
      if (resident.released)
        throw new Error("This prepared body has been released.");
      if (frame.model.parts.length !== frame.physical.length)
        throw new Error(
          "Prepared body physical correspondence changed: parts.",
        );
      // Finish every metadata/coordinate check before touching displayed buffers.
      for (const [index, part] of frame.model.parts.entries()) {
        const metadata = frame.physical[index];
        if (
          JSON.stringify(part.geometry.mesh.physicalVertices) !==
          JSON.stringify(metadata)
        )
          throw new Error(
            "Prepared body physical correspondence changed: " + part.id,
          );
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
        AutoMovieGeometryPhysicalVertices.writeOwned(
          geometry,
          frame.physical[index],
        );
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
    /** Await owned retirement without changing the synchronous publication. */
    settleRetirements: (): Promise<void> => retirement.settle(),
    /** End this owner's groups and caches; the supplied GPU context remains borrowed. */
    close: (): Promise<void> => {
      if (active !== undefined) active.released = true;
      active = undefined;
      return retirement.close();
    },
  };
}
