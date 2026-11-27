import type {
  IAutoMovieCamera,
  IAutoMovieCameraClearanceReport,
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieFontSource,
  IAutoMovieLight,
  IAutoMovieScene,
  IAutoMovieShot,
  IAutoMovieShotCoverage,
  IAutoMovieShotPerformance,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
} from "@automovie/interface";

import { AutoMovieEngineTypography } from "../../typography/AutoMovieEngineTypography";
import { AutoMovieEngineViolationCollector } from "../AutoMovieEngineViolationCollector";
import { appendFlamesArtifact } from "./appendFlamesArtifact";
import { appendLightMotionsArtifact } from "./appendLightMotionsArtifact";
import { appendPolygonBodyCuesArtifact } from "./appendPolygonBodyCuesArtifact";
import { appendPracticalSurfacesArtifact } from "./appendPracticalSurfacesArtifact";
import { appendShotMetadataArtifact } from "./appendShotMetadataArtifact";
import { appendSurfaceGraphicsArtifact } from "./appendSurfaceGraphicsArtifact";
import { pushViolation } from "./pushViolation";
import { toValidation } from "./toValidation";
import { validateClipArtifact } from "./validateClipArtifact";
import { validateRange } from "./validateRange";
import { validateUniqueBy } from "./validateUniqueBy";
import { validateUniqueIds } from "./validateUniqueIds";

/*
 * Admit shot/scene/camera references, performances, motion clips, polygon body
 * cue, practical surface track, flame cue, surface graphic track and font
 * source staged-node references, a bound flame's light clip, a feed camera
 * other than the shot's own, metadata and delivered-camera clearance
 * correspondence.
 *
 * A replay host can pass its staged skeleton resolver to check polygon cue
 * pivots and branch overlap on the same rig it will draw. Without a resolver,
 * cue checks cover staged node ids, duplicate targets and fields.
 */
export const validateShotArtifact: (
  shot: IAutoMovieShot,
  scene: IAutoMovieScene,
  motionIds: ReadonlySet<string> | null,
  skeleton?: (subject: string) => IAutoMovieSkeleton | null,
) => IAutoMovieValidation = (
  shot: IAutoMovieShot,
  scene: IAutoMovieScene,
  /*
   * Ids the shot's `performances[].motion` may reference, or `null` to skip
   * that cross-check. The caller resolves the registry: the engine knows what a
   * valid reference IS, not where a host keeps its clips.
   */
  motionIds: ReadonlySet<string> | null,
  skeleton?: (subject: string) => IAutoMovieSkeleton | null,
): IAutoMovieValidation => {
  const collector: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  const violations: IAutoMovieConstraintViolation[] = collector.items;
  if (shot.scene !== scene.id)
    pushViolation(
      violations,
      "type",
      "$input.scene",
      `shot scene "${shot.scene}" must match scene "${scene.id}"`,
      shot.scene,
    );
  const cameraIds: Set<string> = new Set(
    scene.cameras.map((camera: IAutoMovieCamera): string => camera.id),
  );
  if (!cameraIds.has(shot.camera))
    pushViolation(
      violations,
      "type",
      "$input.camera",
      `shot camera "${shot.camera}" must reference a scene camera`,
      shot.camera,
    );
  validateRange(
    shot.duration,
    "$input.duration",
    0,
    Infinity,
    "shot duration",
    violations,
    false,
  );

  const nodeIds: Set<string> = new Set(
    scene.nodes.map((node: { id: string }): string => node.id),
  );
  validateUniqueBy(
    shot.performances.map(
      (
        performance: IAutoMovieShotPerformance,
        index: number,
      ): { id: string; path: string } => ({
        id: performance.node,
        path: `$input.performances[${index}].node`,
      }),
    ),
    "shot performance node",
    violations,
  );
  shot.performances.forEach(
    (performance: IAutoMovieShotPerformance, i: number): void => {
      const path: string = `$input.performances[${i}]`;
      if (!nodeIds.has(performance.node))
        pushViolation(
          violations,
          "type",
          `${path}.node`,
          `performance node "${performance.node}" must reference a scene node`,
          performance.node,
        );
      validateRange(
        performance.startOffset,
        `${path}.startOffset`,
        0,
        shot.duration,
        "performance startOffset",
        violations,
      );
      if (
        performance.motion !== null &&
        motionIds !== null &&
        !motionIds.has(performance.motion)
      )
        pushViolation(
          violations,
          "type",
          `${path}.motion`,
          `performance motion "${performance.motion}" must reference a compiled motion`,
          performance.motion,
        );
    },
  );

  if (shot.cameraMotion !== null)
    validateClipArtifact(shot.cameraMotion, "$input.cameraMotion", violations);
  validateUniqueIds(
    shot.objectMotions,
    "$input.objectMotions",
    "object motion clip id",
    violations,
  );
  shot.objectMotions.forEach((clip: IAutoMovieClip, i: number): void =>
    validateClipArtifact(clip, `$input.objectMotions[${i}]`, violations),
  );
  appendLightMotionsArtifact(
    shot.lightMotions,
    "$input.lightMotions",
    stagedLightKinds(scene),
    violations,
  );

  appendPolygonBodyCuesArtifact(
    shot.polygonBodyCues,
    scene.nodes,
    shot.duration,
    collector,
    skeleton,
  );
  appendPracticalSurfacesArtifact(
    shot.practicalSurfaces,
    scene.nodes,
    shot.duration,
    violations,
  );
  // A bound flame names its binding, which the compiled shot carries as the
  // light clip of the same id.
  appendFlamesArtifact(shot.flames, scene.nodes, shot.duration, collector, {
    lights: new Set(
      (shot.lightMotions ?? []).map((clip: IAutoMovieClip): string => clip.id),
    ),
  });
  AutoMovieEngineTypography.validateFontSources(shot.fonts, "$input.fonts", collector);
  appendSurfaceGraphicsArtifact(
    shot.surfaceGraphics,
    scene.nodes,
    shot.duration,
    collector,
    undefined,
    new Set(
      (shot.fonts ?? []).map(
        (source: IAutoMovieFontSource): string => source.id,
      ),
    ),
    { ids: cameraIds, shot: shot.camera },
  );
  appendShotMetadataArtifact(shot, "$input", cameraIds, violations);
  const deliveredCameras: Set<string> = new Set([
    shot.camera,
    ...(shot.coverage ?? []).map(
      (take: IAutoMovieShotCoverage): string => take.camera,
    ),
  ]);
  const clearanceCameras: Set<string> = new Set(
    scene.cameras
      .filter(
        (camera: IAutoMovieCamera): boolean =>
          deliveredCameras.has(camera.id) && camera.clearance !== undefined,
      )
      .map((camera: IAutoMovieCamera): string => camera.id),
  );
  if (clearanceCameras.size > 0 && shot.cameraClearance === undefined)
    pushViolation(
      violations,
      "type",
      "$input.cameraClearance",
      "every delivered camera with a physical envelope must carry one accepted clearance report",
      shot.cameraClearance,
    );
  const reportedCameras: Set<string> = new Set(
    (shot.cameraClearance ?? []).map(
      (report: IAutoMovieCameraClearanceReport): string => report.camera,
    ),
  );
  for (const camera of clearanceCameras)
    if (!reportedCameras.has(camera))
      pushViolation(
        violations,
        "type",
        "$input.cameraClearance",
        `delivered camera "${camera}" declares a physical envelope but has no accepted clearance report`,
        shot.cameraClearance,
      );
  for (const camera of reportedCameras)
    if (!clearanceCameras.has(camera))
      pushViolation(
        violations,
        "type",
        "$input.cameraClearance",
        `clearance report camera "${camera}" must be a delivered camera that declares a physical envelope`,
        camera,
      );

  return toValidation(violations);
};

/*
 * Index scene lights by their authored kind for the light channel gate.
 * Duplicate ids use last map assignment; scene admission owns uniqueness.
 */
const stagedLightKinds: (
  scene: IAutoMovieScene,
) => ReadonlyMap<string, IAutoMovieLight["type"]> = (
  scene: IAutoMovieScene,
): ReadonlyMap<string, IAutoMovieLight["type"]> =>
  new Map(
    scene.lights.map(
      (light: IAutoMovieLight): [string, IAutoMovieLight["type"]] => [
        light.id,
        light.type,
      ],
    ),
  );