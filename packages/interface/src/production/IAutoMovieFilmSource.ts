import { IAutoMovieFilmBuildContext } from "./IAutoMovieFilmBuildContext";
import { IAutoMovieFilmEdit } from "./IAutoMovieFilmEdit";

/**
 * Synchronous film module export authored against the builder's admitted context.
 *
 * @evidence contracts/common.md#principled-implementation The resident Node export's synchronous build method returns an authored edit that the builder validates before timeline assembly and publication; the signature establishes neither isolated execution nor deterministic ambient effects.
 * @evidence contracts/common.md#clear-and-simple-design A single build entry separates authored composition from compiler-owned source loading, validation and timeline materialization, without exposing project mutation or renderer services.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Returned media bytes cannot replace the edit schema, and thenable results refuse; synchronous ordinary Node execution can still read ambient state or cause effects, so deterministic source behavior remains the author's responsibility.
 * @evidence contracts/common.md#meaningful-documentation States resident module ownership, admitted borrowed context and synchronous edit output, including the absence of a runtime sandbox or deep-freeze guarantee.
 * @author Samchon
 */
export interface IAutoMovieFilmSource {
  /**
   * Compose one finished-film edit from current design and admitted inputs.
   *
   * @evidence contracts/common.md#principled-implementation Receives current production and shot records and returns source-owned video order and timed tracks; buildFilmEdit checks the returned schema before frame-grid assembly. The callback executes on its resident module receiver in ordinary Node.
   * @evidence contracts/common.md#clear-and-simple-design One explicit context parameter supplies the entire authoring basis and one return value supplies composition, keeping source code independent of compiler mutation and publication sequencing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A Promise-like return is refused instead of awaited, but synchronous code can access host state and shared aliases; the method contract does not certify determinism or prohibit every external effect at runtime.
   * @evidence contracts/common.md#meaningful-documentation Defines the current borrowed input basis, synchronous finished-film edit output, receiver semantics and the remaining author responsibility for deterministic execution.
   */
  build(context: IAutoMovieFilmBuildContext): IAutoMovieFilmEdit;
}
