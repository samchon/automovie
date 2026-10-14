import { tessellate, type ITessellation } from "@automovie/engine";
import { IAutoMovieGeometry, type IAutoMovieMesh } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieGeometryPhysicalVertices } from "./AutoMovieGeometryPhysicalVertices.js";
import { constructAutoMovieOwnedResources } from "./constructAutoMovieOwnedResources.js";

/**
 * Build a `three.js` geometry from a automovie geometry node: tessellating a
 * parametric primitive (via the engine) or uploading raw mesh arrays.
 * Its buffer object is owned before tessellation or attribute initialization;
 * an initialization refusal independently reports disposal and its original
 * cause rather than leaving an unreturned allocation with no owner.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Uses engine tessellation for primitives and realizes admitted raw position/normal/UV/color/relief/skin arrays as native typed attributes, computing normals only when absent and preserving physical-vertex identity through its owner helper; widths/index bounds and Float32/Uint16 representability are source premises, so numeric narrowing can differ from engine double precision.
 * @evidence contracts/common.md#clear-and-simple-design Owns one Three buffer realization, leaving primitive topology to tessellate, texture semantics to material builders and simulation/render vertex correspondence to AutoMovieGeometryPhysicalVertices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Writes the actual artifact arrays without geometry-id exceptions, copied UV channels or generated placeholder primitives; missing normals use native computation, not fixture normal values.
 * @evidence contracts/common.md#meaningful-documentation Describes primitive/raw realization and immediate geometry ownership/rollback; attribute comments identify the one admitted UV set and the physical/render correspondence helper supplies its own contract.
 * @evidence contracts/performance.md#efficient-algorithms CPU allocation/copy grows with emitted vertices/indices and supplied attribute channels, with one geometry and no redundant UV sets; missing-normal computation visits triangles, while engine primitive tessellation dominates its own shape population.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses canonical engine tessellation and physical-vertex mapping code; each mutable geometry belongs to an independent model owner and no immutable topology/revision key permits cross-build sharing here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Registers the new BufferGeometry before attribute/tessellation work, transfers it only after full initialization and independently retires it on refusal; typed attributes remain bounded by the admitted mesh, and this producer owns no material, renderer or task.
 */
export const buildGeometry: (geometry: IAutoMovieGeometry) => THREE.BufferGeometry = (
  geometry: IAutoMovieGeometry,
): THREE.BufferGeometry => {
  return constructAutoMovieOwnedResources((own: <Resource extends { dispose(): void; }>(resource: Resource) => Resource): THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap> => {
  const geo: THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap> = own(new THREE.BufferGeometry());
  if (geometry.type === "primitive") {
    const t: ITessellation = tessellate(geometry.shape);
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(t.positions, 3),
    );
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(t.normals, 3));
    geo.setIndex(t.indices);
    return geo;
  }
  const mesh: IAutoMovieMesh = geometry.mesh;
  geo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(mesh.positions, 3),
  );
  if (mesh.normals !== null)
    geo.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(mesh.normals, 3),
    );
  // One UV set, deliberately. `three.js` reads a map's `channel` to pick
  // between `uv`, `uv1`, `uv2` and `uv3`, and the artifact admits `texCoord` 0
  // alone (`validateModel`), so a mirrored `uv1` would be a second copy of the
  // same buffer that no material could ever address.
  if (mesh.uvs !== null)
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(mesh.uvs, 2));
  if (mesh.colors !== undefined)
    geo.setAttribute("color", new THREE.Float32BufferAttribute(mesh.colors, 3));
  if (mesh.reliefWeights !== undefined)
    geo.setAttribute(
      "reliefWeight",
      new THREE.Float32BufferAttribute(mesh.reliefWeights, 1),
    );
  if (mesh.indices !== null) geo.setIndex(mesh.indices);
  if (mesh.skin !== null) {
    geo.setAttribute(
      "skinIndex",
      new THREE.Uint16BufferAttribute(mesh.skin.boneIndices, 4),
    );
    geo.setAttribute(
      "skinWeight",
      new THREE.Float32BufferAttribute(mesh.skin.weights, 4),
    );
  }
  if (mesh.normals === null) geo.computeVertexNormals();
  AutoMovieGeometryPhysicalVertices.writeOwned(geo, mesh.physicalVertices);
  AutoMovieGeometryPhysicalVertices.read(geo);
  return geo;
  });
};
