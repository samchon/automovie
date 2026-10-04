import { createMeshPhysicalPartitionMatcher, validateMeshTopology } from "@automovie/engine";
import { float32MeshBuffers } from "@automovie/human";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import {
  AutoMovieTextureCache,
  buildModel,
  materialTextureBindings,
} from "@automovie/viewer";
import * as THREE from "three";

import { prepareHumanPreview } from "../common/previewScene";

type Resident = {
  group: THREE.Group;
  signature: string;
  meshes: THREE.Mesh[];
  witnesses: MeshWitness[];
  textures: AutoMovieTextureCache;
  released: boolean;
};
type Frame = {
  resident: Resident;
  model: IAutoMovieModel;
  meshes: IAutoMovieMesh[];
  witnesses: MeshWitness[];
};

type MeshWitness = {
  positions: readonly number[];
  normals: readonly number[] | null;
  indices: readonly number[] | null;
  uvs: readonly number[] | null;
  closed: boolean;
  physical: ReturnType<typeof createMeshPhysicalPartitionMatcher>;
};

/** Exact source arrays certified by the Float32 and manifold gates. */
function witnessOf(mesh: IAutoMovieMesh, closed: boolean): MeshWitness {
  return {
    positions: mesh.positions.slice(),
    normals: mesh.normals?.slice() ?? null,
    indices: mesh.indices?.slice() ?? null,
    uvs: mesh.uvs?.slice() ?? null,
    closed,
    physical: createMeshPhysicalPartitionMatcher(mesh),
  };
}

/**
 * Equality is exact rather than a hash: equal input arrays and the same
 * closure obligation have the same Float32 conversion and topology verdict.
 * Vertex colours are omitted because neither geometry gate reads them; the
 * numerical model admission and GPU material preparation still do.
 */
function matchesWitness(
  mesh: IAutoMovieMesh,
  closed: boolean,
  witness: MeshWitness | undefined,
): boolean {
  if (witness === undefined || closed !== witness.closed) return false;
  const same = (
    values: readonly number[] | null,
    previous: readonly number[] | null,
  ): boolean =>
    values === null || previous === null
      ? values === previous
      : values.length === previous.length &&
        values.every((value, index) => value === previous[index]);
  return (
    same(mesh.positions, witness.positions) &&
    same(mesh.normals, witness.normals) &&
    same(mesh.indices, witness.indices) &&
    same(mesh.uvs, witness.uvs) && witness.physical(mesh)
  );
}

/** Material thickness determines whether an otherwise open surface must seal. */
function needsClosedSurface(
  model: IAutoMovieModel,
  part: IAutoMovieModel["parts"][number],
): boolean {
  return model.materials.some(
    (material) =>
      material.id === part.material && (material.thickness ?? 0) > 0,
  );
}

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
 * A published resident retains exact copies of the source positions, normals,
 * indices and UVs that passed those checks. An appearance edit with the same
 * arrays and closure requirement reuses that verdict; any changed array takes
 * the complete Float32/topology gates. Publication compares once more before
 * writing GPU buffers so a candidate cannot change after preparation.
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
      const witnesses: MeshWitness[] = [];
      const meshes = model.parts.map((part, index) => {
        if (
          part.geometry.type !== "mesh" ||
          part.attachedBone !== null ||
          part.geometry.mesh.skin !== null
        )
          throw new Error("Connected previews require static resident meshes.");
        const mesh = part.geometry.mesh;
        const closed = needsClosedSurface(model, part);
        const previous = active?.witnesses[index];
        if (matchesWitness(mesh, closed, previous)) {
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
        witnesses.push(witnessOf(mesh, closed));
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
        return { resident: active, model, meshes, witnesses };
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
        if (group !== undefined) disposeGroup(group);
        await textures.dispose();
        throw error;
      }
    },
    publish: (frame: Frame): THREE.Group => {
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
          !matchesWitness(
            mesh,
            needsClosedSurface(frame.model, part),
            frame.witnesses[index],
          )
        )
          throw new Error(
            "Prepared face geometry changed before publication: " +
              (part?.id ?? index),
          );
      }
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
      active.witnesses = frame.witnesses;
      return active.group;
    },
    dispose,
  };
}
