/**
 * Lower transferred body meshes with the viewer's material rules. A prepared
 * frame stays off screen until the editor commits it. Identical topology and
 * finish reuse the displayed Three buffers; changed topology or finish gets a
 * new group. Only the renderer owns and releases GPU and texture resources.
 */
import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine";
import type { ConnectedBodyModel } from "@automovie/human/body/runtime/ConnectedBodyModel";
import type { ConnectedBodyPart } from "@automovie/human/body/runtime/ConnectedBodyPart";
import type {
  IAutoMovieMeshPhysicalVertices,
  IAutoMovieModel,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieResourceRetirementScope } from "../../AutoMovieResourceRetirementScope.js";
import type { IAutoMovieModelObject } from "../../IAutoMovieModelObject.js";
import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import {
  AutoMovieGeometryPhysicalVertices,
  AutoMovieTextureCache,
  buildModel,
  materialTextureBindings,
} from "../../index.js";
import { prepareHumanPreview } from "../common/prepareHumanPreview.js";
import { releaseHumanPreviewGroup } from "../common/releaseHumanPreviewGroup.js";
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
 *
 * @evidence contracts/common.md#principled-implementation Preparation validates cloned physical-vertex correspondence, primes owned textures and allocates a resident only when sameConnectedBodyStructure refuses reuse. Publication preflights physical metadata/coordinates before writing buffers; the input topology and part order must remain stable after preparation, and a native write failure can still interrupt publication after preflight.
 * @evidence contracts/common.md#clear-and-simple-design One owner separates asynchronous preparation from synchronous publication and explicit retirement settlement. The viewport alone attaches groups, while this renderer owns their geometry/materials and texture caches.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Numerical typed indices are materialized only for native setIndex's array contract; no coordinates or clinical measurements are replaced. Physical correspondence is checked against actual prepared metadata, and cache ownership is not hidden in a texture resolver wrapper.
 * @evidence contracts/common.md#meaningful-documentation The comment states offscreen preparation, resident reuse, synchronous publication and failure-retaining retirement. Supplied host GPU context remains borrowed; accepted frame ownership transfers to the active resident until replacement or close.
 * @evidence contracts/performance.md#efficient-algorithms Preparation scans model parts, physical mappings and reuse topology and loads distinct texture assets; new residents copy indices and allocate full model buffers. Publication visits all part vertices/normals and recomputes bounds, with native normal computation when normals are absent. Reuse saves resident allocation rather than eliminating uploads.
 * @evidence contracts/performance.md#reuse-equivalent-work Static topology, materials and non-geometry part configuration determine resident reuse; coordinates and physical metadata remain current per frame. The active group is shared by deformation frames, while incompatible models receive independent residents and owned texture scopes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retirement tracks each prepared cache immediately and closes its group and textures independently. Discarded nonactive frames release their resident, publication retires the previous resident, and close includes prepared caches. The number of concurrently preparing frames is not capped here; failed or indeterminate release retains ownership and blocks new allocation.
 */
export function createConnectedBodyRenderer(
  props: IConnectedBodyRendererProps,
): {
  prepare: (model: ConnectedBodyModel) => Promise<IConnectedBodyFrame>;
  publish: (frame: IConnectedBodyFrame) => THREE.Group;
  dispose: (frame: IConnectedBodyFrame) => void;
  settleRetirements: () => Promise<void>;
  close: () => Promise<void>;
} {
  /** A transferred body part with indices materialized for the native array API. */
  type BodyViewPart = Omit<ConnectedBodyPart, "geometry"> & {
    geometry: {
      type: "mesh";
      mesh: Omit<ConnectedBodyPart["geometry"]["mesh"], "indices"> & {
        indices: number[];
      };
    };
  };
  let active: IConnectedBodyResident | undefined;
  const retirement: AutoMovieResourceRetirementScope =
    new AutoMovieResourceRetirementScope();
  const release: (resident: IConnectedBodyResident) => void = (
    resident: IConnectedBodyResident,
  ): void => {
    if (resident.released) return;
    resident.released = true;
    retirement.release(resident.textures);
  };
  return {
    prepare: async (
      model: ConnectedBodyModel,
    ): Promise<IConnectedBodyFrame> => {
      await retirement.ready();
      const physical: (IAutoMovieMeshPhysicalVertices | undefined)[] =
        model.parts.map(
          (
            part: ConnectedBodyPart,
          ): IAutoMovieMeshPhysicalVertices | undefined => {
            const metadata: IAutoMovieMeshPhysicalVertices | undefined =
              structuredClone(part.geometry.mesh.physicalVertices);
            if (metadata !== undefined)
              resolveAutoMovieMeshPhysicalVertices({
                positions: Array.from(part.geometry.mesh.positions),
                physicalVertices: metadata,
              });
            return metadata;
          },
        );
      if (active !== undefined && sameConnectedBodyStructure(active, model))
        return { resident: active, model, physical };
      const textures: AutoMovieTextureCache = new AutoMovieTextureCache(
        async (
          asset: string,
        ): Promise<THREE.Texture<unknown, THREE.TextureEventMap>> => {
          const texture: THREE.Texture<unknown, THREE.TextureEventMap> =
            await props.loadTexture(asset);
          texture.flipY = false;
          return texture;
        },
      );
      let group: THREE.Group | undefined;
      retirement.own(
        textures,
        createAutoMovieResourceRetirement([
          (): void => {
            if (group !== undefined) releaseHumanPreviewGroup(group);
          },
          (): Promise<void> => textures.dispose(),
        ]),
      );
      try {
        await textures.prime(model.materials.flatMap(materialTextureBindings));
        retirement.requireOpen();
        // Float32 attributes are array-like, but Three's setIndex treats a
        // Uint32Array as an already constructed BufferAttribute. Materialize
        // indices only when allocating a new resident group; deformation
        // previews reuse this group's index buffer.
        const viewModel: Omit<ConnectedBodyModel, "parts"> & {
          parts: BodyViewPart[];
        } = {
          ...model,
          parts: model.parts.map(
            (part: ConnectedBodyPart): BodyViewPart => ({
              ...part,
              geometry: {
                type: "mesh" as const,
                mesh: {
                  ...part.geometry.mesh,
                  indices: Array.from(part.geometry.mesh.indices),
                },
              },
            }),
          ),
        };
        const built: IAutoMovieModelObject = buildModel(
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
              (
                part: ConnectedBodyPart,
              ): THREE.Mesh<
                THREE.BufferGeometry<
                  THREE.NormalBufferAttributes,
                  THREE.BufferGeometryEventMap
                >,
                | THREE.Material<THREE.MaterialEventMap>
                | THREE.Material<THREE.MaterialEventMap>[],
                THREE.Object3DEventMap
              > => built.parts.get(part.id) as THREE.Mesh,
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
          [(): Promise<void> => retirement.settle()],
          { error },
        )();
      }
    },
    publish: (frame: IConnectedBodyFrame): THREE.Group => {
      retirement.requireOpen();
      const resident: IConnectedBodyResident = frame.resident;
      if (resident.released)
        throw new Error("This prepared body has been released.");
      if (frame.model.parts.length !== frame.physical.length)
        throw new Error(
          "Prepared body physical correspondence changed: parts.",
        );
      // Finish every metadata/coordinate check before touching displayed buffers.
      for (const [index, part] of frame.model.parts.entries()) {
        const metadata: IAutoMovieMeshPhysicalVertices | undefined =
          frame.physical[index];
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
        const geometry: THREE.BufferGeometry<
          THREE.NormalBufferAttributes,
          THREE.BufferGeometryEventMap
        > = resident.meshes[index].geometry;
        const positions: THREE.BufferAttribute<THREE.BufferAttributeEventMap> =
          geometry.getAttribute("position") as THREE.BufferAttribute;
        positions.set(part.geometry.mesh.positions);
        positions.needsUpdate = true;
        const sourceNormals: Float32Array<ArrayBuffer> | null =
          part.geometry.mesh.normals;
        if (sourceNormals === null) geometry.computeVertexNormals();
        else {
          const normals: THREE.BufferAttribute<THREE.BufferAttributeEventMap> =
            geometry.getAttribute("normal") as THREE.BufferAttribute;
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
