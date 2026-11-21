import type {
  IAutoMoviePreparePhysicalGeometry as Geometry,
  IAutoMoviePhysicalShape,
  IAutoMovieSubjectBox,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieSkinnedMesh } from "../AutoMovieSkinnedMesh.js";
import { createDualQuaternionSkinningShaderPatch } from "../dualQuaternionSkinning/createDualQuaternionSkinningShaderPatch.js";

/** Program identity from the owned dual-quaternion shader builder. */
const DUAL_QUATERNION_KEY: string =
  createDualQuaternionSkinningShaderPatch().key;

/** The three local coordinates of every box corner. */
const AXES = ["x", "y", "z"] as const;
const IDENTITY = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
} satisfies Geometry.ICollider["pose"];

/**
 * Read the original twelve triangles as one affine closed box. The caller
 * admits the stock opaque material. The placement defaults to the mesh's
 * current world matrix; an instanced member passes its world times instance
 * matrix.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names resident positions, complete draw range, world metres and unsupported outcomes.
 * @evidence contracts/development/implementation.md#principled-implementation Eight corner identities, outward triangle winding and a common diagonal on each face prove complete box topology. The actual affine matrix places the box or its eight-corner hull.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Tests the local triangles before converting one admitted geometric representation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not trust the geometry constructor, requested dimensions or a bounding box alone. A cut draw range, stray vertex, missing face or invalid transformation refuses.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most 36 vertices and twelve triangles are inspected before generating at most eight world corners.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads the current buffers and transform; no geometry history is required.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps only the plain solid and placement, with no Three geometry or renderer resource retained.
 */
export function readAutoMovieDisplayedBox(
  mesh: THREE.Mesh,
  id: string,
  placement: THREE.Matrix4 = mesh.matrixWorld,
): Geometry.ICollider | null {
  const geometry: THREE.BufferGeometry = mesh.geometry;
  const points = geometry.getAttribute("position");
  const indices: THREE.BufferAttribute | null = geometry.getIndex();
  if (
    !(points instanceof THREE.BufferAttribute) ||
    !(points.array instanceof Float32Array) ||
    points.itemSize !== 3 ||
    points.normalized ||
    indices?.normalized ||
    ![8, 24, 36].includes(points.count) ||
    (indices?.count ?? points.count) !== 36 ||
    geometry.drawRange.start !== 0 ||
    geometry.drawRange.count < 36 ||
    geometry.morphAttributes.position?.length
  )
    return null;
  const box: THREE.Box3 = new THREE.Box3().setFromBufferAttribute(points);
  if (
    !finite(box.min) ||
    !finite(box.max) ||
    AXES.some((axis) => box.min[axis] >= box.max[axis])
  )
    return null;
  const codes: number[] = [];
  for (let i: number = 0; i < points.count; ++i) {
    const point: number[] = [points.getX(i), points.getY(i), points.getZ(i)];
    let code: number = 0;
    for (const [j, axis] of AXES.entries()) {
      if (point[j] === box.max[axis]) code |= 1 << j;
      else if (point[j] !== box.min[axis]) return null;
    }
    codes.push(code);
  }
  const faces: number[][] = Array.from({ length: 6 }, () => []);
  for (let i: number = 0; i < 36; i += 3) {
    const a: number = codes[indices?.getX(i) ?? i] ?? -1;
    const b: number = codes[indices?.getX(i + 1) ?? i + 1] ?? -1;
    const c: number = codes[indices?.getX(i + 2) ?? i + 2] ?? -1;
    if (a < 0 || b < 0 || c < 0 || a === b || a === c || b === c) return null;
    const fixed: number = ~((a ^ b) | (a ^ c)) & 7;
    const axis: number =
      fixed === 1 ? 0 : fixed === 2 ? 1 : fixed === 4 ? 2 : -1;
    if (axis < 0) return null;
    const u: number = (axis + 1) % 3;
    const v: number = (axis + 2) % 3;
    const delta = (p: number, j: number): number =>
      ((p >> j) & 1) - ((a >> j) & 1);
    const winding: number =
      delta(b, u) * delta(c, v) - delta(b, v) * delta(c, u);
    const side: number = (a >> axis) & 1;
    if (winding !== side * 2 - 1) return null;
    faces[axis * 2 + side]!.push((1 << a) | (1 << b) | (1 << c));
  }
  for (const [face, triangles] of faces.entries()) {
    if (triangles.length !== 2) return null;
    const common: number = triangles[0]! & triangles[1]!;
    const diagonal: number = 7 ^ (1 << Math.floor(face / 2));
    const start: number = 31 - Math.clz32(common);
    if (common !== ((1 << start) | (1 << (start ^ diagonal)))) return null;
  }
  return placeBox(id, box, placement);
}

/** Represent the actual affine box corners even under a sheared parent. */
function placeBox(
  id: string,
  box: THREE.Box3,
  matrix: THREE.Matrix4,
): Geometry.ICollider | null {
  const e: readonly number[] = matrix.elements;
  if (!finiteAffine(matrix)) return null;
  const center: THREE.Vector3 = box
    .getCenter(new THREE.Vector3())
    .applyMatrix4(matrix);
  if (!finite(center)) return null;
  const shapeBase = { id, material: "displayed", transform: IDENTITY };
  let shape: IAutoMoviePhysicalShape;
  if ([e[1], e[2], e[4], e[6], e[8], e[9]].every((x) => x === 0)) {
    const halfExtents: THREE.Vector3 = box
      .getSize(new THREE.Vector3())
      .multiplyScalar(0.5);
    halfExtents.multiply(
      new THREE.Vector3(Math.abs(e[0]!), Math.abs(e[5]!), Math.abs(e[10]!)),
    );
    if (
      !finite(halfExtents) ||
      AXES.some((key) => Math.fround(halfExtents[key]) <= 0)
    )
      return null;
    shape = { ...shapeBase, kind: "box", halfExtents };
  } else {
    const points: THREE.Vector3[] = [];
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y])
        for (const z of [box.min.z, box.max.z])
          points.push(
            new THREE.Vector3(x, y, z).applyMatrix4(matrix).sub(center),
          );
    if (!points.every(finite)) return null;
    shape = { ...shapeBase, kind: "hull", points };
  }
  return {
    body: id,
    bone: "root",
    pose: { ...IDENTITY, position: center },
    shape,
  };
}

/** Only a finite, nonsingular affine world matrix preserves these representations. */
function finiteAffine(matrix: THREE.Matrix4): boolean {
  const e = matrix.elements;
  const determinant: number = matrix.determinant();
  return (
    e.every(Number.isFinite) &&
    e[3] === 0 &&
    e[7] === 0 &&
    e[11] === 0 &&
    e[15] === 1 &&
    Number.isFinite(determinant) &&
    determinant !== 0
  );
}

/** Check admission shared by geometry, bounds and live posed witnesses. */
function finite(point: THREE.Vector3): boolean {
  return AXES.every(
    (axis) =>
      Number.isFinite(point[axis]) && Number.isFinite(Math.fround(point[axis])),
  );
}

/** Stock display admission shared with the posed vertex reader. */
export namespace readAutoMovieDisplayedBox {
  /**
   * Admit original opaque stock vertex paths with unchanged geometric output.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the admitted material and supported skin shader relationship.
   * @evidence contracts/development/implementation.md#principled-implementation Validates the stock Three material, unchanged pre-render geometry path and supported linear or owned dual quaternion shader route.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Keeps display admission with the stock mesh geometry owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unsupported custom, displaced, wireframe, partially transparent or clipped appearance never certifies displayed contact here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Inspects fixed-size material and stock patch facts before traversing vertices.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads current mesh and material properties directly.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps neither a render callback nor a mesh or shader reference after checking.
   */
  export function supportsStockMaterial(mesh: THREE.Mesh): boolean {
    const material: THREE.Material | THREE.Material[] = mesh.material;
    return (
      !Array.isArray(material) &&
      supportsStockSurface(material) &&
      matchesStockShader(mesh, material) &&
      mesh.onBeforeRender === THREE.Object3D.prototype.onBeforeRender
    );
  }

  /**
   * Admit one opaque stock surface material, leaving its vertex program to the caller.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that only the fragment-side appearance is admitted here.
   * @evidence contracts/development/implementation.md#principled-implementation Requires a stock lit or unlit class with full opacity, no clipping, displacement, wireframe or back-only faces.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shared by single-material meshes and multi-material instanced members, whose vertex programs differ.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A caller must still prove the vertex path before certifying displayed contact.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-size property checks.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads current material properties directly.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no material reference.
   */
  export function supportsStockSurface(material: THREE.Material): boolean {
    return (
      (material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshBasicMaterial ||
        material instanceof THREE.MeshLambertMaterial ||
        material instanceof THREE.MeshPhongMaterial) &&
      material.visible &&
      !material.transparent &&
      !material.wireframe &&
      !material.alphaHash &&
      material.alphaTest === 0 &&
      !material.clippingPlanes?.length &&
      (!("displacementMap" in material) || material.displacementMap === null) &&
      material.side !== THREE.BackSide &&
      material.onBeforeRender === THREE.Material.prototype.onBeforeRender
    );
  }

  /** A skinned surface must use the same admitted method in its draw path and pose owner. */
  function matchesStockShader(
    mesh: THREE.Mesh,
    material: THREE.Material,
  ): boolean {
    if (!(mesh instanceof AutoMovieSkinnedMesh) || mesh.method === "linear")
      return (
        material.onBeforeCompile === THREE.Material.prototype.onBeforeCompile
      );
    const patches: unknown = material.userData.shaderPatches;
    const patch: unknown =
      Array.isArray(patches) && patches.length === 1 ? patches[0] : undefined;
    return (
      patch !== null &&
      typeof patch === "object" &&
      "key" in patch &&
      patch.key === DUAL_QUATERNION_KEY &&
      material.customProgramCacheKey() === DUAL_QUATERNION_KEY
    );
  }

  /**
   * Project the stock skin's owned conservative sphere by each world affine row.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the current pose and conservative world-space bounds.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the existing skin sphere and the Euclidean length of each world matrix row to enclose its full affine projection.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Leaves skinning and local sphere production to AutoMovieSkinnedMesh.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never claims exact occupancy from a conservative envelope. Missing bounds stay unavailable.
   * @evidence contracts/development/implementation.md#efficient-algorithms The world projection is constant size after the skin owner obtains its sphere.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the skin owner's current-pose cache and its original culling sphere.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns only a new world box. Existing skin pose and culling storage remains owned by the mesh.
   */
  export function skinEnvelope(
    mesh: AutoMovieSkinnedMesh,
  ): IAutoMovieSubjectBox | null {
    if (!finiteAffine(mesh.matrixWorld)) return null;
    try {
      mesh.computeBoundingSphere();
      const sphere: THREE.Sphere = mesh.boundingSphere;
      const center = sphere.center.clone().applyMatrix4(mesh.matrixWorld);
      const e = mesh.matrixWorld.elements;
      const r: number = sphere.radius;
      const extent = new THREE.Vector3(
        r * Math.hypot(e[0], e[4], e[8]),
        r * Math.hypot(e[1], e[5], e[9]),
        r * Math.hypot(e[2], e[6], e[10]),
      );
      return r >= 0 && finite(center) && finite(extent)
        ? { min: center.clone().sub(extent), max: center.add(extent) }
        : null;
    } catch (_error) {
      return null;
    }
  }
}
