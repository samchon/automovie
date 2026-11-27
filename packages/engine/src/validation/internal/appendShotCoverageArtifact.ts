import type {
  IAutoMovieConstraintViolation,
  IAutoMovieShotCoverage,
} from "@automovie/interface";

import { appendCameraIntentArtifact } from "./appendCameraIntentArtifact";
import { pushViolation } from "./pushViolation";
import { validateClipArtifact } from "./validateClipArtifact";

/*
 * Inspect alternate-camera takes, their clips and camera intent metadata.
 */
export function appendShotCoverageArtifact(
  coverage: readonly IAutoMovieShotCoverage[],
  path: string,
  duration: number,
  heroCamera: string,
  sceneCameras: ReadonlySet<string> | null,
  violations: IAutoMovieConstraintViolation[],
): void {
  const seen: Map<string, number> = new Map<string, number>();
  coverage.forEach((take: IAutoMovieShotCoverage, i: number): void => {
    const takePath: string = `${path}[${i}]`;
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
    if (take.cameraMotion !== null)
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
  });
}
