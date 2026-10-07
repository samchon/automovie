import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { IAutoMovieInstancedGeometry } from "./IAutoMovieInstancedGeometry";

/**
 * Clone rigid parts into world-rest geometry in their shared traversal order.
 * Reject skin, morph and multi-material sources before merging; normalize
 * mixed colour and relief presence on the owned clones while retaining the
 * original material objects. No source buffers or materials are mutated.
 *
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-representation-semantic-preservation Constructs the rigid geometry accepted for one instanced prototype representation.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Shares one part-order and attribute-normalization owner between generated and adopted prototypes.
 */

export const flattenRigidParts = (
  parts: readonly THREE.Mesh[],
  owner: string,
): IAutoMovieInstancedGeometry => {
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
  // relief weights likewise: a bare vertex's is one, its material not reading it
  if (geometries.some((geometry) => geometry.hasAttribute("reliefWeight")))
    for (const geometry of geometries)
      if (!geometry.hasAttribute("reliefWeight"))
        geometry.setAttribute(
          "reliefWeight",
          new THREE.Float32BufferAttribute(
            new Float32Array(geometry.getAttribute("position").count).fill(1),
            1,
          ),
        );
  const geometry = mergeGeometries(geometries, true);
  if (geometry === null || materials.length === 0)
    throw new Error(`${owner} cannot be flattened for instancing.`);
  return { geometry, materials };
};
