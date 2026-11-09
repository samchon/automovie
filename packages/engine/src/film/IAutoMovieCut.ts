import {
  IAutoMovieConstraintViolation,
  IAutoMovieSequence,
} from "@automovie/interface";

/**
 * What `cutSequence` returns for one edit plan: the {@link IAutoMovieSequence}
 * the ASSEMBLE stage edited, or every contradiction that stopped it.
 *
 * @evidence contracts/development/design.md#principled-representation A discriminated union on the literal `success`, so a caller cannot read a sequence from a refused cut without narrowing first; `cutSequence` checks every entry before choosing a branch, so the failure branch carries the whole list rather than the first fault.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two branches, the playable cut with its runtime and the violation list for the correction round, which is the same success-or-violations shape every engine stage gate returns.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The union adds no partial-success state: a cut with any violation emits no sequence, so a renderer never receives an edit the gate refused.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, the stage it serves, and that the failure branch lists every contradiction rather than the first.
 */
export type IAutoMovieCut = IAutoMovieCut.ISuccess | IAutoMovieCut.IFailure;

export namespace IAutoMovieCut {
  /**
   * Every gate held: each entry names a built shot, each trim is a positive
   * span inside its shot, each transition fits inside both neighbours' played
   * spans without overlapping the previous entry's own incoming transition,
   * ids are non-blank, and the frame rate is finite and positive.
   *
   * @evidence contracts/development/design.md#principled-representation `runtime` is the sum of played spans minus the sum of transition durations, the overlap arithmetic `sequenceTimeline` replays entry by entry, so the cut's runtime and the playback timeline's runtime agree for the same sequence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carries the sequence the renderer plays and the one number every caller asks of it, so a consumer does not rebuild the timeline only to learn the running time.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The sequence copies the plan's entries field by field with no reordering, trimming or default transition, so the cut plays exactly what the editor authored.
   * @evidence contracts/development/common.md#meaningful-documentation States every gate the success branch certifies, that the sequence is ready for the renderer, and how runtime is computed and in which unit.
   */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /** The edited cut-list in plan order, ready for the renderer. */
    sequence: IAutoMovieSequence;

    /**
     * Output running time in seconds: each entry's trim duration, or its whole
     * shot duration when untrimmed, summed, minus every transition duration,
     * because a transition overlaps the previous entry's tail.
     */
    runtime: number;
  }

  /**
   * At least one gate failed; no sequence was emitted.
   *
   * @evidence contracts/development/design.md#principled-representation Violations are accumulated by `ViolationCollector` across the whole plan, and an entry whose shot is missing or whose span is invalid resets the neighbour state, so one fault does not cascade into false transition reports on the next entry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The list is the only payload because a refused cut has nothing playable to return, and each violation already carries its kind, path and measured excess.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No violation is dropped or deduplicated by message, and a duplicate shot id is reported on the shot list path rather than silently resolved to one of the duplicates.
   * @evidence contracts/development/common.md#meaningful-documentation States that no sequence exists on this branch and that the list holds every violation found, with paths into the plan or the shot list.
   */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /**
     * Every violation found, each with a path into the edit plan
     * (`$input.entries[i]...`) or the shot list (`$shots[i]...`).
     */
    violations: IAutoMovieConstraintViolation[];
  }
}
