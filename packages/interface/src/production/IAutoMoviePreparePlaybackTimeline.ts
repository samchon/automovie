import type { IAutoMovieShot } from "../cinematics/IAutoMovieShot";
import type { IAutoMoviePlaybackTimeline } from "./IAutoMoviePlaybackTimeline";

/**
 * Prepared output-clock layout and the supplied-shot identity index it uses.
 */
export namespace IAutoMoviePreparePlaybackTimeline {
  /**
   * Build a playback layout and the shot index its frame and event consumers share.
   *
   * The sequence must have passed cutSequence: trims and overlaps already fit their source spans. This preparation still refuses empty cuts, duplicate supplied shot ids, missing referenced shots and a first-entry transition. Extra supplied shots are indexed but do not add playback entries.
   *
   * @evidence contracts/development/design.md#principled-representation Timeline entries and runtime are output-clock seconds; trim offsets remain shot-local seconds. Preparation assumes cutSequence admitted trim and transition durations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface preparePlaybackTimeline shares this result between sequenceTimeline and sequenceEventTimeline so frame/event consumers use the same edit layout.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The index is readonly only through its type and retains original shot objects; no duplicate ids or missing referenced shots are silently resolved.
   * @evidence contracts/development/common.md#meaningful-documentation Prepared output-clock layout and the supplied-shot identity index it uses. Timeline entries and runtime are output-clock seconds; trim offsets remain shot-local seconds. Preparation assumes cutSequence admitted trim and transition durations.
   */
  export type IResult = {
    /**
     * New mutable playback entries and total runtime in output seconds. Entry starts subtract incoming transition duration from the prior cursor, so transition spans overlap.
     */
    timeline: IAutoMoviePlaybackTimeline;
    /**
     * New index of every supplied shot, including unused shots. Map values are new wrappers but shot references are borrowed; keep shots stable while consuming the prepared layout.
     */
    shotById: ReadonlyMap<
      string,
      {
        /**
         * Original supplied shot object, not a clone. Its id is the index key and its duration provides the untrimmed playback length.
         */
        shot: IAutoMovieShot;
        /**
         * Zero-based position in the supplied shots array, retained for diagnostics and event-source provenance; it is not a sequence-entry index.
         */
        index: number;
      }
    >;
  };
}
