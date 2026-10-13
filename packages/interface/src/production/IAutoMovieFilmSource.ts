import { IAutoMovieFilmBuildContext } from "./IAutoMovieFilmBuildContext";
import { IAutoMovieFilmEdit } from "./IAutoMovieFilmEdit";

/**
 * Deterministic film module export authored against the builder's frozen context.
 *
 * @evidence contracts/common.md#principled-implementation One synchronous build method maps the admitted film context to the exact authored edit, which the source sandbox validates before frame-clock normalization and atomic generated publication.
 * @evidence contracts/common.md#clear-and-simple-design A single build entry separates authored composition from compiler-owned source loading, validation and timeline materialization, without exposing project mutation or renderer services.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Film authoring cannot substitute delivered video bytes for an edit or select undeclared assets through hidden host access; all supported inputs arrive through the deterministic context.
 * @evidence contracts/common.md#meaningful-documentation States deterministic module ownership, frozen input context and synchronous production of an authored edit rather than generated media.
 * @author Samchon
 */
export interface IAutoMovieFilmSource {
  /**
   * Compose one finished-film edit from frozen current design and verified inputs.
   *
   * @evidence contracts/common.md#principled-implementation Receives the exact current production and shot registry and returns the source-owned video order and timed tracks; the sandbox checks the edit schema before assembly measures its exact frame grid.
   * @evidence contracts/common.md#clear-and-simple-design One explicit context parameter supplies the entire authoring basis and one return value supplies composition, keeping source code independent of compiler mutation and publication sequencing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This method has no asynchronous provider or capture channel, so its result remains deterministic source output rather than externally sampled media hidden inside compilation.
   * @evidence contracts/common.md#meaningful-documentation Defines the frozen design and verified-input basis and the finished-film edit output owned by this authoring entry.
   */
  build(context: IAutoMovieFilmBuildContext): IAutoMovieFilmEdit;
}
