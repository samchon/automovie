import type {
  IAutoMovieConstraintViolation,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMoviePracticalSurfaceTrack,
  IAutoMovieSceneNode,
} from "@automovie/interface";

import { pushViolation } from "./pushViolation";

/**
 * Check shot-local practical surface tracks, appending faults under
 * `$input.practicalSurfaces`. When the model registry is supplied, also resolve
 * every target to a generated rigid model part and every key to a material on
 * that model. An omitted registry is the structural shot artifact boundary.
 */
export function appendPracticalSurfacesArtifact(
  tracks: readonly IAutoMoviePracticalSurfaceTrack[] | undefined,
  sceneNodes: readonly Pick<IAutoMovieSceneNode, "id" | "model">[],
  duration: number,
  violations: IAutoMovieConstraintViolation[],
  models?: readonly IAutoMovieModel[],
): void {
  const root: string = "$input.practicalSurfaces";
  if (tracks === undefined || tracks.length === 0) return;

  const nodes: Map<string, string> = new Map(
    sceneNodes.map(
      (node: Pick<IAutoMovieSceneNode, "id" | "model">): [string, string] => [
        node.id,
        node.model,
      ],
    ),
  );
  const registry: Map<string, IAutoMovieModel> | undefined =
    models === undefined
      ? undefined
      : new Map(
          models.map((model: IAutoMovieModel): [string, IAutoMovieModel] => [
            model.id,
            model,
          ]),
        );
  const targets: Set<string> = new Set();

  tracks.forEach(
    (track: IAutoMoviePracticalSurfaceTrack, index: number): void => {
      const path: string = `${root}[${index}]`;
      const modelId: string | undefined = nodes.get(track.node);
      if (modelId === undefined)
        pushViolation(
          violations,
          "type",
          `${path}.node`,
          "must name a staged prop node",
          track.node,
        );
      const pair: string = JSON.stringify([track.node, track.part]);
      if (targets.has(pair))
        pushViolation(
          violations,
          "type",
          `${path}.part`,
          "one track per node and model part",
          track.part,
        );
      targets.add(pair);

      const model: IAutoMovieModel | undefined =
        modelId === undefined ? undefined : registry?.get(modelId);
      if (registry !== undefined && modelId !== undefined) {
        if (model?.origin !== "generated" || model.skeleton !== null)
          pushViolation(
            violations,
            "type",
            `${path}.node`,
            "must use a registered generated rigid prop model",
            modelId,
          );
        else if (
          !model.parts.some(
            (part: IAutoMovieModelPart): boolean => part.id === track.part,
          )
        )
          pushViolation(
            violations,
            "type",
            `${path}.part`,
            "must name a part of the prop model",
            track.part,
          );
      }
      const materials: Set<string> | undefined =
        model === undefined
          ? undefined
          : new Set(
              model.materials.map(
                (material: IAutoMovieMaterial): string => material.id,
              ),
            );

      const keysPath: string = `${path}.keys`;
      if (track.keys.length === 0)
        pushViolation(
          violations,
          "type",
          keysPath,
          "must start with a key at shot time zero",
          track.keys.length,
        );

      let previous: number = -Infinity;
      track.keys.forEach(
        (
          key: IAutoMoviePracticalSurfaceTrack["keys"][number],
          keyIndex: number,
        ): void => {
          const keyPath: string = `${keysPath}[${keyIndex}]`;
          const time: number = key.time;
          if (
            (keyIndex === 0 && time !== 0) ||
            time <= previous ||
            time < 0 ||
            time >= duration
          )
            pushViolation(
              violations,
              "range",
              `${keyPath}.time`,
              "first time must be zero and times must strictly increase within [0, duration)",
              time,
            );
          else previous = time;

          if (materials !== undefined && !materials.has(key.material))
            pushViolation(
              violations,
              "type",
              `${keyPath}.material`,
              "must name a material of the prop model",
              key.material,
            );
        },
      );
    },
  );
}
