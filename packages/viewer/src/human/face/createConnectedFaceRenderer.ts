import { validateMeshTopology } from "@automovie/engine";
import { float32MeshBuffers } from "@automovie/human/common/mesh/float32MeshBuffers";
import type { IAutoMovieModel } from "@automovie/interface";
import {
  AutoMovieTextureCache,
  buildModel,
  materialTextureBindings,
} from "../../index.js";
import * as THREE from "three";
import { AutoMovieResourceRetirementScope } from "../../AutoMovieResourceRetirementScope.js";
import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";

import { prepareHumanPreview } from "../common/prepareHumanPreview.js";
import { releaseHumanPreviewGroup } from "../common/releaseHumanPreviewGroup.js";
import { sameHumanPreviewValue } from "../common/sameHumanPreviewValue.js";
import type { IConnectedFaceFrame } from "./IConnectedFaceFrame.js";
import type { IConnectedFaceMeshWitness } from "./IConnectedFaceMeshWitness.js";
import type { IConnectedFaceRendererProps } from "./IConnectedFaceRendererProps.js";
import type { IConnectedFaceResident } from "./IConnectedFaceResident.js";
import { connectedFaceStructure } from "./connectedFaceStructure.js";
import { createConnectedFaceMeshWitness } from "./createConnectedFaceMeshWitness.js";
import { matchesConnectedFaceMeshWitness } from "./matchesConnectedFaceMeshWitness.js";
import { needsConnectedFaceClosedSurface } from "./needsConnectedFaceClosedSurface.js";

/**
 * Stage numerical frames before changing any displayed GPU buffer.
 * Static topology, material and transform changes allocate a new resident group;
 * ordinary deformations reuse the current buffers only at publication. A stale
 * prepared frame can be discarded without touching the displayed face.
 * Every preparation checks the actual Float32 representation before cache reuse
 * or texture loading. Export validates its merged material geometry separately;
 * this boundary validates each local mesh that the GPU will actually receive.
 * A published resident retains exact copies of the source positions, normals,
 * indices and UVs that passed those checks. An appearance edit with the same
 * arrays and closure requirement reuses that verdict; any changed array takes
 * the complete Float32/topology gates. Publication compares once more before
 * writing GPU buffers so a candidate cannot change after preparation.
 * Replaced or discarded groups start independent geometry/material and cache
 * retirement after the synchronous publication stack. The explicit settlement
 * port reports every failure, retains uncertain ownership and blocks later
 * allocation. Closing includes caches still preparing and never ends the
 * renderer or context borrowed from the viewport.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Keeps pending numerical edits separate from the committed visible face.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Refuses Float32 surface loss, invalid attributes and topology before resource preparation or publication of a resident frame.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Updates resident geometry while sharing the viewer's material and texture interpretation.
 */
export function createConnectedFaceRenderer(
  props: IConnectedFaceRendererProps,
) {
  let active: IConnectedFaceResident | undefined;
  const retirement = new AutoMovieResourceRetirementScope();
  const release = (resident: IConnectedFaceResident): void => {
    if (resident.released) return;
    resident.released = true;
    retirement.release(resident.textures);
  };
  const dispose = (frame: IConnectedFaceFrame): void => {
    if (frame.resident !== active) release(frame.resident);
  };
  return {
    prepare: async (model: IAutoMovieModel): Promise<IConnectedFaceFrame> => {
      await retirement.ready();
      // The connected compiler emits static resident meshes. Refuse a different
      // model kind instead of accidentally updating a rig or primitive in place.
      if (model.skeleton !== null)
        throw new Error("Connected previews require static resident meshes.");
      const witnesses: IConnectedFaceMeshWitness[] = [];
      const meshes = model.parts.map((part, index) => {
        if (
          part.geometry.type !== "mesh" ||
          part.attachedBone !== null ||
          part.geometry.mesh.skin !== null
        )
          throw new Error("Connected previews require static resident meshes.");
        const mesh = part.geometry.mesh;
        const closed = needsConnectedFaceClosedSurface(model, part);
        const previous = active?.witnesses[index];
        if (matchesConnectedFaceMeshWitness(mesh, closed, previous)) {
          witnesses.push(previous!);
          return mesh;
        }
        const packed = float32MeshBuffers(mesh);
        if (
          !validateMeshTopology({
            mesh: { ...mesh, positions: Array.from(packed.positions) },
            expectClosed: closed,
          }).success
        )
          throw new Error(
            "Connected Float32 geometry must preserve its required topology: " +
              part.id,
          );
        witnesses.push(createConnectedFaceMeshWitness(mesh, closed));
        return mesh;
      });
      if (
        active !== undefined &&
        sameHumanPreviewValue(
          active.structure,
          connectedFaceStructure(model, meshes, null),
        )
      )
        return { resident: active, model, meshes, witnesses };
      const textures = new AutoMovieTextureCache(async (asset) => {
        const texture = await props.loadTexture(asset);
        // Connected assets retain the glTF UV convention used by the exporter.
        // TextureLoader's default vertical flip would invert every atlas.
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
        const built = buildModel(model, textures.resolve);
        group = built.object;
        prepareHumanPreview(group, props.maxAnisotropy);
        return {
          resident: {
            group,
            structure: connectedFaceStructure(model, meshes, witnesses),
            textures,
            released: false,
            witnesses,
            meshes: model.parts.map(
              (part) => built.parts.get(part.id) as THREE.Mesh,
            ),
          },
          model,
          meshes,
          witnesses,
        };
      } catch (error) {
        retirement.release(textures);
        return createAutoMovieResourceRetirement(
          [() => retirement.settle()], { error },
        )();
      }
    },
    publish: (frame: IConnectedFaceFrame): THREE.Group => {
      retirement.requireOpen();
      if (frame.resident.released)
        throw new Error("This prepared face has been released.");
      if (
        frame.model.parts.length !== frame.meshes.length ||
        frame.witnesses.length !== frame.meshes.length
      )
        throw new Error(
          "Prepared face geometry changed before publication: parts",
        );
      // A candidate can be held across asynchronous editor work. Check that
      // the arrays about to reach the GPU are the arrays preparation admitted,
      // including any closure rule changed through its material binding.
      for (const [index, mesh] of frame.meshes.entries()) {
        const part = frame.model.parts[index];
        if (
          part === undefined ||
          !matchesConnectedFaceMeshWitness(
            mesh,
            needsConnectedFaceClosedSurface(frame.model, part),
            frame.witnesses[index],
          )
        )
          throw new Error(
            "Prepared face geometry changed before publication: " +
              (part?.id ?? index),
          );
      }
      // Every buffer has matching shape because the reuse structure holds its
      // lengths and static topology. No asynchronous work occurs during commit.
      for (const [index, mesh] of frame.meshes.entries()) {
        const geometry = frame.resident.meshes[index].geometry;
        const positions = geometry.getAttribute(
          "position",
        ) as THREE.BufferAttribute;
        positions.set(mesh.positions);
        positions.needsUpdate = true;
        if (mesh.normals !== null) {
          const normals = geometry.getAttribute(
            "normal",
          ) as THREE.BufferAttribute;
          normals.set(mesh.normals);
          normals.needsUpdate = true;
        } else geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
      }
      frame.resident.group.name = frame.model.name ?? frame.model.id;
      if (active !== undefined && active !== frame.resident) release(active);
      active = frame.resident;
      active.witnesses = frame.witnesses;
      return active.group;
    },
    dispose,
    /** Await owned retirement without changing the synchronous publication. */
    settleRetirements: (): Promise<void> => retirement.settle(),
    /** End only this resource owner's groups and caches, never its borrowed renderer. */
    close: (): Promise<void> => {
      if (active !== undefined) active.released = true;
      active = undefined;
      return retirement.close();
    },
  };
}
