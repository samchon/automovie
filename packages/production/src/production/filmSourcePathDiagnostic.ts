import { AutoMovieProductionSourcePathError } from "./AutoMovieProductionSourcePathError";
import { IAutoMovieDiagnostic } from "@automovie/interface";
import { FILM_SOURCE_EXPORT, FILM_SOURCE_PATH } from "./productionFilmAssembly";
import { errorMessage } from "./designDerivation/errorMessage";

/**
 * Attribute the selected film-entry read failure to its supported authoring address.
 *
 * Typed outside-root refusal selects its dedicated code; other failures use the current broad missing classification. The diagnostic names the required film export/build signature while preserving converted cause text.
 *
 * @evidence contracts/common.md#principled-implementation The same typed source-path distinction used for shots applies to the fixed film module. The coordinator supplies a caught read failure, and formatting does not establish actual absence or repair source bytes.
 * @evidence contracts/common.md#clear-and-simple-design Film source constants own the address/export convention, and shared errorMessage owns cause conversion; this function provides only the film diagnostic projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed film entry is a declared product convention. Broad source-path-missing classification remains for non-ownership failures and is not a fabricated missing-file observation.
 * @evidence contracts/common.md#meaningful-documentation Documents the selected address, required named build export, ownership-specific code and remaining failure classification limit.
 * @evidence contracts/performance.md#efficient-algorithms Record/text allocation and Error/String conversion dominate this fixed projection; conversion can execute caller code and no filesystem read is performed here.
 * @evidence contracts/performance.md#reuse-equivalent-work Each actual read failure is independently rendered; no previous film diagnostic is reused as a current residency answer.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only diagnostic strings transfer to the attempt, with no retained cause manager, file handle, temporary artifact or running task.
 */
export function filmSourcePathDiagnostic(
  error: unknown
): IAutoMovieDiagnostic { return ({
  code:
    error instanceof AutoMovieProductionSourcePathError &&
    error.reason === "outside-root"
      ? "source-path-outside-root"
      : "source-path-missing",
  category: "error",
  phase: "source",
  target: "film",
  path: FILM_SOURCE_PATH,
  message: `${errorMessage(error)} Export "${FILM_SOURCE_EXPORT}" with build(context) from ${FILM_SOURCE_PATH}.`,
}); }
