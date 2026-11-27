import type {
  IAutoMovieFilePublicationOptions,
  IAutoMovieFileReceipt,
  IAutoMovieRecoveryResult,
} from "@automovie/interface";

import { writeRecoveryArtifact } from "./artifact/writeRecoveryArtifact";

/**
 * Publish one plain data artifact atomically without replacing an existing file.
 * Publication identity is the exact emitted UTF-8 byte hash, independent of model
 * identity. The optional cancellation predicate runs before serialization; this
 * operation cannot observe event-loop changes while blocked in synchronous I/O.
 * A thrown predicate or nonboolean result fails without publishing an artifact.
 * Failed serialization leaves the target unpublished and removes its temporary
 * file. A process crash can leave an unpublished temporary file, as documented by
 * the writer. Cancellation does not delete a completed immutable publication.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The bounded JSON writer closes a same-directory temporary file before nonoverwriting hard-link publication and hashes the exact written bytes. No geometry filtering, rounding, source fallback, output replacement or claimed asynchronous cancellation changes the artifact.
 * @evidence contracts/development/implementation.md#efficient-algorithms The Node host delegates encoding and publication to the JSON writer. Work scales with visited keys and values and emitted UTF-8. The writer hashes each emitted chunk once and owns its descriptors and private staging file. Staging includes bounded shallow-array chunks, the largest encoded primitive and active records' key lists. The writer attempts cleanup on failure while preserving the primary error. The caller retains the input and any completed immutable publication.
 * @evidence contracts/development/common.md#meaningful-documentation States byte identity, immutable effects, cancellation granularity and temporary-file cleanup limits.
 */
export function publishRecoveryArtifact(
  output: string,
  artifact: object,
  options: IAutoMovieFilePublicationOptions = {},
): IAutoMovieRecoveryResult<IAutoMovieFileReceipt> {
  const operator: IAutoMovieRecoveryResult<never>["operator"] =
    "json-publication-v1";
  try {
    if (
      options === null ||
      typeof options !== "object" ||
      (options.cancelled !== undefined &&
        typeof options.cancelled !== "function")
    )
      return {
        operator,
        status: "refused",
        diagnostics: ["Cancellation must be an optional synchronous predicate"],
      };
    const cancelled: boolean =
      options.cancelled === undefined ? false : options.cancelled();
    if (typeof cancelled !== "boolean")
      throw new Error("Cancellation predicate must return a boolean");
    if (cancelled)
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before publication"],
      };
    if (!output || artifact === null || typeof artifact !== "object")
      return {
        operator,
        status: "refused",
        diagnostics: ["An output path and plain data artifact are required"],
      };
    const publication: ReturnType<typeof writeRecoveryArtifact> =
      writeRecoveryArtifact(output, artifact);
    return {
      operator,
      status: "complete",
      value: { path: output, ...publication },
      diagnostics: [],
    };
  } catch (failure: unknown) {
    return {
      operator,
      status: "failed",
      diagnostics: [
        failure instanceof Error ? failure.message : String(failure),
      ],
    };
  }
}
