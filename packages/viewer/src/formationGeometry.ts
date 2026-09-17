/**
 * Rigid geometry flattening shared by formations and ordinary instance sets.
 * Clone resident part geometry into world-rest metre coordinates; original
 * buffers and caller objects remain owned by their builders. Reject unsupported
 * skinning, morphs and multi-material parts before merging. Named material
 * objects remain shared. Per-vertex part IDs address a separately baked cycle;
 * flattening precedes baking because baking changes the temporary source pose.
 * Mixed RGB/RGBA becomes one Float32 layout with white/opaque identity values
 * for missing channels, preserving normalized/interleaved source semantics.
 */
import type { IAutoMovieModel } from "@automovie/interface";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { IAutoMovieModelObject, buildModel } from "./buildModel";
import {
  IAutoMovieFormationCycle,
  bakeFormationCycle,
  instancedModelParts,
} from "./formationCycle";

/**
 * Flatten one runtime model for a chunked instancing consumer.
 *
 * The merge is still one geometry per LOD tier, so a chunk is still one draw
 * call, but every vertex now also carries the index of the rigid part it
 * belongs to. That single float is what lets a shader put the part where a
 * cycle says it should be instead of where the rest pose left it, and it costs
 * four bytes per vertex of shared geometry rather than anything per member.
 *
 * Passing `bake` additionally bakes the model's whole repertoire
 * ({@link bakeFormationCycle}); a model that declares no gait, or carries no
 * skeleton to move, returns a null cycle and renders exactly as before.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Flattens the generated model into the representation selected for instanced display.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements the logical-to-display representation boundary.
 */
export const flattenInstancedModel = (
  model: IAutoMovieModel,
  owner = `Instanced runtime model "${model.id}"`,
  bake?: {
    /** Even samples across the cycle. */
    samples?: number;
  },
): {
  geometry: THREE.BufferGeometry;
  materials: THREE.Material[];
  cycle: IAutoMovieFormationCycle | null;
} => {
  const built = buildModel(model);
  built.object.updateMatrixWorld(true);
  const parts = instancedModelParts(built.object);
  const representation = flattenRigidParts(parts, owner);
  // Geometry first, then the bake: baking poses the built object, and the
  // flattened vertices above are the rest-space ones the bake's matrices are
  // measured against.
  return {
    ...representation,
    cycle:
      bake === undefined
        ? null
        : bakeFormationCycle({
            model,
            built,
            parts,
            samples: bake.samples,
          }),
  };
};

/**
 * Flatten one already-loaded rigid generated or imported model prototype.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Flattens the loaded model into the representation selected for instanced display.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Implements the logical-to-display representation boundary.
 */
export const flattenInstancedObject = (
  built: IAutoMovieModelObject,
  owner = "Loaded instanced runtime model",
): {
  geometry: THREE.BufferGeometry;
  materials: THREE.Material[];
  cycle: null;
} => {
  built.object.updateMatrixWorld(true);
  return {
    ...flattenRigidParts(instancedModelParts(built.object), owner),
    cycle: null,
  };
};

const flattenRigidParts = (
  parts: readonly THREE.Mesh[],
  owner: string,
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } => {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  parts.forEach((mesh, index) => {
    if (mesh instanceof THREE.SkinnedMesh)
      throw new Error(`${owner} has a skinned source mesh.`);
    if (
      Object.values(mesh.geometry.morphAttributes).some(
        (attributes) => attributes.length > 0,
      )
    )
      throw new Error(`${owner} has morph-target source geometry.`);
    if (Array.isArray(mesh.material))
      throw new Error(`${owner} has a multi-material source mesh.`);
    const flattened = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    flattened.setAttribute(
      "automoviePart",
      new THREE.Float32BufferAttribute(
        new Float32Array(flattened.getAttribute("position")!.count).fill(index),
        1,
      ),
    );
    geometries.push(flattened);
    materials.push(mesh.material);
  });
  // Mixed colour presence has a defined identity, unlike a missing UV layout.
  // Normalize imported integer/interleaved RGB(A) to one Float32 layout and
  // fill bare vertices (and RGB alpha) with one. Only owned clones are changed.
  let colorSize = 0;
  for (const geometry of geometries) {
    const color = geometry.getAttribute("color");
    if (color === undefined) continue;
    if (
      (color.itemSize !== 3 && color.itemSize !== 4) ||
      color.count !== geometry.getAttribute("position").count
    )
      throw new Error(`${owner} needs one RGB or RGBA colour per vertex.`);
    colorSize = Math.max(colorSize, color.itemSize);
  }
  if (colorSize !== 0)
    for (const geometry of geometries) {
      const color = geometry.getAttribute("color");
      const count = geometry.getAttribute("position").count;
      const values = new Float32Array(count * colorSize).fill(1);
      if (color !== undefined)
        for (let vertex = 0; vertex < count; ++vertex)
          for (let channel = 0; channel < color.itemSize; ++channel)
            values[vertex * colorSize + channel] = color.getComponent(
              vertex,
              channel,
            );
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(values, colorSize),
      );
    }
  const geometry = mergeGeometries(geometries, true);
  if (geometry === null || materials.length === 0)
    throw new Error(`${owner} cannot be flattened for instancing.`);
  return { geometry, materials };
};
