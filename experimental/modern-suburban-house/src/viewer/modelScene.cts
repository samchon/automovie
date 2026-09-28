/**
 * Lower reviewed model prototypes and their placements into the same viewer
 * payload as the house. This accepts source results; it authors no prototype.
 * Each part has one explicit surface id and retains its model-owned metric UVs.
 */
import {
  type IAutoMovieMeshTransform,
  tessellateToMesh,
  transformAutoMovieMesh,
} from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

import type { IViewerSceneItem } from "./scenePayload";

export interface IViewerModelInputs {
  prototypes: readonly {
    model: IAutoMovieModel;
    faceByPart: Readonly<Record<string, string>>;
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
        texture?: string;
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
  for (const instance of input.instances) {
    const prototype = prototypes.get(instance.modelId);
    if (prototype === undefined)
      throw new Error(`unknown model ${instance.modelId}`);
    for (const part of prototype.model.parts) {
      const faceId = prototype.faceByPart[part.id];
      if (faceId === undefined)
        throw new Error(`unbound model face ${prototype.model.id}/${part.id}`);
      const finish = input.finishes[faceId];
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
      const mesh = transformAutoMovieMesh(local, instance.transform);
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
      items.push({
        id: `${instance.id}/${part.id}`,
        role: "model",
        modelId: prototype.model.id,
        faceId,
        color: finish.color,
        roughness: finish.roughness,
        metalness: finish.metalness,
        texture: finish.texture,
        uvs: mesh.uvs ?? undefined,
        position: [0, 0, 0],
        positions: mesh.positions,
        normals: mesh.normals,
        indices: mesh.indices,
        castShadow: true,
        receiveShadow: true,
      });
    }
  }
  return items;
}
