import { IAutoMovieConstraintViolation, IAutoMovieScene, IAutoMovieShot, IAutoMovieValidation } from "@automovie/interface";
import { asArray } from "./asArray";
import { isRecord } from "./isRecord";
import { pushViolation } from "./pushViolation";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateNonEmptyId } from "./validateNonEmptyId";
import { validateObjectArtifact } from "./validateObjectArtifact";
import { validateRange } from "./validateRange";
import { validateUniqueBy } from "./validateUniqueBy";
import { validateUniqueIds } from "./validateUniqueIds";
import { toValidation } from "./toValidation";
import { appendLightMotionsArtifact } from "./appendLightMotionsArtifact";
import { appendShotMetadataArtifact } from "./appendShotMetadataArtifact";
import { validateClipArtifact } from "./validateClipArtifact";

export const validateShotArtifact = (
  shot: IAutoMovieShot,
  scene: IAutoMovieScene,
  /**
   * Ids the shot's `performances[].motion` may reference, or `null` to skip
   * that cross-check. The caller resolves the registry: the engine knows what a
   * valid reference IS, not where a host keeps its clips.
   */
  motionIds: ReadonlySet<string> | null,
): IAutoMovieValidation => {
  const violations: IAutoMovieConstraintViolation[] = [];
  if (!validateObjectArtifact(shot, "$input", "shot", violations))
    return toValidation(violations);
  validateNonEmptyId(shot.id, "$input.id", "shot id", violations);
  validateNonEmptyId(shot.scene, "$input.scene", "shot scene", violations);
  validateNonEmptyId(shot.camera, "$input.camera", "shot camera", violations);
  const sceneId = isRecord(scene) ? scene.id : undefined;
  if (shot.scene !== sceneId)
    pushViolation(
      violations,
      "type",
      "$input.scene",
      `shot scene "${shot.scene}" must match scene "${sceneId}"`,
      shot.scene,
    );
  const sceneCameras = asArray(isRecord(scene) ? scene.cameras : undefined);
  if (
    typeof shot.camera === "string" &&
    !sceneCameras.some(
      (camera) => isRecord(camera) && camera.id === shot.camera,
    )
  )
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

  const nodeIds = new Set(
    asArray(isRecord(scene) ? scene.nodes : undefined)
      .filter(isRecord)
      .map((node) => node.id)
      .filter((id): id is string => typeof id === "string"),
  );
  validateUniqueBy(
    asArray(shot.performances).map((performance, index) => ({
      id: isRecord(performance) ? performance.node : undefined,
      path: `$input.performances[${index}].node`,
    })),
    "shot performance node",
    violations,
  );
  validateArrayArtifact(
    shot.performances,
    "$input.performances",
    "shot performances",
    violations,
  );
  asArray(shot.performances).forEach((performance, i) => {
    const path = `$input.performances[${i}]`;
    if (
      !validateObjectArtifact(performance, path, "shot performance", violations)
    )
      return;
    validateNonEmptyId(
      performance.node,
      `${path}.node`,
      "performance node",
      violations,
    );
    if (typeof performance.node === "string" && !nodeIds.has(performance.node))
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
    if (performance.motion !== null) {
      validateNonEmptyId(
        performance.motion,
        `${path}.motion`,
        "performance motion",
        violations,
      );
      if (
        motionIds !== null &&
        typeof performance.motion === "string" &&
        !motionIds.has(performance.motion)
      )
        pushViolation(
          violations,
          "type",
          `${path}.motion`,
          `performance motion "${performance.motion}" must reference a compiled motion`,
          performance.motion,
        );
    }
  });

  if (shot.cameraMotion === undefined)
    pushViolation(
      violations,
      "type",
      "$input.cameraMotion",
      "shot cameraMotion must be null or a clip",
      shot.cameraMotion,
    );
  else if (shot.cameraMotion !== null)
    validateClipArtifact(shot.cameraMotion, "$input.cameraMotion", violations);
  validateUniqueIds(
    shot.objectMotions,
    "$input.objectMotions",
    "object motion clip id",
    violations,
  );
  asArray(shot.objectMotions).forEach((clip, i) => {
    validateClipArtifact(clip, `$input.objectMotions[${i}]`, violations);
  });
  appendLightMotionsArtifact(
    shot.lightMotions,
    "$input.lightMotions",
    stagedLightKinds(scene),
    violations,
  );

  appendShotMetadataArtifact(
    shot,
    "$input",
    new Set(
      sceneCameras
        .filter(isRecord)
        .map((camera) => camera.id)
        .filter((id): id is string => typeof id === "string"),
    ),
    violations,
  );
  const deliveredCameras = new Set([
    ...(typeof shot.camera === "string" ? [shot.camera] : []),
    ...asArray(shot.coverage)
      .filter(isRecord)
      .map((take) => take.camera)
      .filter((camera): camera is string => typeof camera === "string"),
  ]);
  const clearanceCameras = new Set(
    sceneCameras
      .filter(isRecord)
      .filter(
        (camera) =>
          typeof camera.id === "string" &&
          deliveredCameras.has(camera.id) &&
          camera.clearance !== undefined,
      )
      .map((camera) => camera.id as string),
  );
  if (clearanceCameras.size > 0 && shot.cameraClearance === undefined)
    pushViolation(
      violations,
      "type",
      "$input.cameraClearance",
      "every delivered camera with a physical envelope must carry one accepted clearance report",
      shot.cameraClearance,
    );
  const reportedCameras = new Set(
    asArray(shot.cameraClearance)
      .filter(isRecord)
      .map((report) => report.camera)
      .filter((camera): camera is string => typeof camera === "string"),
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

/** The closed event-kind union, gated the way the engine's compilers emit it. */
const EVENT_KINDS = new Set([
  "contact",
  "hit",
  "grab",
  "release",
  "attach",
  "detach",
  "fall",
]);

/**
 * The slack the shot-local event clock carries at its upper bound, matching
 * `performShot`'s own landing comparison so the two cannot disagree about an
 * event that lands exactly on the shot end.
 */
const EVENT_TIME_EPSILON = 1e-9;

/** The closed event-source union. */
const EVENT_SOURCES = new Set([
  "collisionSolver",
  "scriptedCue",
  "sampledProximity",
  "impactOutput",
]);

/** The closed framing union, the same set `performShot` gates a frame action by. */
const CAMERA_FRAMINGS = new Set(["wide", "full", "medium", "close"]);

/** The closed move union, the same set `performShot` gates a frame action by. */
const CAMERA_MOVES = new Set([
  "static",
  "follow",
  "orbit",
  "push-in",
  "truck",
  "whip",
]);
