import {
  IAutoMovieReviewNote,
  IAutoMovieScript,
  IAutoMovieShotReviewWrite,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { collectNonEmptyId } from "../validation/collectNonEmptyId";
import { IAutoMovieShotReview } from "./IAutoMovieShotReview";

/**
 * The REVIEW consumer: turn a reviewer's write into the verdict the
 * re-perform loop runs on, or every reason the write is unusable.
 *
 * The checks keep the loop closed. The script's beat ids must be unique, so
 * the judged beat names one beat. The judged beat must be a non-blank string
 * declared in the script. A `revise` must carry at least one note, or the next
 * round has nothing to fix and the loop would spin; a `pass` must carry none,
 * because notes are the open backlog and passing declares it empty. Every
 * note's beat must be a non-blank string equal to the judged beat, because a
 * misfiled note would be pulled by the wrong beat's revise pass and starve the
 * right one. Every note's `issue` and `suggestion` must be non-blank strings,
 * because they are what the next round acts on, and the stored slate refuses
 * a blank one on load. Violations are reported together, at
 * `$script.beats[i].id`, `$input.beat`, `$input.notes`,
 * `$input.notes[i].beat`, `$input.notes[i].issue` and
 * `$input.notes[i].suggestion`.
 *
 * @param script The screenplay whose beats a review may judge.
 * @param review The reviewer's write.
 * @returns The judged beat, verdict and notes, or every violation.
 *
 * @evidence contracts/common.md#principled-implementation Each rule is a consistency condition of the review loop stated in the documentation, checked against the script's declared beats through an id index; all violations are collected before deciding, so one correction round sees every fault, and ids are checked with the shared `collectNonEmptyId`, which also reports a non-string id instead of throwing on it; note prose is checked by type and trimmed length the same way, without the id wording.
 * @evidence contracts/common.md#clear-and-simple-design One validator per stage write, returning the same success-or-violations shape as the other film stage gates; the blank-id rule and its wording come from the shared helper instead of a private copy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No beat, tier or verdict wording is special-cased; the verdict and notes are returned as written, without trimming or reordering.
 * @evidence contracts/common.md#meaningful-documentation States every rule with the loop failure it prevents, that violations are reported together, and the paths they are reported at.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the B script beats to index them and one pass over the N notes, O(B + N) with constant-time membership tests.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Validates one write against one script per call; the script changes between rounds, so an index kept across calls would need invalidation the caller does not provide.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The beat index and collector are released on return; a success shares the write's own notes array, and a failure owns its violation list, at most one per beat plus three plus four per note.
 */
export const reviewShot = (
  script: IAutoMovieScript,
  review: IAutoMovieShotReviewWrite,
): IAutoMovieShotReview => {
  const out: ViolationCollector = new ViolationCollector();
  const beatById: Map<string, number> = new Map();
  script.beats.forEach(
    (beat: IAutoMovieScript["beats"][number], index: number): void => {
      const existing: number | undefined = beatById.get(beat.id);
      if (existing !== undefined) {
        out.push(
          "type",
          `$script.beats[${index}].id`,
          `script beat id "${beat.id}" is duplicated; first declared at $script.beats[${existing}].id`,
          beat.id,
        );
        return;
      }
      beatById.set(beat.id, index);
    },
  );

  collectNonEmptyId(review.beat, "$input.beat", "review beat id", out);
  if (!beatById.has(review.beat))
    out.push(
      "type",
      "$input.beat",
      `beat "${review.beat}" must be one of the script's beats`,
      review.beat,
    );

  if (review.verdict === "revise" && review.notes.length === 0)
    out.push(
      "type",
      "$input.notes",
      "a revise verdict must carry at least one note, the next round needs something to fix",
      review.notes,
    );
  if (review.verdict === "pass" && review.notes.length > 0)
    out.push(
      "type",
      "$input.notes",
      "a pass verdict must carry no open notes, passing declares the backlog empty",
      review.notes,
    );

  review.notes.forEach((note: IAutoMovieReviewNote, i: number): void => {
    collectNonEmptyId(
      note.beat,
      `$input.notes[${i}].beat`,
      "review note beat id",
      out,
    );
    if (note.beat !== review.beat)
      out.push(
        "type",
        `$input.notes[${i}].beat`,
        `note filed on "${note.beat}" but this review judges "${review.beat}"`,
        note.beat,
      );
    for (const field of ["issue", "suggestion"] as const) {
      const text: unknown = note[field];
      if (typeof text !== "string" || text.trim().length === 0)
        out.push(
          "type",
          `$input.notes[${i}].${field}`,
          `review note ${field} must be non-empty text, the next round acts on it`,
          text,
        );
    }
  });

  return out.items.length > 0
    ? { success: false, violations: out.items }
    : {
        success: true,
        beat: review.beat,
        verdict: review.verdict,
        notes: review.notes,
      };
};
