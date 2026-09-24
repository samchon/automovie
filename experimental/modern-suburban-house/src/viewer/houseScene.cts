/**
 * House scene for the live viewer: the spaces producer turned into the
 * transient wire payload.
 *
 * Responsibility: call `buildHouse()` (the single spaces producer) on every
 * request and copy each part's engine mesh into an `IViewerSceneItem`, so the
 * viewer shows exactly what the source owners emit. The camera follows
 * settings `frame-condition` for the default exterior view: slightly right of
 * the front, eye height 1.6 m, vertical FOV 45°, raster 1536 × 1024 at pixel
 * ratio 1, at a distance that keeps the house, porch, driveway and site paving
 * in frame. Lighting follows settings `lighting-state`: one key from the
 * front-left above plus a hemisphere fill at fixed exposure.
 *
 * The only item not emitted by `src/spaces` is `viewer-reference-ground`, a
 * neutral inspection plane just under the paving (Y = -0.46 m). Terrain is a
 * maps input that is not authored (maps disabled); this plane is viewer
 * context so shadows and contact read, and it is not a spaces or maps result.
 */
import { tessellateToMesh, transformAutoMovieMesh } from "@automovie/engine";

import { buildHouse } from "../spaces/house";
import type { IViewerScene, IViewerSceneItem } from "./scenePayload";

/** Neutral reference ground, viewer-owned. */
const referenceGround = (): IViewerSceneItem => {
  const mesh = transformAutoMovieMesh(tessellateToMesh({ type: "box", width: 40, height: 0.02, depth: 44 }), {
    translation: { x: 3, y: -0.47, z: -5 },
  });
  if (mesh.normals === null || mesh.indices === null) throw new Error("reference ground mesh lacks normals or indices");
  return {
    id: "viewer-reference-ground",
    role: "reference",
    color: 0x9aa08f,
    position: [0, 0, 0],
    positions: mesh.positions,
    normals: mesh.normals,
    indices: mesh.indices,
    castShadow: false,
    receiveShadow: true,
  };
};

/** Build the house scene for one request. */
export function buildHouseScene(sourceDigest: string): IViewerScene {
  const items: IViewerSceneItem[] = [referenceGround()];
  for (const part of buildHouse()) {
    if (part.mesh.normals === null || part.mesh.indices === null)
      throw new Error(`house part ${part.id} (${part.owner}) lacks normals or indices`);
    items.push({
      id: part.id,
      role: part.role,
      owner: part.owner,
      color: part.color,
      position: [0, 0, 0],
      positions: part.mesh.positions,
      normals: part.mesh.normals,
      indices: part.mesh.indices,
      castShadow: true,
      receiveShadow: true,
    });
  }
  return {
    subject: "house",
    inspection: false,
    sourceDigest,
    raster: { width: 1536, height: 1024, pixelRatio: 1 },
    camera: { position: [10, 1.6, 20], target: [2.5, 3.2, -4], fovDeg: 45, near: 0.1, far: 300 },
    lighting: {
      keyFrom: [-4, 6, 5],
      keyTarget: [3, 0, -5],
      keyIntensity: 3,
      skyColor: 0xdfe8f2,
      groundColor: 0x8a7f6e,
      fillIntensity: 0.9,
      exposure: 1,
      shadowHalfExtent: 24,
    },
    items,
  };
}
