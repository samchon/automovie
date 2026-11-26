import type {
  IAutoMovieCameraIntent,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";

import { pushViolation } from "./pushViolation";
import { validateRange } from "./internal/validateRange";

/** Append camera-intent span, focus and focal-length findings. */
export function appendCameraIntentArtifact(
  intents: readonly IAutoMovieCameraIntent[],
  path: string,
  duration: number,
  violations: IAutoMovieConstraintViolation[],
): void {
  intents.forEach((intent: IAutoMovieCameraIntent, i: number): void => {
    const intentPath: string = `${path}[${i}]`;
    validateRange(
      intent.start,
      `${intentPath}.start`,
      0,
      duration,
      "camera intent start",
      violations,
    );
    if (intent.focusPull !== undefined) {
      const pull: NonNullable<IAutoMovieCameraIntent["focusPull"]> =
        intent.focusPull;
      const next: IAutoMovieCameraIntent | undefined = intents[i + 1];
      const frameLimit: number =
        next !== undefined ? Math.min(duration, next.start) : duration;
      if (intent.focus === null)
        pushViolation(
          violations,
          "type",
          `${intentPath}.focus`,
          "a camera focus pull requires a source focus point",
          intent.focus,
        );
      validateRange(
        pull.start,
        `${intentPath}.focusPull.start`,
        Math.max(0, intent.start),
        frameLimit,
        "focus pull start",
        violations,
      );
      validateRange(
        pull.end,
        `${intentPath}.focusPull.end`,
        Math.max(0, pull.start),
        frameLimit,
        "focus pull end",
        violations,
        false,
      );
    }
    // The input gate refuses a focal length <= 0 mm; the artifact must agree.
    if (intent.focalLength !== null)
      validateRange(
        intent.focalLength,
        `${intentPath}.focalLength`,
        0,
        Infinity,
        "camera intent focal length",
        violations,
        false,
      );

    // The input gate refuses a non-positive or non-finite stop; the artifact
    // must agree.
    if (intent.fNumber !== undefined)
      validateRange(
        intent.fNumber,
        `${intentPath}.fNumber`,
        0,
        Infinity,
        "camera intent f-number",
        violations,
        false,
      );
  });
}
