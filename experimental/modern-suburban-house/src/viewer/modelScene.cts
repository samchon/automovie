/**
 * Lower reviewed model prototypes and their placements into the same viewer
 * payload as the house. This accepts source results; it authors no prototype.
 * Each part has one explicit surface id and retains its model-owned metric UVs.
 */
import {
  type IAutoMovieMeshTransform,
  Matrix4,
  resolveFrame,
  tessellateToMesh,
  transformAutoMovieMesh,
} from "@automovie/engine";
import type {
  IAutoMovieModel,
  IAutoMoviePropArticulation,
} from "@automovie/interface";

import type { IViewerSceneItem } from "./scenePayload";

export interface IViewerModelInputs {
  /** House draw batches default on; isolated inspection retains every source part. */
  batchRepetitions?: boolean;
  prototypes: readonly {
    model: IAutoMovieModel;
    faceByPart: Readonly<Record<string, string>>;
    articulation?: IAutoMoviePropArticulation;
    reviewYaw?: number;
    memberByPart?: Readonly<Record<string, string>>;
  }[];
  instances: readonly {
    id: string;
    modelId: string;
    transform: IAutoMovieMeshTransform;
  }[];
  finishes: Readonly<
    Record<
      string,
      {
        color: number;
        roughness: number;
        metalness: number;
        transmission?: number;
        ior?: number;
        thickness?: number;
        doubleSided?: boolean;
        texture?: string;
        textureMetres?: readonly [number, number];
      }
    >
  >;
}

/** @publicUnconsumed modelSources and instanceSources: the viewer needs this input before those branches open. */
export function lowerViewerModels(
  input: IViewerModelInputs,
): IViewerSceneItem[] {
  const prototypes = new Map(
    input.prototypes.map((entry) => [entry.model.id, entry]),
  );
  const items: IViewerSceneItem[] = [];
  const batches = new Map<string, IViewerSceneItem>();
  for (const instance of input.instances) {
    const prototype = prototypes.get(instance.modelId);
    if (prototype === undefined)
      throw new Error(`unknown model ${instance.modelId}`);
    const articulation = prototype.articulation;
    const jointFrames = new Map<string, IAutoMovieMeshTransform>();
    if (articulation !== undefined) {
      const posed = resolveFrame({
        nodes: articulation.nodes,
        clip: null,
        limits: [],
        profiles: [
          { profile: articulation.profile, binding: articulation.binding },
        ],
        seconds: 0,
      });
      for (const node of articulation.nodes) {
        if (node.mesh === null) continue;
        const frame = posed.world.get(node.id)!;
        const { position, rotation, scale } = Matrix4.decompose(frame);
        jointFrames.set(node.mesh, { translation: position, rotation, scale });
      }
    }
    for (const part of prototype.model.parts) {
      const faceId = prototype.faceByPart[part.id];
      if (faceId === undefined)
        throw new Error(`unbound model face ${prototype.model.id}/${part.id}`);
      const finish =
        input.finishes[`${prototype.model.id}/${faceId}`] ??
        input.finishes[faceId];
      if (finish === undefined) throw new Error(`missing finish for ${faceId}`);
      const scale = instance.transform.scale;
      if (
        scale !== undefined &&
        (scale.x !== 1 || scale.y !== 1 || scale.z !== 1)
      )
        throw new Error(
          `model instance must keep metric UV scale: ${instance.id}`,
        );
      const source =
        part.geometry.type === "mesh"
          ? part.geometry.mesh
          : tessellateToMesh(part.geometry.shape);
      const local =
        part.transform === null
          ? source
          : transformAutoMovieMesh(source, part.transform);
      const joint = jointFrames.get(part.id);
      const posed =
        joint === undefined ? local : transformAutoMovieMesh(local, joint);
      const mesh = transformAutoMovieMesh(posed, instance.transform);
      if (mesh.normals === null || mesh.indices === null)
        throw new Error(
          `model mesh lacks normals or indices: ${prototype.model.id}/${part.id}`,
        );
      if (
        mesh.uvs === null ||
        mesh.uvs.length !== (mesh.positions.length / 3) * 2
      )
        throw new Error(
          `model face lacks aligned UVs: ${prototype.model.id}/${part.id}`,
        );
      const tile = finish.textureMetres;
      if (
        tile !== undefined &&
        (!tile.every((v) => Number.isFinite(v) && v > 0) ||
          finish.texture === undefined)
      )
        throw new Error(
          `invalid texture module for ${prototype.model.id}/${part.id}`,
        );
      const uvs =
        tile === undefined
          ? mesh.uvs
          : mesh.uvs.map((value, index) => value / tile[index % 2]!);
      const item: IViewerSceneItem = {
        id: `${instance.id}/${part.id}`,
        role: "model",
        modelId: prototype.model.id,
        faceId,
        assemblyMember: prototype.memberByPart?.[part.id],
        color: finish.color,
        roughness: finish.roughness,
        metalness: finish.metalness,
        transmission: finish.transmission,
        ior: finish.ior,
        thickness: finish.thickness,
        doubleSided: finish.doubleSided,
        texture: finish.texture,
        uvs,
        position: [0, 0, 0],
        positions: mesh.positions,
        normals: mesh.normals,
        indices: mesh.indices,
        castShadow: (finish.transmission ?? 0) === 0,
        receiveShadow: true,
      };
      // Repeated roof courses and siding retain source part identities in the
      // instance record. One draw mesh per material face keeps the live view
      // responsive without changing their model-owned positions or metric UVs.
      if (
        input.batchRepetitions !== false &&
        /-siding-|shingle-/.test(prototype.model.id)
      ) {
        const key = JSON.stringify([
          faceId,
          item.color,
          item.roughness,
          item.metalness,
          item.texture,
          item.transmission,
          item.doubleSided,
        ]);
        let batch = batches.get(key);
        if (batch === undefined) {
          batch = {
            ...item,
            id: `repeat:${batches.size}:${faceId}`,
            modelId: undefined,
            positions: [],
            normals: [],
            uvs: [],
            indices: [],
          };
          batches.set(key, batch);
          items.push(batch);
        }
        const offset = batch.positions.length / 3;
        batch.positions.push(...item.positions);
        batch.normals.push(...item.normals);
        batch.uvs!.push(...item.uvs!);
        batch.indices.push(...item.indices.map((index) => index + offset));
      } else items.push(item);
    }
  }
  return items;
}
