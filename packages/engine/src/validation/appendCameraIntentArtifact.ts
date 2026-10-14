import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { CAMERA_FRAMINGS } from "../film/constants/CAMERA_FRAMINGS";
import { CAMERA_MOVES } from "../film/constants/CAMERA_MOVES";
import { pushViolation } from "./pushViolation";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateObjectArtifact } from "./validateObjectArtifact";
import { validateRange } from "./validateRange";
import { validateVectorArtifact } from "./validateVectorArtifact";

/** The closed framing union, read as strings for an unvalidated artifact. */
const FRAMINGS: ReadonlySet<string> = CAMERA_FRAMINGS;

/** The closed move union, read as strings for an unvalidated artifact. */
const MOVES: ReadonlySet<string> = CAMERA_MOVES;

/**
 * Append camera-intent span shape, vocabulary, focus and focal-length findings.
 *
 * @evidence contracts/common.md#principled-implementation Shared array/object admission precedes shot-bounded start, canonical framing/move membership, nullable finite focus and strictly positive focal-length checks.
 * @evidence contracts/common.md#clear-and-simple-design Shot and coverage intent share one extracted owner and the film's canonical framing/move sets rather than separately copied camera vocabulary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No camera path or focal default repairs an invalid span, and indexed traversal refuses a missing declared slot; this validates supplied metadata, not span sorting, coverage completeness or applied camera movement.
 * @evidence contracts/common.md#meaningful-documentation Documents start seconds, nullable focus/focal fields, strictly positive millimetre focal length and the exact canonical vocabulary used.
 * @evidence contracts/performance.md#efficient-algorithms I intent rows require O(I) fixed-field checks plus string/message work, allocating only refused findings and temporary paths.
 * @evidence contracts/performance.md#reuse-equivalent-work The same sets and field predicates serve primary and coverage intent; changed mutable metadata is inspected afresh without persistent reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only appended findings retain offending fields in the caller's array; borrowed intent rows and module vocabulary sets acquire no camera, animation or renderer task.
 */
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
  }
};
