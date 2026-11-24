import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { CAMERA_FRAMINGS } from "../film/constants/CAMERA_FRAMINGS";
import { CAMERA_MOVES } from "../film/constants/CAMERA_MOVES";
import { isRecord } from "./isRecord";
import { pushViolation } from "./pushViolation";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateObjectArtifact } from "./validateObjectArtifact";
import { validateRange } from "./validateRange";
import { validateVectorArtifact } from "./validateVectorArtifact";

/** The closed framing union, read as strings for an unvalidated artifact. */
const FRAMINGS: ReadonlySet<string> = CAMERA_FRAMINGS;

/** The closed move union, read as strings for an unvalidated artifact. */
const MOVES: ReadonlySet<string> = CAMERA_MOVES;

/** Append camera-intent span shape, vocabulary, focus and focal-length findings. */
export const appendCameraIntentArtifact: (
  intents: unknown,
  path: string,
  duration: number,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  intents: unknown,
  path: string,
  duration: number,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (!validateArrayArtifact(intents, path, "camera intent spans", violations))
    return;
  for (let i: number = 0, iLimit: number = intents.length; i < iLimit; ++i) {
    const intent: unknown = intents[i];
    const intentPath: string = `${path}[${i}]`;
    if (
      !validateObjectArtifact(intent, intentPath, "camera intent", violations)
    )
      continue;
    validateRange(
      intent.start,
      `${intentPath}.start`,
      0,
      duration,
      "camera intent start",
      violations,
    );
    if (typeof intent.framing !== "string" || !FRAMINGS.has(intent.framing))
      pushViolation(
        violations,
        "type",
        `${intentPath}.framing`,
        `camera intent framing must be one of ${[...FRAMINGS].join(", ")}, but was "${String(intent.framing)}"`,
        intent.framing,
      );
    if (typeof intent.move !== "string" || !MOVES.has(intent.move))
      pushViolation(
        violations,
        "type",
        `${intentPath}.move`,
        `camera intent move must be one of ${[...MOVES].join(", ")}, but was "${String(intent.move)}"`,
        intent.move,
      );
    if (intent.focus !== null)
      validateVectorArtifact(
        intent.focus,
        `${intentPath}.focus`,
        "camera intent focus",
        violations,
      );
    if (
      intent.focusPull !== undefined &&
      validateObjectArtifact(
        intent.focusPull,
        `${intentPath}.focusPull`,
        "camera focus pull",
        violations,
      )
    ) {
      const pull: Record<string, unknown> = intent.focusPull;
      const next: unknown = intents[i + 1];
      const frameLimit: number =
        isRecord(next) &&
        typeof next.start === "number" &&
        Number.isFinite(next.start)
          ? Math.min(duration, next.start)
          : duration;
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
        typeof intent.start === "number" && Number.isFinite(intent.start)
          ? Math.max(0, intent.start)
          : 0,
        frameLimit,
        "focus pull start",
        violations,
      );
      validateRange(
        pull.end,
        `${intentPath}.focusPull.end`,
        typeof pull.start === "number" && Number.isFinite(pull.start)
          ? Math.max(0, pull.start)
          : 0,
        frameLimit,
        "focus pull end",
        violations,
        false,
      );
      validateVectorArtifact(
        pull.to,
        `${intentPath}.focusPull.to`,
        "focus pull destination",
        violations,
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
  }
};
