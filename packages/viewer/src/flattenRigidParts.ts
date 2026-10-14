import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import type { IAutoMovieInstancedGeometry } from "./IAutoMovieInstancedGeometry.js";
import { reportAutoMovieResourceRetirement } from "./reportAutoMovieResourceRetirement.js";

/**
 * Clone rigid parts into world-rest geometry in their shared traversal order.
 * Reject skin, morph and multi-material sources before merging; normalize
 * mixed colour and relief presence on the owned clones while retaining the
 * original material objects. No source buffers or materials are mutated.
 * Intermediate clones retire after the merge or any refusal; a cleanup refusal
 * also retires the untransferred merged geometry and preserves all causes.
 *
 * @evidence contracts/common.md#principled-implementation Uses native clone/applyMatrix4 to realize rigid world-rest geometry, adds traversal-index part identity and merges indexed attribute-compatible buffers with native groups; skin/morph/multi-material input refuses, color layout normalizes to Float32 RGB(A) and missing color/relief channels use neutral one. Invertible admitted transforms and compatible remaining attributes are premises.
 * @evidence contracts/common.md#clear-and-simple-design Owns rigid buffer normalization/merge only and borrows original materials, leaving generated model acquisition and optional gait bake to their own owner; owned temporary clones never become persistent per-member geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every actual source part follows the same native transform and attribute rules; neutral color/alpha/relief values are multiplication identities, not fixture colors, and unsupported deformation is refused rather than drawn at rest under a generic wrapper.
 * @evidence contracts/common.md#meaningful-documentation States source immutability, rigid-only admission, ordered part indices, mixed-color/relief normalization, borrowed materials and intermediate/failure retirement boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Clones/transforms all V source vertices, scans color attributes and fills only normalized channels, then merges V vertices/indices once; O(V+indices) dominant buffer work with peak temporary source-clone plus merged arrays and O(P) part/material references.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses actual source material objects and one canonical merge rather than creating per-member materials; normalization reuses native transformed attributes, while mutable source matrices/buffers preclude an unkeyed cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Registers clones before transform/attribute edits and independently disposes all intermediates on success/refusal; if intermediate retirement fails, the untransferred merged geometry also retires. Success transfers exactly one merged geometry and borrowed material references, never disposing caller-owned source geometry/materials.
 */

export const flattenRigidParts: (parts: readonly THREE.Mesh[], owner: string) => IAutoMovieInstancedGeometry = (
  parts: readonly THREE.Mesh[],
  owner: string,
): IAutoMovieInstancedGeometry => {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  let merged: THREE.BufferGeometry | undefined;
  try {
  parts.forEach((mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>, index: number): void => {
    if (mesh instanceof THREE.SkinnedMesh)
      throw new Error(`${owner} has a skinned source mesh.`);
    if (
      Object.values(mesh.geometry.morphAttributes).some(
        (attributes: (THREE.InterleavedBufferAttribute | THREE.BufferAttribute<THREE.BufferAttributeEventMap>)[]): boolean => attributes.length > 0,
      )
    )
      throw new Error(`${owner} has morph-target source geometry.`);
    if (Array.isArray(mesh.material))
      throw new Error(`${owner} has a multi-material source mesh.`);
    const flattened: THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap> = mesh.geometry.clone();
    geometries.push(flattened);
    flattened.applyMatrix4(mesh.matrixWorld);
    flattened.setAttribute(
      "automoviePart",
      new THREE.Float32BufferAttribute(
        new Float32Array(flattened.getAttribute("position")!.count).fill(index),
        1,
      ),
    );
    materials.push(mesh.material);
  });
  // Mixed colour presence has a defined identity, unlike a missing UV layout.
  // Normalize imported integer/interleaved RGB(A) to one Float32 layout and
  // fill bare vertices (and RGB alpha) with one. Only owned clones are changed.
  let colorSize: number = 0;
  for (const geometry of geometries) {
    const color: THREE.BufferAttribute<THREE.BufferAttributeEventMap> | THREE.InterleavedBufferAttribute = geometry.getAttribute("color");
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
      const color: THREE.BufferAttribute<THREE.BufferAttributeEventMap> | THREE.InterleavedBufferAttribute = geometry.getAttribute("color");
      const count: number = geometry.getAttribute("position").count;
      const values: Float32Array<ArrayBuffer> = new Float32Array(count * colorSize).fill(1);
      if (color !== undefined)
        for (let vertex: number = 0; vertex < count; ++vertex)
          for (let channel: number = 0; channel < color.itemSize; ++channel)
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
  if (geometries.some((geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>): boolean => geometry.hasAttribute("reliefWeight")))
    for (const geometry of geometries)
      if (!geometry.hasAttribute("reliefWeight"))
        geometry.setAttribute(
          "reliefWeight",
          new THREE.Float32BufferAttribute(
            new Float32Array(geometry.getAttribute("position").count).fill(1),
            1,
          ),
        );
  const geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap> = mergeGeometries(geometries, true);
  if (geometry !== null) merged = geometry;
  if (geometry === null || materials.length === 0)
    throw new Error(`${owner} cannot be flattened for instancing.`);
  } catch (error) {
    reportAutoMovieResourceRetirement([
      ...geometries.map((geometry: THREE.BufferGeometry): (() => void) => (): void => geometry.dispose()),
      ...(merged === undefined ? [] : [(): void => merged!.dispose()]),
    ], { error });
    throw error;
  }
  try {
    reportAutoMovieResourceRetirement(
      geometries.map((geometry: THREE.BufferGeometry): (() => void) => (): void => geometry.dispose()),
    );
  } catch (error) {
    reportAutoMovieResourceRetirement([(): void => merged!.dispose()], { error });
    throw error;
  }
  return { geometry: merged!, materials };
};
