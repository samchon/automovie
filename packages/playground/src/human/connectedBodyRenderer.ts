/**
 * Lower transferred body meshes with the viewer's material rules. A prepared
 * frame stays off screen until the editor commits it. Identical topology and
 * finish reuse the displayed Three buffers; changed topology or finish gets a
 * new group. Only the renderer owns and releases GPU and texture resources.
 */
import type { IAutoMovieModel } from "@automovie/interface";
import {
  AutoMovieTextureCache,
  buildModel,
  materialTextureBindings,
} from "@automovie/viewer";
import * as THREE from "three";

import type {
  ConnectedBodyModel,
  ConnectedBodyPart,
} from "./connectedBodyProtocol";
import { prepareHumanPreview } from "./previewScene";

type Resident = {
  group: THREE.Group;
  parts: ConnectedBodyPart[];
  meshes: THREE.Mesh[];
  materials: string;
  textures: AutoMovieTextureCache;
  released: boolean;
};
type Frame = { resident: Resident; model: ConnectedBodyModel };

const sameArray = (
  a: ArrayLike<number> | null,
  b: ArrayLike<number> | null,
): boolean => {
  if (a === null || b === null) return a === b;
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; ++index)
    if (a[index] !== b[index]) return false;
  return true;
};

function sameStructure(resident: Resident, model: ConnectedBodyModel): boolean {
  if (resident.materials !== JSON.stringify(model.materials)) return false;
  if (resident.parts.length !== model.parts.length) return false;
  return model.parts.every((part, index) => {
    const previous = resident.parts[index];
    if (
      JSON.stringify({ ...part, geometry: undefined }) !==
      JSON.stringify({ ...previous, geometry: undefined })
    )
      return false;
    const mesh = part.geometry.mesh;
    const old = previous.geometry.mesh;
    return (
      mesh.positions.length === old.positions.length &&
      (mesh.normals?.length ?? null) === (old.normals?.length ?? null) &&
      sameArray(mesh.uvs, old.uvs) &&
      sameArray(mesh.colors ?? null, old.colors ?? null) &&
      sameArray(mesh.indices, old.indices)
    );
  });
}

function releaseGroup(group: THREE.Group): void {
  const materials = new Set<THREE.Material>();
  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh !== true) return;
    mesh.geometry.dispose();
    for (const material of Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material])
      materials.add(material);
  });
  for (const material of materials) material.dispose();
}

/** Own and publish the Three.js buffers used by one body editor viewport. */
export function createConnectedBodyRenderer(props: {
  loadTexture: (asset: string) => Promise<THREE.Texture>;
  maxAnisotropy: number;
}) {
  let active: Resident | undefined;
  const release = (resident: Resident): void => {
    if (resident.released) return;
    resident.released = true;
    releaseGroup(resident.group);
    void resident.textures.dispose();
  };
  return {
    prepare: async (model: ConnectedBodyModel): Promise<Frame> => {
      if (active !== undefined && sameStructure(active, model))
        return { resident: active, model };
      const textures = new AutoMovieTextureCache(async (asset) => {
        const texture = await props.loadTexture(asset);
        texture.flipY = false;
        return texture;
      });
      let group: THREE.Group | undefined;
      try {
        await textures.prime(model.materials.flatMap(materialTextureBindings));
        // buildModel accepts array-like mesh attributes. This cast is confined
        // to the viewer boundary: the transport owns typed arrays, whereas the
        // portable IAutoMovieModel type declares ordinary number arrays.
        const built = buildModel(
          model as unknown as IAutoMovieModel,
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
        };
      } catch (error) {
        if (group !== undefined) releaseGroup(group);
        await textures.dispose();
        throw error;
      }
    },
    publish: (frame: Frame): THREE.Group => {
      const resident = frame.resident;
      if (resident.released)
        throw new Error("This prepared body has been released.");
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
      }
      resident.group.name = frame.model.name ?? frame.model.id;
      resident.parts = frame.model.parts;
      if (active !== undefined && active !== resident) release(active);
      active = resident;
      return resident.group;
    },
    dispose: (frame: Frame): void => {
      if (frame.resident !== active) release(frame.resident);
    },
  };
}
