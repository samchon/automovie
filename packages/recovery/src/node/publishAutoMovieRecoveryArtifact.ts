import type { IAutoMovieRecoveryOperation } from "../IAutoMovieRecoveryOperation";
import { writeAutoMovieRecoveryArtifact } from "./internal/writeAutoMovieRecoveryArtifact";

/**
 * Publish one plain data artifact atomically without replacing an existing file.
 * Publication identity is the exact emitted UTF-8 byte hash, independent of model
 * identity. Cancellation is checked before synchronous serialization begins; this
 * operation cannot observe an event-loop abort while blocked in synchronous I/O.
 * Failed serialization leaves the target unpublished and removes its temporary
 * file. A process crash can leave an unpublished temporary file, as documented by
 * the writer. Cancellation does not delete a completed immutable publication.
 *
 * @evidence contracts/common.md#principled-implementation The bounded JSON writer closes a same-directory temporary file before nonoverwriting hard-link publication and hashes the exact written bytes.
 * @evidence contracts/common.md#clear-and-simple-design One Node host wraps publication lifecycle; portable workflows neither open paths nor own output files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometry filtering, rounding, source fallback, output replacement or claimed asynchronous cancellation changes the artifact.
 * @evidence contracts/common.md#meaningful-documentation States byte identity, immutable effects, cancellation granularity and temporary-file cleanup limits.
 * @evidence contracts/performance.md#efficient-algorithms Serialization and hashing are O(B) in emitted bytes with fixed shallow-array staging and O(depth) ancestor tracking; the largest string is not separately bounded.
 * @evidence contracts/performance.md#reuse-equivalent-work Each emitted chunk feeds both the file and hash once; no complete output reread or regenerated geometry is required.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The delegated writer closes file descriptors and removes its private temporary file on return or exception; the caller retains input data and the completed output.
 */
export function publishAutoMovieRecoveryArtifact(
  output: string,
  artifact: object,
  options: { signal?: AbortSignal } = {},
): IAutoMovieRecoveryOperation.Result<{
  path: string;
  sha256: string;
  bytes: number;
}> {
  const schema: IAutoMovieRecoveryOperation.Result<never>["schema"] =
    "automovie-recovery-operation-v1";
  const operator: IAutoMovieRecoveryOperation.Result<never>["operator"] =
    "json-publication-v1";
  if (options.signal?.aborted)
    return {
      schema,
      operator,
      status: "cancelled",
      diagnostics: ["Cancelled before publication"],
    };
  if (!output || artifact === null || typeof artifact !== "object")
    return {
      schema,
      operator,
      status: "refused",
      diagnostics: ["An output path and plain data artifact are required"],
    };
  try {
    const publication: ReturnType<typeof writeAutoMovieRecoveryArtifact> =
      writeAutoMovieRecoveryArtifact(output, artifact);
    return {
      schema,
      operator,
      status: "complete",
      value: { path: output, ...publication },
      diagnostics: [],
    };
  } catch (failure: unknown) {
    return {
      schema,
      operator,
      status: "failed",
      diagnostics: [
        failure instanceof Error ? failure.message : String(failure),
      ],
    };
  }
}
