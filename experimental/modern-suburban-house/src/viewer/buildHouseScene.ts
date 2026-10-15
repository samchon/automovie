/**
 * House scene for the live viewer: the spaces producer turned into the
 * transient wire payload.
 *
 * Responsibility: on every request build the house, turn it into its
 * built-environment record (`buildHouseEnvironment`) and draw what
 * `lowerBuiltEnvironment` stages from that record: each set piece's model mesh
 * at its world transform, with the emitting part's role, owner and bound finish.
 * This spatial portion preserves the handoff the spaces source gives the
 * renderer . The camera follows
 * settings `frame-condition` for the default exterior view: slightly right of
 * the front, eye height 1.6 m, vertical FOV 45°, raster 1536 × 1024 at pixel
 * ratio 1, at a distance that keeps the house, porch, driveway and site paving
 * in frame. Lighting follows settings `lighting-state`: the deterministic HouseLighting daylight and practical-light
 * system at fixed exposure. Fixed models and fills consume their authored
 * prototypes, material bindings and world-metre instance transforms.
 *
 * Separate model inputs supply the fixed-model and fill items. The additional
 * `viewer-reference-ground` is a neutral inspection plane just under the
 * paving (Y = -0.46 m). Terrain is a
 * maps input that is not authored (maps disabled); this plane is viewer
 * context so shadows and contact read, and it is not a spaces or maps result.
 */
import { HouseLighting } from "../systems/HouseLighting";
import { WallTilePartitions } from "../materials/WallTilePartitions";
import { wallTile } from "../materials/interior/wallTile";
import { PALETTE } from "../spaces/PALETTE";
import {
  linearColorToSrgbHex,
  lowerBuiltEnvironment,
  tessellateToMesh,
  transformAutoMovieMesh,
} from "@automovie/engine";

import { buildHouseEnvironment } from "../spaces/buildHouseEnvironment";
import { buildHouse } from "../spaces/buildHouse";
import { buildObservationViews } from "./buildObservationViews.js";
import { buildBuildingInputs } from "./buildBuildingInputs.js";
import { houseWallFinishGroups } from "./houseWallFinishGroups";
import { houseTextureUvs } from "./houseTextureUvs";
import { houseFinish } from "./houseFinish";
import { lowerViewerModels } from "./lowerViewerModels.js";
import { type IViewerModelInputs } from "./IViewerModelInputs";
import type { IViewerScene, IViewerSceneItem } from "./scenePayload";
import type { IHouse } from "../spaces/IHouse";
import type { IHousePart } from "../types/IHousePart";
import type { HousePreviewFinish } from "./HousePreviewFinish";

/** Neutral reference ground, viewer-owned. */
const referenceGround: () => IViewerSceneItem = (): IViewerSceneItem => {
  const mesh: import("@automovie/interface").IAutoMovieMesh = transformAutoMovieMesh(
    tessellateToMesh({ type: "box", width: 40, height: 0.02, depth: 44 }),
    {
      translation: { x: 3, y: -0.47, z: -5 },
    },
  );
  if (mesh.normals === null || mesh.indices === null)
    throw new Error("reference ground mesh lacks normals or indices");
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
    texture: "/textures/grass.png",
    uvs: Array.from({ length: mesh.positions.length / 3 }, (_: unknown, i: number) : number[] => [
      mesh.positions[i * 3]! / 0.75,
      mesh.positions[i * 3 + 2]! / 0.75,
    ]).flat(),
  };
};

/**
 * Build a fresh world-space house payload using the current typed spaces and finish producers.
 *
 * sourceDigest is a caller-supplied basis label and is not recomputed here. modelInputs replaces only fixed-model/fill inputs; the house, reference ground, lighting and observation poses are still rebuilt. Every lowered set piece must resolve to an emitted house part and model with normals and indices. Geometry, partitioning and finish failures propagate without a partial payload.
 *
 * Work includes house construction and lowering, per-part transforms, wet/chimney partitions, finish grouping and UV generation, followed by lowerViewerModels and observation derivation. The returned arrays are consumer-owned, with some attribute arrays shared between finish groups from one mesh. Calls retain no cache, browser or GPU resource. Actual native-browser presentation and complete model/material realization remain unverified.
 */
export function buildHouseScene(
  sourceDigest: string,
  modelInputs?: IViewerModelInputs,
): IViewerScene {
  const items: IViewerSceneItem[] = [referenceGround()];
  const house: IHouse = buildHouse();
  const environment: import("@automovie/interface").IAutoMovieBuiltEnvironment & { pendingMapGround: { parts: string[]; zones: string[]; }; } = buildHouseEnvironment(house);
  const lowered: ReturnType<typeof lowerBuiltEnvironment> = lowerBuiltEnvironment(environment);
  const parts: Map<string, IHousePart> = new Map(house.parts.map((p: IHousePart) : [string, IHousePart] => [p.id, p]));
  const models: Map<string, import("@automovie/interface").IAutoMovieModel> = new Map((lowered.models ?? []).map((m: import("@automovie/interface").IAutoMovieModel) : [string, import("@automovie/interface").IAutoMovieModel] => [m.id, m]));
  for (const piece of lowered.set ?? []) {
    const part: IHousePart | undefined = parts.get(piece.model);
    const model: import("@automovie/interface").IAutoMovieModel | undefined = models.get(piece.model);
    if (part === undefined || model === undefined || model.parts.length === 0)
      throw new Error(`set piece ${piece.node} has no emitted part or model`);
    for (const member of model.parts) {
      const sourceMesh: import("@automovie/interface").IAutoMovieMesh =
        member.geometry.type === "mesh"
          ? member.geometry.mesh
          : tessellateToMesh(member.geometry.shape);
      const localMesh: import("@automovie/interface").IAutoMovieMesh =
        member.transform === null
          ? sourceMesh
          : transformAutoMovieMesh(sourceMesh, member.transform);
      const mesh: import("@automovie/interface").IAutoMovieMesh = transformAutoMovieMesh(localMesh, {
        translation: piece.position,
        rotation: piece.rotation,
        scale:
          typeof piece.scale === "number"
            ? { x: piece.scale, y: piece.scale, z: piece.scale }
            : piece.scale,
      });
      if (mesh.normals === null || mesh.indices === null)
        throw new Error(
          `house part ${part.id}/${member.id} (${part.owner}) lacks normals or indices`,
        );
      const partitioned: { paint: import("@automovie/interface").IAutoMovieMesh; tile: import("@automovie/interface").IAutoMovieMesh | null; }=new WallTilePartitions().build(part,mesh);
      const chimney: { masonry: import("@automovie/interface").IAutoMovieMesh; paint: import("@automovie/interface").IAutoMovieMesh | null; }=new WallTilePartitions().chimney(part,partitioned.paint);
      const pieces: { mesh: import("@automovie/interface").IAutoMovieMesh; suffix: string; wet: boolean; paint: boolean; }[]=[{mesh:chimney.masonry,suffix:"",wet:false,paint:false},...(partitioned.tile?[{mesh:partitioned.tile,suffix:"/wet-tile",wet:true,paint:false}]:[]),...(chimney.paint?[{mesh:chimney.paint,suffix:"/interior-paint",wet:false,paint:true}]:[])];
      for(const piece of pieces){
      for (const group of piece.paint?[{suffix:"",indices:piece.mesh.indices!,finish:houseFinish("wall",PALETTE.interiorWall)}]:piece.wet?[{
        suffix:"",indices:piece.mesh.indices!,finish:{id:wallTile.material.id,color:Number.parseInt(linearColorToSrgbHex(wallTile.material.baseColor).slice(1),16),roughness:wallTile.material.roughness,metalness:wallTile.material.metallic,texture:wallTile.texture},
      }]:houseWallFinishGroups(part,piece.mesh.normals!,piece.mesh.indices!)) {
        const finish: HousePreviewFinish = group.finish;
        items.push({
          id: `${model.parts.length === 1 ? part.id : `${part.id}/${member.id}`}${piece.suffix}${group.suffix}`,
          role: part.role,
          owner: part.owner,
          color: finish.color,
          roughness: finish.roughness,
          metalness: finish.metalness,
          texture:
            finish.texture === undefined
              ? undefined
              : `/textures/${finish.texture.file}`,
          uvs: houseTextureUvs(piece.mesh.positions, piece.mesh.normals!, finish, part.id),
          position: [0, 0, 0],
          positions: piece.mesh.positions,
          normals: piece.mesh.normals!,
          indices: group.indices,
          castShadow: true,
          receiveShadow: true,
        });
      }
      }
    }
  }
  items.push(
    ...lowerViewerModels(modelInputs ?? buildBuildingInputs(environment, house)),
  );
  return {
    subject: "house",
    physicalLighting:new HouseLighting().build(),
    inspection: false,
    sourceDigest,
    raster: { width: 1536, height: 1024, pixelRatio: 1 },
    camera: {
      position: [10, 1.6, 20],
      target: [2.5, 3.2, -4],
      fovDeg: 45,
      near: 0.1,
      far: 300,
    },
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
    observations: buildObservationViews(environment,house),
  };
}
