import type {
  IAutoMovieConstraintViolation,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { isRecord } from "./isRecord";
import { pushViolation } from "./pushViolation";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateNonEmptyId } from "./validateNonEmptyId";
import { validateObjectArtifact } from "./validateObjectArtifact";

/**
 * Check shot-local practical surface tracks, appending faults under
 * `$input.practicalSurfaces`. When the model registry is supplied, also resolve
 * every target to a generated rigid model part and every key to a material on
 * that model. An omitted registry is the structural shot artifact boundary.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the diagnostic root, optional registry boundary and what targets and keys must resolve.
 * @evidence contracts/development/implementation.md#principled-implementation Shape checks guard field reads. Target pairs are unique, time begins at zero, and finite keys strictly increase within the half-open shot interval.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Indexes target identities once and walks each track and its keys in source order. Leaf shape and failure reporting use the shared artifact helpers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses ambiguous track targets, missing model parts or materials when a registry is available, and malformed time even when no registry is available. Does not sort, fill or replace source keys.
 * @evidence contracts/development/implementation.md#efficient-algorithms An absent track list exits without allocations. Otherwise work scales with the scene and registry indexes, tracks and keys, plus each track's scans of its model's parts and materials.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The request-local node and model indexes serve all tracks, and each track indexes its materials once before validating its keys.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrowed records are never changed, and only the caller's diagnostic list retains any failure values.
 */
export function appendPracticalSurfacesArtifact(
  tracks: unknown,
  sceneNodes: readonly unknown[],
  duration: number,
  violations: IAutoMovieConstraintViolation[],
  models?: readonly IAutoMovieModel[],
): void {
  const root: string = "$input.practicalSurfaces";
  if (
    tracks === undefined ||
    !validateArrayArtifact(tracks, root, "practical surface tracks", violations) ||
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
          models.map(
            (model: IAutoMovieModel): [string, IAutoMovieModel] => [
              model.id,
              model,
            ],
          ),
        );
  const targets: Set<string> = new Set();

  for (const [index, track] of tracks.entries()) {
    const path: string = `${root}[${index}]`;
    if (
      !validateObjectArtifact(track, path, "practical surface track", violations)
    )
      continue;

    const validNode: boolean = appendId(track.node, `${path}.node`, "practical surface node", violations);
    const validPart: boolean = appendId(track.part, `${path}.part`, "practical surface part", violations);
    const modelId: string | undefined =
      typeof track.node === "string" ? nodes.get(track.node) : undefined;
    if (validNode && modelId === undefined)
      pushViolation(
        violations,
        "type",
        `${path}.node`,
        "must name a staged prop node",
        track.node,
      );
    if (validNode && validPart) {
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
    }

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
        validPart &&
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
    const keys: unknown = track.keys;
    if (!validateArrayArtifact(keys, keysPath, "practical surface keys", violations))
      continue;
    if (keys.length === 0)
      pushViolation(
        violations,
        "type",
        keysPath,
        "must start with a key at shot time zero",
        keys.length,
      );

    let previous: number = -Infinity;
    for (const [keyIndex, key] of keys.entries()) {
      const keyPath: string = `${keysPath}[${keyIndex}]`;
      if (!validateObjectArtifact(key, keyPath, "practical surface key", violations))
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
        pushViolation(
          violations,
          "range",
          `${keyPath}.time`,
          "first time must be zero and times must strictly increase within [0, duration)",
          time,
        );
      else previous = time;

      if (
        appendId(key.material, `${keyPath}.material`, "practical surface material", violations) &&
        materials !== undefined &&
        !materials.has(key.material)
      )
        pushViolation(
          violations,
          "type",
          `${keyPath}.material`,
          "must name a material of the prop model",
          key.material,
        );
    }
  }
}

/** Check the id once so malformed names do not also get reference findings. */
function appendId(
  id: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
): id is string {
  const before: number = violations.length;
  validateNonEmptyId(id, path, label, violations);
  return violations.length === before;
}
