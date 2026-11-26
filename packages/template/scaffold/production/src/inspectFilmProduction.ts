import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMoviePreparePhysicalGeometry,
} from "@automovie/interface";
import {
  type IAutoMovieDrawScene,
  observeAutoMovieCollisionMotion,
  observeAutoMoviePlacedCamera,
  observeAutoMoviePlacedScene,
  observeAutoMovieSceneCollision,
} from "@automovie/render";

import type { IFilmProduction } from "./IFilmProduction";
import type { FilmVerdictPacket } from "./readFilmVerdicts";

/** Work a capture or delivery may spend: never a reason to defer a check. */
const SETTLED: Parameters<typeof observeAutoMovieSceneCollision>[0]["limits"] =
  {
    comparisons: Number.MAX_SAFE_INTEGER,
    posedVertices: Number.MAX_SAFE_INTEGER,
    surfaceTriangles: Number.MAX_SAFE_INTEGER,
    sweptCells: Number.MAX_SAFE_INTEGER,
  };

/**
 * Collision work per placed sample. Interactive playback may defer a pair it
 * cannot finish within a frame; a capture or delivery settles the same scene
 * without a work limit.
 *
 * The viewer limits give collision at most about 7.5 ms of a 60 Hz frame,
 * leaving room for motion checks and the render: 2.5 ms collecting parts, 2 ms
 * of comparisons at 2.4 µs each, and 1.5 ms each of surface triangles at 0.24
 * µs and posed vertices at up to 0.49 µs, measured with unlimited work on a
 * 1,024-member formation crossed by a growing barrier and on overlapping closed
 * meshes of growing density. A real formation, wall, bed and rope film peaks at
 * 384 comparisons, 221 posed vertices and no surface triangles. No measured
 * scene spends swept cells.
 */
const COLLISION_LIMITS: Record<
  IAutoMovieDrawScene.IPlacedSample["mode"],
  Parameters<typeof observeAutoMovieSceneCollision>[0]["limits"]
> = {
  viewer: {
    comparisons: 850,
    posedVertices: 3_000,
    surfaceTriangles: 6_300,
    sweptCells: 256,
    // Collecting a part costs about 6.4 µs (6.4 ms per 1,024 formation members),
    // which no other limit bounds; 400 parts keep collection near 2.5 ms.
    parts: 400,
  },
  capture: SETTLED,
  delivery: SETTLED,
};

/**
 * Motion work per placed sample. Interactive playback places a few extra
 * instants and defers a crossing it cannot settle; a capture or delivery
 * subdivides until every moving pair is resolved, within a depth that resolves
 * a frame into about a billion steps.
 */
const MOTION_LIMITS: Record<
  IAutoMovieDrawScene.IPlacedSample["mode"],
  Parameters<typeof observeAutoMovieCollisionMotion>[0]["limits"]
> = {
  viewer: {
    // Each extra instant costs a placement plus a collection; the work limits
    // follow the collision measurements above, at about a third of its share.
    placements: 4,
    depth: 6,
    comparisons: 300,
    posedVertices: 1_000,
    surfaceTriangles: 2_000,
    parts: 400,
  },
  capture: { ...SETTLED, placements: Number.MAX_SAFE_INTEGER, depth: 30 },
  delivery: { ...SETTLED, placements: Number.MAX_SAFE_INTEGER, depth: 30 },
};

/**
 * Collect stock review checks from the same world that will be drawn.
 *
 * The scaffold always checks the placed scene and camera and consumes the
 * existing native performance frame when offered. Without authored layers the
 * whole scene is one automatic collision layer: every drawn box, closed prop,
 * skin, formation member and cord segment is checked, and its unresolved
 * coverage is reported without blocking delivery. Authored shot layers mark
 * their own collision obligations required. When the subject places
 * synchronously, the motion since the preceding output instant is subdivided at
 * placed instants to find crossings no drawn frame shows, except across a cut
 * or declared break of the production's playback; the drawn second is placed
 * again before returning. Random seeks and sequential playback examine the same
 * span, so they report the same result.
 *
 * A capture or delivery sample also carries the film's human performance
 * verdicts when the mount supplies its reader (`readFilmVerdicts`): every
 * finding and coverage row of the whole-performance report, the same in each
 * packet of the run. The interactive viewer never calls the reader.
 *
 * @param props Film identity, production inspection sources, prepared geometry
 *   queries, the run's verdict reader and the one settled draw sample.
 * @returns One serializable packet carrying the scene, collision and authored
 *   camera observations.
 * @evidence contracts/development/common.md#meaningful-documentation States what runs by default, which source rules are optional and the placement precondition.
 * @evidence contracts/development/implementation.md#principled-implementation Runs each applicable checker on the already placed scene and its canonical delivery camera, using one borrow of any native frame. Only a producer can supply its shot, authored exclusions, contact intent or required camera subjects.
 * @evidence contracts/development/implementation.md#efficient-algorithms Resolve source metadata, call the three existing check owners and combine their emitted findings and coverage. One bounded collision observation and one native scene observation per placed frame, with a smaller interactive collision budget than capture and delivery. Camera raster work is delegated only for declared targets under its host budget. The film's whole-performance verdicts are read once per capture or delivery run by the mount's reader and only mapped into each packet, never in the interactive viewer. Borrows initialized geometry queries, placed world matrices, the film's actual physical frame, the run's one verdict packet and the same delivery projection. Returns diagnostic values only. No scene, frame or renderer is held after the call.
 */
export function inspectFilmProduction(props: {
  name: string;
  production: IFilmProduction;
  geometry: Pick<IAutoMoviePreparePhysicalGeometry.IQueries, "contact">;
  /**
   * Output frame rate, which locates the preceding output instant; motion
   * between frames is not examined without it.
   */
  fps?: number;
  /**
   * The run's verdict reader from `readFilmVerdicts`; asked only in a capture
   * or delivery sample.
   */
  verdicts?: () => FilmVerdictPacket;
  sample: IAutoMovieDrawScene.IPlacedSample;
}): IAutoMovieInspectionDiagnostics {
  const { name, production, geometry, sample } = props;
  const layersAt = (
    seconds: number,
  ): Parameters<typeof observeAutoMovieSceneCollision>[0]["layers"] =>
    (
      production.inspectionLayers?.({
        ...sample,
        time: { filmSeconds: seconds },
      }) ?? [{ id: name, root: sample.scene, localSeconds: seconds }]
    ).map((layer) =>
      sample.place === undefined ||
      props.fps === undefined ||
      layer.sweeps !== undefined
        ? layer
        : { ...layer, sweeps: [] },
    );
  const authored: IAutoMovieInspectionDiagnostics | undefined =
    production.inspectPlaced?.(sample);
  const layers: Parameters<typeof observeAutoMovieSceneCollision>[0]["layers"] =
    layersAt(sample.time.filmSeconds);
  const native: Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage"> =
    observeAutoMoviePlacedScene({
      scene: sample.scene,
      camera: sample.camera,
      time: sample.time,
      physicalFrame: production.performance?.frame(),
      checks: production.inspectionChecks?.(sample),
    });
  const collision: Pick<
    IAutoMovieInspectionDiagnostics,
    "findings" | "coverage"
  > = observeAutoMovieSceneCollision({
    time: sample.time,
    layers,
    geometry,
    // Region bounds gave the same findings and coverage as group bounds and
    // were faster on sparse and 2,048 and 8,192 member formation scenes.
    refinement: "region",
    limits: COLLISION_LIMITS[sample.mode],
  });
  const motion: Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage"> =
    observeMotion(props, layersAt);
  const targets: Parameters<typeof observeAutoMoviePlacedCamera>[0]["targets"] =
    production.inspectionCamera?.(sample) ?? [];
  const camera: Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage"> =
    observeAutoMoviePlacedCamera({ sample, targets });
  const human: FilmVerdictPacket =
    sample.mode === "viewer" || props.verdicts === undefined
      ? { findings: [], coverage: [] }
      : props.verdicts();
  const shot: IAutoMovieInspectionDiagnostics.IShotTime | undefined =
    layers.length === 1 && layers[0]!.shotPath !== undefined
      ? { path: layers[0]!.shotPath, seconds: layers[0]!.localSeconds }
      : undefined;
  return {
    scope:
      authored?.scope ??
      JSON.stringify([
        name,
        ...layers.map((layer: (typeof layers)[number]): string => layer.id),
      ]),
    time: authored?.time ?? {
      ...sample.time,
      ...(shot === undefined ? {} : { shot }),
    },
    findings: [
      ...native.findings,
      ...collision.findings,
      ...motion.findings,
      ...camera.findings,
      ...human.findings,
      ...(authored?.findings ?? []),
    ],
    coverage: [
      ...native.coverage,
      ...collision.coverage,
      ...motion.coverage,
      ...camera.coverage,
      ...human.coverage,
      ...(authored?.coverage ?? []),
    ],
  };
}

/**
 * Subdivide the motion since the preceding output instant when the subject
 * places synchronously; otherwise disclose that motion between frames stays
 * unverified. A cut or declared break in the production's playback between the
 * two instants has no physical path to examine.
 */
function observeMotion(
  props: Parameters<typeof inspectFilmProduction>[0],
  layersAt: (
    seconds: number,
  ) => Parameters<typeof observeAutoMovieSceneCollision>[0]["layers"],
): Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage"> {
  const { production, geometry, sample, fps } = props;
  if (sample.place === undefined || fps === undefined || !(fps > 0))
    return { findings: [], coverage: [] };
  const seconds: number = sample.time.filmSeconds;
  // The output index at or after this second, from the delivery schedule when
  // known; otherwise rounded up past binary rounding of seconds * fps.
  const index: number =
    sample.time.outputFrame ?? Math.ceil(seconds * fps - 2 ** -20);
  const from: number = (index - 1) / fps;
  const playback: IFilmProduction["playback"] = production.playback;
  const relation: string =
    playback === undefined || !(from >= 0)
      ? "continuous"
      : AutoMovieEngineFilm.classifyAutoMoviePlaybackBoundary({
          sequence: playback.sequence,
          timeline: playback.timeline,
          before: from,
          after: seconds,
          ...(playback.discontinuities === undefined
            ? {}
            : { discontinuities: playback.discontinuities }),
        }).boundary;
  return observeAutoMovieCollisionMotion({
    time: sample.time,
    fromSeconds: Math.max(0, from),
    continuous: relation !== "cut" && relation !== "discontinuity",
    place: sample.place,
    layers: layersAt,
    geometry,
    limits: MOTION_LIMITS[sample.mode],
  });
}
