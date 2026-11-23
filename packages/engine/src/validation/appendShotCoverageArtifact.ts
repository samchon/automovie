import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { appendCameraIntentArtifact } from "./appendCameraIntentArtifact";
import { pushViolation } from "./pushViolation";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateClipArtifact } from "./validateClipArtifact";
import { validateNonEmptyId } from "./validateNonEmptyId";
import { validateObjectArtifact } from "./validateObjectArtifact";

/**
 * Inspect alternate-camera takes, their clips and camera intent metadata.
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
