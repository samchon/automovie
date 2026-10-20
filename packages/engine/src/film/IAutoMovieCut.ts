import {
  IAutoMovieConstraintViolation,
  IAutoMovieSequence,
} from "@automovie/interface";

/**
 * What `cutSequence` returns for one edit plan: the {@link IAutoMovieSequence}
 * the ASSEMBLE stage edited, or every contradiction that stopped it.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on the literal `success`, so a caller cannot read a sequence from a refused cut without narrowing first; `cutSequence` checks every entry before choosing a branch, so the failure branch carries the whole list rather than the first fault.
 * @evidence contracts/common.md#clear-and-simple-design Two branches, the playable cut with its runtime and the violation list for the correction round, which is the same success-or-violations shape every engine stage gate returns.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The union adds no partial-success state: a cut with any violation emits no sequence, so a renderer never receives an edit the gate refused.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the stage it serves, and that the failure branch lists every contradiction rather than the first.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type with no runtime body; the single pass over shots and entries is answered on `cutSequence`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call builds a fresh result and nothing caches cuts across edit plans.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns only the branch it carries; retention of each branch is stated on its member interface.
 */
export type IAutoMovieCut = IAutoMovieCut.ISuccess | IAutoMovieCut.IFailure;

export namespace IAutoMovieCut {
  /**
   * Every gate held: each entry names a built shot, each trim is a positive
   * span inside its shot, each transition fits inside both neighbours' played
   * spans without overlapping the previous entry's own incoming transition,
   * ids are non-blank, and the frame rate is finite and positive.
   *
   * @evidence contracts/common.md#principled-implementation `runtime` is the sum of played spans minus the sum of transition durations, the overlap arithmetic `sequenceTimeline` replays entry by entry, so the cut's runtime and the playback timeline's runtime agree for the same sequence.
   * @evidence contracts/common.md#clear-and-simple-design Carries the sequence the renderer plays and the one number every caller asks of it, so a consumer does not rebuild the timeline only to learn the running time.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The sequence copies the plan's entries field by field with no reordering, trimming or default transition, so the cut plays exactly what the editor authored.
   * @evidence contracts/common.md#meaningful-documentation States every gate the success branch certifies, that the sequence is ready for the renderer, and how runtime is computed and in which unit.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record; `cutSequence` fills it after one pass over the entries.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh value per call; the playground keeps the success branch beside its compiled film, and nothing shares it across plans.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The sequence holds new entry records that still reference the plan's `trim` and `transition` objects; it is released with the caller's result.
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
   * @evidence contracts/common.md#principled-implementation Violations are accumulated by `ViolationCollector` across the whole plan, and an entry whose shot is missing or whose span is invalid resets the neighbour state, so one fault does not cascade into false transition reports on the next entry.
   * @evidence contracts/common.md#clear-and-simple-design The list is the only payload because a refused cut has nothing playable to return, and each violation already carries its kind, path and measured excess.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No violation is dropped or deduplicated by message, and a duplicate shot id is reported on the shot list path rather than silently resolved to one of the duplicates.
   * @evidence contracts/common.md#meaningful-documentation States that no sequence exists on this branch and that the list holds every violation found, with paths into the plan or the shot list.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record; the violations are pushed during the producer's single pass.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built fresh per call for one correction round and never cached.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns the violation array, whose `actual` values may reference the plan's trim or transition objects; one violation per failed check bounds it by the entry and shot counts.
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
