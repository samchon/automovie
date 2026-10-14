import {
  IAutoMovieConstraintViolation,
  IAutoMovieScene,
  IAutoMovieShot,
  IAutoMovieValidation,
} from "@automovie/interface";

import { appendLightMotionsArtifact } from "./appendLightMotionsArtifact";
import { appendShotMetadataArtifact } from "./appendShotMetadataArtifact";
import { asArray } from "./asArray";
import { isRecord } from "./isRecord";
import { pushViolation } from "./pushViolation";
import { toValidation } from "./toValidation";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateClipArtifact } from "./validateClipArtifact";
import { validateNonEmptyId } from "./validateNonEmptyId";
import { validateObjectArtifact } from "./validateObjectArtifact";
import { validateRange } from "./validateRange";
import { validateUniqueBy } from "./validateUniqueBy";
import { validateUniqueIds } from "./validateUniqueIds";

/**
 * Admit shot/scene/camera references, performances, motion clips, metadata and delivered-camera clearance correspondence.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Admit shot/scene/camera references, performances, motion clips, metadata and delivered-camera clearance correspondence.
 * @evidence contracts/common.md#clear-and-simple-design Clip shape and metadata/light owners supply leaf checks while this entry owns scene cross references.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A null motion registry defers compiled-motion existence; performance/object-clip walks report absent slots rather than silently skipping them. Clearance rows remain metadata rather than recomputed sweeps.
 * @evidence contracts/common.md#meaningful-documentation Exact paths and registry-optional semantics explain the host/engine boundary.
 * @evidence contracts/performance.md#efficient-algorithms Performance/clip/node/camera/coverage populations drive scans, maps and track-buffer validation; channel serialization also contributes.
 * @evidence contracts/performance.md#reuse-equivalent-work Request-local id sets and light-kind map share scene lookup work across shot fields.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only report rows escape; borrowed artifacts/registries remain caller-owned and no playback host is started.
 */

export const validateShotArtifact: (shot: IAutoMovieShot, scene: IAutoMovieScene, motionIds: ReadonlySet<string> | null) => IAutoMovieValidation = (
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
  const sceneId: string | undefined = isRecord(scene) ? scene.id : undefined;
  if (shot.scene !== sceneId)
    pushViolation(
      violations,
      "type",
      "$input.scene",
      `shot scene "${shot.scene}" must match scene "${sceneId}"`,
      shot.scene,
    );
  const sceneCameras: unknown[] = asArray(isRecord(scene) ? scene.cameras : undefined);
  if (
    typeof shot.camera === "string" &&
    !sceneCameras.some(
      (camera: unknown): boolean => isRecord(camera) && camera.id === shot.camera,
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

  const nodeIds: Set<string> = new Set(
    asArray(isRecord(scene) ? scene.nodes : undefined)
      .filter(isRecord)
      .map((node: Record<string, unknown>): unknown => node.id)
      .filter((id: unknown): id is string => typeof id === "string"),
  );
  const performances: unknown[] = asArray(shot.performances);
  validateUniqueBy(
    Array.from(performances, (performance: unknown, index: number): { id: unknown; path: string; } => ({
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
  for (let i: number = 0; i < performances.length; ++i) {
    const performance: unknown = performances[i];
    const path: string = `$input.performances[${i}]`;
    if (
      !validateObjectArtifact(performance, path, "shot performance", violations)
    )
      continue;
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
  }

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
  for (const [i, clip] of asArray(shot.objectMotions).entries()) {
    validateClipArtifact(clip, `$input.objectMotions[${i}]`, violations);
  }
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
        .map((camera: Record<string, unknown>): unknown => camera.id)
        .filter((id: unknown): id is string => typeof id === "string"),
    ),
    violations,
  );
  const deliveredCameras: Set<string> = new Set([
    ...(typeof shot.camera === "string" ? [shot.camera] : []),
    ...asArray(shot.coverage)
      .filter(isRecord)
      .map((take: Record<string, unknown>): unknown => take.camera)
      .filter((camera: unknown): camera is string => typeof camera === "string"),
  ]);
  const clearanceCameras: Set<string> = new Set(
    sceneCameras
      .filter(isRecord)
      .filter(
        (camera: Record<string, unknown>): boolean =>
          typeof camera.id === "string" &&
          deliveredCameras.has(camera.id) &&
          camera.clearance !== undefined,
      )
      .map((camera: Record<string, unknown>): string => camera.id as string),
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
    asArray(shot.cameraClearance)
      .filter(isRecord)
      .map((report: Record<string, unknown>): unknown => report.camera)
      .filter((camera: unknown): camera is string => typeof camera === "string"),
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
 * Index shallow scene light records having string ids by their authored kind.
 *
 * The light channel gate receives only the cross-reference index it needs.
 *
 * Nonrecords/non-string ids are omitted; duplicate ids use last map assignment and scene admission owns uniqueness.
 *
 * Missing/undefined kind is indistinguishable from absence to the downstream gate.
 *
 * L lights cost O(L) traversal and O(U) map storage plus id hashing.
 *
 * One map serves all shot light track gates.
 *
 * The caller owns the map and borrowed kind values, with no staged renderer light acquired.
 */
const stagedLightKinds: (scene: unknown) => ReadonlyMap<string, unknown> = (scene: unknown): ReadonlyMap<string, unknown> => {
  const index: Map<string, unknown> = new Map<string, unknown>();
  for (const light of asArray(isRecord(scene) ? scene.lights : undefined))
    if (isRecord(light) && typeof light.id === "string")
      index.set(light.id, light.type);
  return index;
};
