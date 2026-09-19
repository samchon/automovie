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

/**
 * The shot artifact's structural contract, owned by the engine that produces
 * it.
 *
 * It used to live only beside the commit gate, so `performShot` could emit
 * a shot no consumer would accept and report success: the same failure recurred
 * five times (#1224, #1308, #1314, #1316, #1318), each fixed by teaching the
 * producer one more field. The rules now have a single home, on the side that
 * both the producer and every consumer can reach (#1320).
 *
 * What stays with the host: whether a slice is committable, whether a resident
 * registry supplies the referenced clips, and how a project addresses its
 * files. Those are questions about a deployment, not about the artifact.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `validateShotArtifact` reports every malformed shot id, reference, performance, motion, event, intent, and coverage member at its artifact path.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `validateShotArtifact` preserves shot-root identity, nested collection positions, observed values, and expected structural contracts across the complete commit gate.
 * @author Samchon
 */

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

/**
 * The scene's light id → `type` index, keyed by the only thing a pointer can
 * name.
 *
 * A light is addressable exactly when it is an object with a string id and a
 * `type`, which is what a `Map.get` miss states in one read: an entry left out
 * and an entry stored with no kind both answer `undefined`, and neither can be
 * the target of a track. Such a scene is malformed either way, and
 * `validateSceneArtifact` is the gate that says so.
 */
const stagedLightKinds = (scene: unknown): ReadonlyMap<string, unknown> => {
  const index = new Map<string, unknown>();
  for (const light of asArray(isRecord(scene) ? scene.lights : undefined))
    if (isRecord(light) && typeof light.id === "string")
      index.set(light.id, light.type);
  return index;
};
