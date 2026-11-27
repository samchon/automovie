import type {
  IAutoMoviePreparePhysicalGeometry as Geometry,
  IAutoMoviePhysicalShape,
  IAutoMovieSubjectBox,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieRenderSkinnedMesh } from "../../AutoMovieRenderSkinnedMesh.js";
import { AutoMovieRenderThreeKind } from "../../AutoMovieRenderThreeKind.js";
import type { IAutoMovieRenderMaterialShaderPatch } from "../../IAutoMovieRenderMaterialShaderPatch.js";
import "../../dualQuaternionSkinning/internal/createDualQuaternionSkinningShaderPatch.js";
import { readMaterialShaderPatches } from "../../internal/readMaterialShaderPatches.js";
import { hasMaterialDisplacement } from "./hasMaterialDisplacement.js";
import { isAutoMovieFloat32Point } from "../isAutoMovieFloat32Point.js";
import { ReadAutoMovieDisplayedBoxData } from "./ReadAutoMovieDisplayedBoxData";

/*
 * Read the original twelve triangles as one affine closed box. The caller
 * admits the stock opaque material. The placement defaults to the mesh's
 * current world matrix; an instanced member passes its world times instance
 * matrix.
 */
export function readAutoMovieDisplayedBox(
  mesh: THREE.Mesh,
  id: string,
  placement: THREE.Matrix4 = mesh.matrixWorld,
): Geometry.ICollider | null {
  const box: THREE.Box3 | null = proveLocalBox(mesh.geometry);
  return box === null ? null : placeBox(id, box, placement);
}

/*
 * Stock display admission shared with the posed vertex reader.
 */
export namespace readAutoMovieDisplayedBox {
  /*
   * Admit original opaque stock vertex paths with unchanged geometric output.
   */
  export function supportsStockMaterial(mesh: THREE.Mesh): boolean {
    const material: THREE.Material | THREE.Material[] = mesh.material;
    return (
      AutoMovieRenderThreeKind.isMaterial(material) &&
      supportsStockSurface(material) &&
      matchesStockShader(mesh, material) &&
      mesh.onBeforeRender === THREE.Object3D.prototype.onBeforeRender
    );
  }

  /*
   * Admit one opaque stock surface material, leaving its vertex program to the
   * caller.
   */
  export function supportsStockSurface(material: THREE.Material): boolean {
    return (
      (AutoMovieRenderThreeKind.isMeshStandardMaterial(material) ||
        AutoMovieRenderThreeKind.isMeshBasicMaterial(material) ||
        AutoMovieRenderThreeKind.isMeshLambertMaterial(material) ||
        AutoMovieRenderThreeKind.isMeshPhongMaterial(material)) &&
      material.visible &&
      !material.transparent &&
      !material.wireframe &&
      !material.alphaHash &&
      material.alphaTest === 0 &&
      !material.clippingPlanes?.length &&
      !hasMaterialDisplacement(material) &&
      material.side !== THREE.BackSide &&
      material.onBeforeRender === THREE.Material.prototype.onBeforeRender
    );
  }

  /*
   * Project the stock skin's owned conservative sphere by each world affine
   * row.
   */
  export function skinEnvelope(
    mesh: AutoMovieRenderSkinnedMesh,
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
      return r >= 0
        ? { min: center.clone().sub(extent), max: center.add(extent) }
        : null;
    } catch (_error) {
      return null;
    }
  }

  /*
   * A skinned surface must use the same admitted method in its draw path and
   * pose owner.
   */
  function matchesStockShader(
    mesh: THREE.Mesh,
    material: THREE.Material,
  ): boolean {
    if (
      !AutoMovieRenderThreeKind.isAutoMovieSkinnedMesh(mesh) ||
      mesh.method === "linear"
    )
      return (
        material.onBeforeCompile === THREE.Material.prototype.onBeforeCompile
      );
    // The skinned material's own shader patches, each named by its key.
    const patches: readonly IAutoMovieRenderMaterialShaderPatch[] =
      readMaterialShaderPatches(material);
    return (
      patches.length === 1 &&
      patches[0]!.key === ReadAutoMovieDisplayedBoxData.DUAL_QUATERNION_KEY &&
      material.customProgramCacheKey() === ReadAutoMovieDisplayedBoxData.DUAL_QUATERNION_KEY
    );
  }
}

/*
 * Prove the twelve local triangles form one closed box.
 */
function proveLocalBox(geometry: THREE.BufferGeometry): THREE.Box3 | null {
  const points = geometry.getAttribute("position");
  const indices: THREE.BufferAttribute | null = geometry.getIndex();
  if (
    !AutoMovieRenderThreeKind.isBufferAttribute(points) ||
    !AutoMovieRenderThreeKind.isFloat32Array(points.array) ||
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
    !isAutoMovieFloat32Point(box.min) ||
    !isAutoMovieFloat32Point(box.max) ||
    ReadAutoMovieDisplayedBoxData.AXES.some((axis) => box.min[axis] >= box.max[axis])
  )
    return null;
  const codes: number[] = [];
  for (let i: number = 0; i < points.count; ++i) {
    const point: number[] = [points.getX(i), points.getY(i), points.getZ(i)];
    let code: number = 0;
    for (const [j, axis] of ReadAutoMovieDisplayedBoxData.AXES.entries()) {
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
  return box;
}

/*
 * Represent the actual affine box corners even under a sheared parent.
 */
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
  if (!isAutoMovieFloat32Point(center)) return null;
  const shapeBase = { id, material: "displayed", transform: ReadAutoMovieDisplayedBoxData.IDENTITY };
  let shape: IAutoMoviePhysicalShape;
  if ([e[1], e[2], e[4], e[6], e[8], e[9]].every((x) => x === 0)) {
    const halfExtents: THREE.Vector3 = box
      .getSize(new THREE.Vector3())
      .multiplyScalar(0.5);
    halfExtents.multiply(
      new THREE.Vector3(Math.abs(e[0]!), Math.abs(e[5]!), Math.abs(e[10]!)),
    );
    if (
      !isAutoMovieFloat32Point(halfExtents) ||
      ReadAutoMovieDisplayedBoxData.AXES.some((key) => Math.fround(halfExtents[key]) <= 0)
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
    if (!points.every(isAutoMovieFloat32Point)) return null;
    shape = { ...shapeBase, kind: "hull", points };
  }
  return {
    body: id,
    bone: "root",
    pose: { ...ReadAutoMovieDisplayedBoxData.IDENTITY, position: center },
    shape,
  };
}

/*
 * Only a finite, nonsingular affine world matrix preserves these
 * representations.
 */
function finiteAffine(matrix: THREE.Matrix4): boolean {
  const e = matrix.elements;
  const determinant: number = matrix.determinant();
  return (
    e[3] === 0 && e[7] === 0 && e[11] === 0 && e[15] === 1 && determinant !== 0
  );
}
