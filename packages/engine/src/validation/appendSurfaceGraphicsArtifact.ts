import type {
  IAutoMovieAffordance,
  IAutoMovieModel,
  IAutoMovieSceneNode,
  IAutoMovieSurfaceGraphicTrack,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { appendSurfaceGraphicArtifact } from "./appendSurfaceGraphicArtifact";

/**
 * Check shot-local surface graphic tracks, appending findings under
 * `$input.surfaceGraphics`.
 *
 * Structurally, every track names a staged node and a surface id, no node and
 * surface pair repeats, its keys open at zero and strictly increase inside [0,
 * duration), and every graphic is in range. When the model registry is
 * supplied, each surface must also be a `surface` affordance of the node's
 * registered model with positive finite `width` and `depth`, and must not ride
 * an articulation, because a graphic is parented to the prop's built object and
 * would not follow the articulated part. An omitted registry is the structural
 * shot artifact boundary. When `fonts` is supplied, every text layer must name
 * one of its ids; when `cameras` is supplied, every feed layer must name one of
 * its ids other than the shot's own camera.
 */
export function appendSurfaceGraphicsArtifact(
  tracks: readonly IAutoMovieSurfaceGraphicTrack[] | undefined,
  sceneNodes: readonly Pick<IAutoMovieSceneNode, "id" | "model">[],
  duration: number,
  collector: IAutoMovieViolationCollector,
  models?: readonly IAutoMovieModel[],
  fonts?: ReadonlySet<string>,
  cameras?: {
    /** Ids of the scene's cameras. */
    ids: ReadonlySet<string>;

    /** The shot's own camera, when known. */
    shot?: string;
  },
): void {
  const root: string = "$input.surfaceGraphics";
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
    (track: IAutoMovieSurfaceGraphicTrack, index: number): void => {
      const path: string = `${root}[${index}]`;
      const modelId: string | undefined = nodes.get(track.node);
      if (modelId === undefined)
        collector.push(
          "type",
          `${path}.node`,
          "must name a staged prop node",
          track.node,
        );
      const pair: string = JSON.stringify([track.node, track.surface]);
      if (targets.has(pair))
        collector.push(
          "type",
          `${path}.surface`,
          "one surface graphic track per node and surface",
          track.surface,
        );
      targets.add(pair);
      if (modelId !== undefined && registry !== undefined)
        appendSurface(
          registry.get(modelId),
          modelId,
          track.surface,
          `${path}.surface`,
          collector,
        );

      const keysPath: string = `${path}.keys`;
      if (track.keys.length === 0)
        collector.push(
          "type",
          keysPath,
          "must start with a key at shot time zero",
          track.keys.length,
        );
      let previous: number = -Infinity;
      track.keys.forEach(
        (
          key: IAutoMovieSurfaceGraphicTrack["keys"][number],
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
            collector.push(
              "range",
              `${keyPath}.time`,
              "first time must be zero and times must strictly increase within [0, duration)",
              time,
            );
          else previous = time;
          appendSurfaceGraphicArtifact(
            key.graphic,
            `${keyPath}.graphic`,
            collector,
            {
              fonts,
              ...(cameras === undefined
                ? {}
                : {
                    cameras: cameras.ids,
                    ...(cameras.shot === undefined
                      ? {}
                      : { camera: cameras.shot }),
                  }),
            },
          );
        },
      );
    },
  );
}
/**
 * Resolve a track's surface on its node's registered model: an unregistered
 * model, an id that is not a `surface` affordance, a surface without positive
 * finite `width` and `depth`, and a surface that rides an articulation each
 * raise their own finding.
 */
function appendSurface(
  model: IAutoMovieModel | undefined,
  modelId: string,
  surface: string,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  if (model === undefined) {
    collector.push(
      "type",
      path,
      `node's model "${modelId}" must be registered for the shot`,
      modelId,
    );
    return;
  }
  const affordance: IAutoMovieAffordance | undefined = (
    model.affordances ?? []
  ).find((entry: IAutoMovieAffordance): boolean => entry.id === surface);
  if (affordance?.kind !== "surface") {
    collector.push(
      "type",
      path,
      `must name a "surface" affordance of model "${modelId}"`,
      surface,
    );
    return;
  }
  for (const extent of ["width", "depth"] as const)
    collector.positive(
      `${path}.${extent}`,
      affordance[extent],
      `surface "${surface}" ${extent} (m)`,
    );
  if (affordance.rides !== undefined)
    collector.push(
      "type",
      path,
      `surface "${surface}" rides articulation "${affordance.rides}", and a graphic cannot follow an articulated surface`,
      affordance.rides,
    );
}
