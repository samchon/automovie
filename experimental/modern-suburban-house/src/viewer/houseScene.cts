/**
 * House scene for the live viewer: the spaces producer turned into the
 * transient wire payload.
 *
 * Responsibility: on every request build the house, turn it into its
 * built-environment record (`buildHouseEnvironment`) and draw what
 * `lowerBuiltEnvironment` stages from that record: each set piece's model mesh
 * at its world transform, with the emitting part's role, owner and bound finish.
 * The viewer therefore shows exactly the handoff the spaces source gives the
 * renderer (`04-observations.md#engine-render-handoff`). The camera follows
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
import { lowerBuiltEnvironment, tessellateToMesh, transformAutoMovieMesh } from "@automovie/engine";

import { buildHouseEnvironment } from "../spaces/environment";
import { buildHouse } from "../spaces/house";
import { deriveHouseObservations } from "../spaces/observations";
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
  const house = buildHouse();
  const environment = buildHouseEnvironment(house);
  const lowered = lowerBuiltEnvironment(environment);
  const parts = new Map(house.parts.map((p) => [p.id, p]));
  const models = new Map((lowered.models ?? []).map((m) => [m.id, m]));
  for (const piece of lowered.set ?? []) {
    const part = parts.get(piece.model);
    const model = models.get(piece.model);
    if (part === undefined || model === undefined || model.parts.length === 0)
      throw new Error(`set piece ${piece.node} has no emitted part or model`);
    for (const member of model.parts) {
      const sourceMesh = member.geometry.type === "mesh"
        ? member.geometry.mesh
        : tessellateToMesh(member.geometry.shape);
      const localMesh = member.transform === null
        ? sourceMesh
        : transformAutoMovieMesh(sourceMesh, member.transform);
      const mesh = transformAutoMovieMesh(localMesh, {
        translation: piece.position,
        rotation: piece.rotation,
        scale: typeof piece.scale === "number"
          ? { x: piece.scale, y: piece.scale, z: piece.scale }
          : piece.scale,
      });
      if (mesh.normals === null || mesh.indices === null)
        throw new Error(`house part ${part.id}/${member.id} (${part.owner}) lacks normals or indices`);
      items.push({
        id: model.parts.length === 1 ? part.id : `${part.id}/${member.id}`,
        role: part.role,
        owner: part.owner,
        color: part.color,
        position: [0, 0, 0],
        positions: mesh.positions,
        normals: mesh.normals,
        indices: mesh.indices,
        castShadow: true,
        receiveShadow: true,
      });
    }
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
    observations: deriveHouseObservations(environment, house).observations.flatMap((o) =>
      o.pose === null
        ? []
        : [{ id: o.id, position: [o.pose.position.x, o.pose.position.y, o.pose.position.z], target: [o.pose.target.x, o.pose.target.y, o.pose.target.z] }],
    ),
  };
}
