import { AutoMovieProductionSourcePathError } from "./AutoMovieProductionSourcePathError";
import { IAutoMovieDiagnostic } from "@automovie/interface";
import { errorMessage } from "./designDerivation/errorMessage";

/**
 * Attribute a source-read refusal to the shot contract that selected its module.
 *
 * Only AutoMovieProductionSourcePathError with outside-root reason receives that specific code; every other cause is classified source-path-missing, even when it describes another read failure. The original message survives ordinary Error/String conversion, which can itself throw for an effectful value.
 *
 * @evidence contracts/common.md#principled-implementation Typed outside-root identity distinguishes ownership refusal from the broad remaining read-failure category. readAutoMovieProductionBuildSources supplies the actual caught cause; this formatter neither retries the read nor verifies absence.
 * @evidence contracts/common.md#clear-and-simple-design Shot id and module path stay with one source-phase finding; shared errorMessage owns thrown-value text conversion and project readers own path admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The broad missing code is a current catalog limitation, not proof that arbitrary errors were absence. No caught cause is replaced by a safe source or successful artifact.
 * @evidence contracts/common.md#meaningful-documentation States exact special-case identity, broad residual classification, source address and conversion failure behavior.
 * @evidence contracts/performance.md#efficient-algorithms Fixed record construction adds id/path/message text cost and potentially arbitrary String conversion work; no filesystem traversal or validation algorithm runs here.
 * @evidence contracts/performance.md#reuse-equivalent-work Each caught source-read cause is formatted for its selected shot; effectful conversion and mutable source observations are not memoized.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The diagnostic retains text and addresses, not the original thrown object or a file buffer. The read owner releases handles; this formatter starts no task.
 */
export function sourcePathDiagnostic(
  id: string,
  sourcePath: string,
  error: unknown
): IAutoMovieDiagnostic {
  const message: string = errorMessage(error);
  return {
    code:
      error instanceof AutoMovieProductionSourcePathError &&
      error.reason === "outside-root"
        ? "source-path-outside-root"
        : "source-path-missing",
    category: "error",
    phase: "source",
    target: `shot:${id}`,
    path: sourcePath,
    message,
  };
}
