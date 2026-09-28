import { validateMeshTopology } from "@automovie/engine";
import { portraitMeshBuffers } from "@automovie/human";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import {
  AutoMovieTextureCache,
  buildModel,
  materialTextureBindings,
} from "@automovie/viewer";
import * as THREE from "three";

import { prepareHumanPreview } from "./previewScene";

type Resident = {
  group: THREE.Group;
  signature: string;
  meshes: THREE.Mesh[];
  textures: AutoMovieTextureCache;
  released: boolean;
};
type Frame = {
  resident: Resident;
  model: IAutoMovieModel;
  meshes: IAutoMovieMesh[];
};

/** Geometry and materials belong to the group; the cache owns its textures. */
function disposeGroup(group: THREE.Group): void {
  const materials = new Set<THREE.Material>();
  for (const child of group.children) {
    const mesh = child as THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
    mesh.geometry.dispose();
    materials.add(mesh.material);
  }
  for (const material of materials) material.dispose();
}

/**
 * Stage numerical frames before changing any displayed GPU buffer.
 * Static topology, material and transform changes allocate a new resident group;
 * ordinary deformations reuse the current buffers only at publication. A stale
 * prepared frame can be discarded without touching the displayed face.
 * Every preparation checks the actual Float32 representation before cache reuse
 * or texture loading. Export validates its merged material geometry separately;
 * this boundary validates each local mesh that the GPU will actually receive.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Keeps pending numerical edits separate from the committed visible face.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Refuses Float32 surface loss, invalid attributes and topology before resource preparation or publication of a resident frame.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Updates resident geometry while sharing the viewer's material and texture interpretation.
 */
export function createConnectedFaceRenderer(props: {
  loadTexture: (asset: string) => Promise<THREE.Texture>;
  maxAnisotropy: number;
}) {
  let active: Resident | undefined;
  const release = (resident: Resident): void => {
    if (resident.released) return;
    resident.released = true;
    disposeGroup(resident.group);
    void resident.textures.dispose();
  };
  const dispose = (frame: Frame): void => {
    if (frame.resident !== active) release(frame.resident);
  };
  return {
    prepare: async (model: IAutoMovieModel): Promise<Frame> => {
      // The connected compiler emits static resident meshes. Refuse a different
      // model kind instead of accidentally updating a rig or primitive in place.
      if (model.skeleton !== null)
        throw new Error("Connected previews require static resident meshes.");
      const meshes = model.parts.map((part) => {
        if (
          part.geometry.type !== "mesh" ||
          part.attachedBone !== null ||
          part.geometry.mesh.skin !== null
        )
          throw new Error("Connected previews require static resident meshes.");
        const mesh = part.geometry.mesh;
        const packed = portraitMeshBuffers(mesh);
        if (
          !validateMeshTopology({
            mesh: { ...mesh, positions: Array.from(packed.positions) },
            expectClosed: model.materials.some(
              (material) =>
                material.id === part.material && (material.thickness ?? 0) > 0,
            ),
          }).success
        )
          throw new Error(
            "Connected Float32 geometry must preserve its required topology: " +
              part.id,
          );
        return mesh;
      });
      const signature = JSON.stringify({
        materials: model.materials,
        parts: model.parts.map((part, index) => {
          const mesh = meshes[index];
          return {
            ...part,
            geometry: {
              ...mesh,
              positions: mesh.positions.length,
              normals: mesh.normals?.length,
            },
          };
        }),
      });
      if (active?.signature === signature)
        return { resident: active, model, meshes };
      const textures = new AutoMovieTextureCache(async (asset) => {
        const texture = await props.loadTexture(asset);
        // Connected assets retain the glTF UV convention used by the exporter.
        // TextureLoader's default vertical flip would invert every atlas.
        texture.flipY = false;
        return texture;
      });
      let group: THREE.Group | undefined;
      try {
        await textures.prime(model.materials.flatMap(materialTextureBindings));
        const built = buildModel(model, textures.resolve);
        group = built.object;
        prepareHumanPreview(group, props.maxAnisotropy);
        return {
          resident: {
            group,
            signature,
            textures,
            released: false,
            meshes: model.parts.map(
              (part) => built.parts.get(part.id) as THREE.Mesh,
            ),
          },
          model,
          meshes,
        };
      } catch (error) {
        if (group !== undefined) disposeGroup(group);
        await textures.dispose();
        throw error;
      }
    },
    publish: (frame: Frame): THREE.Group => {
      if (frame.resident.released)
        throw new Error("This prepared face has been released.");
      // Every buffer has matching shape because the signature contains its
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
      return active.group;
    },
    dispose,
  };
}
