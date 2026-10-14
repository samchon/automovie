import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { appendCameraIntentArtifact } from "./appendCameraIntentArtifact";
import { pushViolation } from "./pushViolation";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateClipArtifact } from "./validateClipArtifact";
import { validateNonEmptyId } from "./validateNonEmptyId";
import { validateObjectArtifact } from "./validateObjectArtifact";

/**
 * Inspect alternate-camera takes, their clips and camera intent metadata.
 *
 * @evidence contracts/common.md#principled-implementation Each admitted take names a camera, optionally resolves it in the scene, differs from the hero and is unique within coverage; cameraMotion must be null or a canonically admitted clip and cameraIntent uses the shared intent owner.
 * @evidence contracts/common.md#clear-and-simple-design Coverage owns alternate-camera identity rules while clip shape and intent vocabulary remain shared, preserving the original take order and diagnostic paths after extraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing scene index does not invent camera existence proof, absent cameraMotion is reported rather than defaulted, and indexed traversal refuses missing resident takes. Structural admission does not prove visual coverage or a rendered angle.
 * @evidence contracts/common.md#meaningful-documentation States hero-camera exclusion, duplicate first-index reporting, nullable scene context, required null-or-clip field and delegated intent meaning.
 * @evidence contracts/performance.md#efficient-algorithms T takes require expected O(T) camera-map work plus their nested clip/intent populations and message lengths, with O(T+F) identity/findings storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One camera-to-first-index map handles all duplicates, and both primary/coverage intents reuse the same extracted validator rather than a second rule implementation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains appended findings and any offending clip references; the temporary camera map is discarded and no take playback or GPU task is acquired.
 */
export const appendShotCoverageArtifact: (
  coverage: unknown,
  path: string,
  duration: number,
  heroCamera: unknown,
  sceneCameras: ReadonlySet<string> | null,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  coverage: unknown,
  path: string,
  duration: number,
  heroCamera: unknown,
  sceneCameras: ReadonlySet<string> | null,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (!validateArrayArtifact(coverage, path, "shot coverage", violations))
    return;
  const seen: Map<string, number> = new Map<string, number>();
  for (let i: number = 0, iLimit: number = coverage.length; i < iLimit; ++i) {
    const take: unknown = coverage[i];
    const takePath: string = `${path}[${i}]`;
    if (!validateObjectArtifact(take, takePath, "coverage take", violations))
      continue;
    validateNonEmptyId(
      take.camera,
      `${takePath}.camera`,
      "coverage camera",
      violations,
    );
    if (typeof take.camera === "string") {
      if (sceneCameras !== null && !sceneCameras.has(take.camera))
        pushViolation(
          violations,
          "type",
          `${takePath}.camera`,
          `coverage camera "${take.camera}" must reference a scene camera`,
          take.camera,
        );
      // The same rule the engine enforces when compiling the take: coverage
      // plays ANOTHER angle, so the hero camera can never also cover the beat,
      // and one camera never covers it twice.
      if (take.camera === heroCamera)
        pushViolation(
          violations,
          "type",
          `${takePath}.camera`,
          `coverage plays another angle of the beat, but "${take.camera}" is already this shot's live camera`,
          take.camera,
        );
      const first: number | undefined = seen.get(take.camera);
      if (first !== undefined)
        pushViolation(
          violations,
          "type",
          `${takePath}.camera`,
          `coverage camera "${take.camera}" is duplicated; first declared at ${path}[${first}].camera`,
          take.camera,
        );
      else seen.set(take.camera, i);
    }
    if (take.cameraMotion === undefined)
      pushViolation(
        violations,
        "type",
        `${takePath}.cameraMotion`,
        "coverage cameraMotion must be null or a clip",
        take.cameraMotion,
      );
    else if (take.cameraMotion !== null)
      validateClipArtifact(
        take.cameraMotion,
        `${takePath}.cameraMotion`,
        violations,
      );
    appendCameraIntentArtifact(
      take.cameraIntent,
      `${takePath}.cameraIntent`,
      duration,
      violations,
    );
  }
};
