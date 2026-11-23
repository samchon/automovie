import type {
  IAutoMovieAffordance,
  IAutoMovieModel,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { appendSurfaceGraphicArtifact } from "./appendSurfaceGraphicArtifact";
import { isRecord } from "./isRecord";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateNonEmptyId } from "./validateNonEmptyId";
import { validateObjectArtifact } from "./validateObjectArtifact";

/**
 * Check shot-local surface graphic tracks, appending findings under
 * `$input.surfaceGraphics`.
 *
 * Structurally, every track names a staged node and a surface id, no node and
 * surface pair repeats, its keys open at zero and strictly increase inside [0,
 * duration), and every graphic is well formed. When the model registry is
 * supplied, each surface must also be a `surface` affordance of the node's
 * registered model with positive finite `width` and `depth`, and must not ride
 * an articulation, because a graphic is parented to the prop's built object and
 * would not follow the articulated part. An omitted registry is the structural
 * shot artifact boundary. When `fonts` is supplied, every text layer must name
 * one of its ids; when `cameras` is supplied, every feed layer must name one of
 * its ids other than the shot's own camera.
 */
export function appendSurfaceGraphicsArtifact(
  tracks: unknown,
  sceneNodes: readonly unknown[],
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
  if (
    tracks === undefined ||
    !validateArrayArtifact(
      tracks,
      root,
      "surface graphic tracks",
      collector.items,
    ) ||
    tracks.length === 0
  )
    return;

  const nodes: Map<string, string> = new Map();
  for (const node of sceneNodes)
    if (
      isRecord(node) &&
      typeof node.id === "string" &&
      typeof node.model === "string"
    )
      nodes.set(node.id, node.model);
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

  for (const [index, track] of tracks.entries()) {
    const path: string = `${root}[${index}]`;
    if (
      !validateObjectArtifact(
        track,
        path,
        "surface graphic track",
        collector.items,
      )
    )
      continue;

    const before: number = collector.items.length;
    validateNonEmptyId(
      track.node,
      `${path}.node`,
      "surface graphic node",
      collector.items,
    );
    validateNonEmptyId(
      track.surface,
      `${path}.surface`,
      "surface graphic surface",
      collector.items,
    );
    const named: boolean = collector.items.length === before;
    const modelId: string | undefined = named
      ? nodes.get(track.node as string)
      : undefined;
    if (named && modelId === undefined)
      collector.push(
        "type",
        `${path}.node`,
        "must name a staged prop node",
        track.node,
      );
    if (named) {
      const pair: string = JSON.stringify([track.node, track.surface]);
      if (targets.has(pair))
        collector.push(
          "type",
          `${path}.surface`,
          "one surface graphic track per node and surface",
          track.surface,
        );
      targets.add(pair);
    }
    if (named && modelId !== undefined && registry !== undefined)
      appendSurface(
        registry.get(modelId),
        modelId,
        track.surface as string,
        `${path}.surface`,
        collector,
      );

    const keysPath: string = `${path}.keys`;
    const keys: unknown = track.keys;
    if (
      !validateArrayArtifact(
        keys,
        keysPath,
        "surface graphic keys",
        collector.items,
      )
    )
      continue;
    if (keys.length === 0)
      collector.push(
        "type",
        keysPath,
        "must start with a key at shot time zero",
        keys.length,
      );
    let previous: number = -Infinity;
    for (const [keyIndex, key] of keys.entries()) {
      const keyPath: string = `${keysPath}[${keyIndex}]`;
      if (
        !validateObjectArtifact(
          key,
          keyPath,
          "surface graphic key",
          collector.items,
        )
      )
        continue;
      const time: unknown = key.time;
      if (
        typeof time !== "number" ||
        !Number.isFinite(time) ||
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
                ...(cameras.shot === undefined ? {} : { camera: cameras.shot }),
              }),
        },
      );
    }
  }
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
