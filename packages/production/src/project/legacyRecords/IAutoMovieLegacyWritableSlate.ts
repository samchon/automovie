import type { IAutoMovieSequence } from "@automovie/interface";
import type { IAutoMovieLegacyStoredSlate } from "./IAutoMovieLegacyStoredSlate";

/**
 * Writable slate the v1 store committed.
 *
 * @evidence contracts/common.md#principled-implementation Extending the stored slate makes the film slot required while allowing null before assembly, so complete writable state distinguishes no film from an omitted read-only slot.
 * @evidence contracts/common.md#clear-and-simple-design AutoMovieProject writableSlate and saveSlate own complete state observation and transactional persistence; this declaration adds only that slot requirement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null does not become a fabricated sequence and inherited slice validation remains with the store owner.
 * @evidence contracts/common.md#meaningful-documentation States writable film presence and null before cut assembly.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Requiring the film slot performs no sequence validation or atomic publication; saveSlate owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A writable value proposes complete state instead of sharing an already committed transaction result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Writable state owns the nullable film and inherited slices without starting a publication task itself.
 * @author Samchon
 */
export interface IAutoMovieLegacyWritableSlate extends IAutoMovieLegacyStoredSlate {
  /**
   * Assembled film, or null before CUT has committed.
   */
  film: IAutoMovieSequence | null;
}
