import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMovieInspectionRequest,
  IAutoMovieInspectionTrail,
  IAutoMoviePlaybackEntry,
} from "@automovie/interface";

import { planInspectionTrailTimes } from "../../scene/inspection/internal/planInspectionTrailTimes";
import { sampleInspectionTrails } from "../../scene/inspection/internal/sampleInspectionTrails";
import type { IAutoMovieRenderDrawScene } from "../IAutoMovieRenderDrawScene";
import { placeDrawLayer } from "./placeDrawLayer";
import { planDrawPicture } from "./planDrawPicture";
import { readMotionTrailSample } from "./readMotionTrailSample";

const MAXIMUM_PATTERNS: number = 16;

/* Share the displayed entry at each grid time across the requested paths. */
export async function sampleDrawTrails(
  name: string,
  scene: IAutoMovieRenderDrawScene<never>,
  request: IAutoMovieInspectionRequest,
  seconds: number,
  current?: () => boolean,
): Promise<IAutoMovieInspectionTrail[]> {
  if (request.trail.length === 0 || current?.() === false) return [];
  if (request.trail.length > MAXIMUM_PATTERNS)
    throw new Error(
      "A trail can request at most " + MAXIMUM_PATTERNS + " path patterns",
    );
  const times: number[] = planInspectionTrailTimes({
    request,
    seconds,
    durationSeconds: scene.durationSeconds,
  });
  const producer = scene.inspectMotionTrail;
  const {
    cut,
    sequence,
    trailDiscontinuities,
  }: IAutoMovieRenderDrawScene<never> = scene;
  const interrupted =
    cut === undefined ||
    sequence === undefined ||
    trailDiscontinuities === undefined ||
    trailDiscontinuities.length === 0
      ? undefined
      : (before: number, after: number): boolean => {
          const relation =
            AutoMovieEngineFilm.classifyAutoMoviePlaybackBoundary({
              sequence,
              timeline: cut,
              before,
              after,
              discontinuities: trailDiscontinuities,
            }).boundary;
          return relation === "discontinuity" || relation === "cut";
        };
  const routes =
    producer === undefined
      ? undefined
      : new WeakMap<IAutoMovieInspectionTrail.IAuthoredRoute, boolean>();
  let time: IAutoMovieInspectionDiagnostics.ITime;
  let entryIndex: number | null = null;
  const seek = async (at: number): Promise<number | null> => {
    const plan = planDrawPicture(name, scene, at);
    await placeDrawLayer(name, scene, plan.placed, at);
    entryIndex = plan.placed?.entry ?? null;
    if (producer !== undefined) {
      const entry: IAutoMoviePlaybackEntry | undefined =
        entryIndex === null ? undefined : scene.cut?.entries[entryIndex];
      const index: number = Math.round(at * scene.fps);
      time = {
        filmSeconds: at,
        ...(Number.isSafeInteger(index) &&
        index >= 0 &&
        index / scene.fps === at &&
        at < scene.durationSeconds
          ? { outputFrame: index }
          : {}),
        ...(entry === undefined
          ? {}
          : {
              shot: {
                path: entry.shot,
                seconds: AutoMovieEngineFilm.playbackEntryTime(entry, at),
              },
            }),
      };
      const aspect: number = scene.width / scene.height;
      if (scene.camera.aspect !== aspect) {
        scene.camera.aspect = aspect;
        scene.camera.updateProjectionMatrix();
      }
      scene.camera.updateWorldMatrix(true, false);
    }
    return entryIndex;
  };
  await seek(seconds);
  if (current?.() === false) return [];
  return sampleInspectionTrails({
    scene: scene.scene,
    patterns: request.trail,
    times,
    seek,
    ...(interrupted === undefined ? {} : { interrupted }),
    ...(producer === undefined || routes === undefined
      ? {}
      : {
          inspect: (path, object, origin) => {
            const query = { time, entry: entryIndex, path, object };
            return readMotionTrailSample(
              scene,
              query,
              origin,
              producer.read(query),
              routes,
            );
          },
        }),
    ...(current === undefined ? {} : { current }),
  });
}
