import { tessellate } from "@automovie/engine";
import { IAutoMovieGeometry } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieGeometryPhysicalVertices } from "./AutoMovieGeometryPhysicalVertices";

/**
 * Build a `three.js` geometry from a automovie geometry node: tessellating a
 * parametric primitive (via the engine) or uploading raw mesh arrays.
 *
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Lowers compiled geometry into a viewer-owned runtime buffer object.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Implements the runtime ownership side of isolated scene lowering.
 * @author Samchon
 */
export const buildGeometry = (
  geometry: IAutoMovieGeometry,
): THREE.BufferGeometry => {
  const geo = new THREE.BufferGeometry();
  if (geometry.type === "primitive") {
    const t = tessellate(geometry.shape);
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(t.positions, 3),
    );
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(t.normals, 3));
    geo.setIndex(t.indices);
    return geo;
  }
  const mesh = geometry.mesh;
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
};
