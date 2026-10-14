import { validateMeshTopology } from "@automovie/engine";
import { float32MeshBuffers } from "@automovie/human/common/mesh/float32MeshBuffers";
import type { IHumanFloat32MeshBuffers } from "@automovie/human/common/mesh/IHumanFloat32MeshBuffers";
import type { IAutoMovieModel, IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";
import type { IAutoMovieModelObject } from "../../IAutoMovieModelObject.js";
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
 * writing GPU buffers so tracked arrays and closure obligations must still
 * match. The caller preserves part order and other static configuration while
 * holding a prepared frame; this witness does not freeze the entire model.
 * Replaced or discarded groups start independent geometry/material and cache
 * retirement after the synchronous publication stack. The explicit settlement
 * port reports every failure, retains uncertain ownership and blocks later
 * allocation. Closing includes caches still preparing and never ends the
 * renderer or context borrowed from the viewport.
 *
 * @evidence contracts/common.md#principled-implementation Admits static unskinned meshes, checks actual Float32 conversion and required topology, and retains exact array/physical witnesses before any texture loading or native reuse. Publication rechecks witnesses/closure before writes; static part configuration must remain stable, and a native buffer-write failure can still interrupt publication after preflight.
 * @evidence contracts/common.md#clear-and-simple-design Asynchronous numerical validation/texture preparation is separate from synchronous active-resident publication and explicit retirement settlement. Scene attachment stays with the viewport; this owner holds group geometry/materials and cache textures.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported rigs/primitives refuse rather than becoming frozen meshes. Actual source arrays and physical partition establish gate reuse without fixture geometry, hashes or a desired silhouette; numerical topology admission does not certify clinical anatomy or observed beauty.
 * @evidence contracts/common.md#meaningful-documentation The comment gives gate-before-load order, current Float32 representation, witness/static configuration limits, synchronous publication and failure-retaining disposal. The supplied native context remains borrowed.
 * @evidence contracts/performance.md#efficient-algorithms Preparation scans parts/material closure requirements, exact witness buffers and static configuration; changed geometry runs Float32 packing and topology gates whose actual mesh dimensions dominate. New residents allocate geometry/materials and load distinct textures; publication uploads all current coordinates/normals and recomputes native bounds, with normal recomputation when absent.
 * @evidence contracts/performance.md#reuse-equivalent-work Exact arrays, physical partition and closure obligation permit reuse of a geometry verdict; materials/static part/attribute structure separately permit reuse of native residents. Coordinate changes still upload current buffers and incompatible structure receives an independent group/cache scope.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Preparation registers each cache's group/texture retirement before interruptible loading. Discard retires nonactive residents, publish retires replaced residents and close includes preparing caches. Failed release retains owned closers and blocks allocation; retained numerical witnesses and concurrently preparing residents have no separate count cap.
 */
export function createConnectedFaceRenderer(
  props: IConnectedFaceRendererProps,
): { prepare: (model: IAutoMovieModel) => Promise<IConnectedFaceFrame>; publish: (frame: IConnectedFaceFrame) => THREE.Group; dispose: (frame: IConnectedFaceFrame) => void; settleRetirements: () => Promise<void>; close: () => Promise<void>; } {
  let active: IConnectedFaceResident | undefined;
  const retirement: AutoMovieResourceRetirementScope = new AutoMovieResourceRetirementScope();
  const release: (resident: IConnectedFaceResident) => void = (resident: IConnectedFaceResident): void => {
    if (resident.released) return;
    resident.released = true;
    retirement.release(resident.textures);
  };
  const dispose: (frame: IConnectedFaceFrame) => void = (frame: IConnectedFaceFrame): void => {
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
      const meshes: IAutoMovieMesh[] = model.parts.map((part: IAutoMovieModelPart, index: number): IAutoMovieMesh => {
        if (
          part.geometry.type !== "mesh" ||
          part.attachedBone !== null ||
          part.geometry.mesh.skin !== null
        )
          throw new Error("Connected previews require static resident meshes.");
        const mesh: IAutoMovieMesh = part.geometry.mesh;
        const closed: boolean = needsConnectedFaceClosedSurface(model, part);
        const previous: IConnectedFaceMeshWitness | undefined = active?.witnesses[index];
        if (matchesConnectedFaceMeshWitness(mesh, closed, previous)) {
          witnesses.push(previous!);
          return mesh;
        }
        const packed: IHumanFloat32MeshBuffers = float32MeshBuffers(mesh);
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
      const textures: AutoMovieTextureCache = new AutoMovieTextureCache(async (asset: string): Promise<THREE.Texture<unknown, THREE.TextureEventMap>> => {
        const texture: THREE.Texture<unknown, THREE.TextureEventMap> = await props.loadTexture(asset);
        // Connected assets retain the glTF UV convention used by the exporter.
        // TextureLoader's default vertical flip would invert every atlas.
        texture.flipY = false;
        return texture;
      });
      let group: THREE.Group | undefined;
      retirement.own(textures, createAutoMovieResourceRetirement([
        (): void => { if (group !== undefined) releaseHumanPreviewGroup(group); },
        (): Promise<void> => textures.dispose(),
      ]));
      try {
        await textures.prime(model.materials.flatMap(materialTextureBindings));
        retirement.requireOpen();
        const built: IAutoMovieModelObject = buildModel(model, textures.resolve);
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
              (part: IAutoMovieModelPart): THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap> => built.parts.get(part.id) as THREE.Mesh,
            ),
          },
          model,
          meshes,
          witnesses,
        };
      } catch (error) {
        retirement.release(textures);
        return createAutoMovieResourceRetirement(
          [(): Promise<void> => retirement.settle()], { error },
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
        const part: IAutoMovieModelPart = frame.model.parts[index];
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
        const geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap> = frame.resident.meshes[index].geometry;
        const positions: THREE.BufferAttribute<THREE.BufferAttributeEventMap> = geometry.getAttribute(
          "position",
        ) as THREE.BufferAttribute;
        positions.set(mesh.positions);
        positions.needsUpdate = true;
        if (mesh.normals !== null) {
          const normals: THREE.BufferAttribute<THREE.BufferAttributeEventMap> = geometry.getAttribute(
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
