import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMoviePreparePhysicalGeometry,
} from "@automovie/interface";
import {
  type IAutoMovieDrawScene,
  observeAutoMoviePlacedCamera,
  observeAutoMoviePlacedScene,
  observeAutoMovieSceneCollision,
} from "@automovie/render";

import type { IFilmProduction } from "./IFilmProduction";

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
 */
const COLLISION_LIMITS: Record<
  IAutoMovieDrawScene.IPlacedSample["mode"],
  Parameters<typeof observeAutoMovieSceneCollision>[0]["limits"]
> = {
  viewer: {
    comparisons: 12_000,
    posedVertices: 16_384,
    surfaceTriangles: 400_000,
    sweptCells: 256,
  },
  capture: SETTLED,
  delivery: SETTLED,
};

/**
 * Collect stock review checks from the same world that will be drawn.
 *
 * The scaffold always checks the placed scene and camera and consumes the
 * existing native performance frame when offered. Without authored layers the
 * whole scene is one automatic collision layer: every drawn box, closed prop,
 * skin, formation member and cord segment is checked, and its unresolved
 * coverage is reported without blocking delivery. Authored shot layers mark
 * their own collision obligations required. Review hosts never seek from here.
 *
 * @param props Film identity, production inspection sources, prepared geometry queries and the one settled draw sample.
 * @returns One serializable packet carrying the scene, collision and authored camera observations.
 * @evidence contracts/development/common.md#meaningful-documentation States what runs by default, which source rules are optional and the placement precondition.
 * @evidence contracts/development/implementation.md#principled-implementation Runs each applicable checker on the already placed scene and its canonical delivery camera, using one borrow of any native frame.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve source metadata, call the three existing check owners and combine their emitted findings and coverage.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only a producer can supply its shot, authored exclusions, contact intent or required camera subjects.
 * @evidence contracts/development/implementation.md#efficient-algorithms One bounded collision observation and one native scene observation per placed frame, with a smaller interactive collision budget than capture and delivery. Camera raster work is delegated only for declared targets under its host budget.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows initialized geometry queries, placed world matrices, the film's actual physical frame and the same delivery projection.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns diagnostic values only. No scene, frame or renderer is held after the call.
 */
export function inspectFilmProduction(props: {
  name: string;
  production: IFilmProduction;
  geometry: Pick<IAutoMoviePreparePhysicalGeometry.IQueries, "contact">;
  sample: IAutoMovieDrawScene.IPlacedSample;
}): IAutoMovieInspectionDiagnostics {
  const { name, production, geometry, sample } = props;
  const authored: IAutoMovieInspectionDiagnostics | undefined =
    production.inspectPlaced?.(sample);
  const layers: Parameters<typeof observeAutoMovieSceneCollision>[0]["layers"] =
    production.inspectionLayers?.(sample) ?? [
      { id: name, root: sample.scene, localSeconds: sample.time.filmSeconds },
    ];
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
    limits: COLLISION_LIMITS[sample.mode],
  });
  const targets: Parameters<typeof observeAutoMoviePlacedCamera>[0]["targets"] =
    production.inspectionCamera?.(sample) ?? [];
  const camera: Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage"> =
    observeAutoMoviePlacedCamera({ sample, targets });
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
      ...camera.findings,
      ...(authored?.findings ?? []),
    ],
    coverage: [
      ...native.coverage,
      ...collision.coverage,
      ...camera.coverage,
      ...(authored?.coverage ?? []),
    ],
  };
}
