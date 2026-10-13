import {
  AutoMovieGrammarStyleIntent,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { IAutoMovieGrammarCameraObservation } from "./IAutoMovieGrammarCameraObservation";
import { IAutoMovieGrammarShotObservation } from "./IAutoMovieGrammarShotObservation";
import { IAutoMovieGrammarSubjectObservation } from "./IAutoMovieGrammarSubjectObservation";
import { IAutoMovieNormalizedGrammarShot } from "./IAutoMovieNormalizedGrammarShot";
import { assertGrammarPositive } from "./assertGrammarPositive";

/**
 * Validates one shot observation and returns it in the canonical form the
 * film-grammar read inspects.
 *
 * Throws an `Error` naming the offending field at the first defect, in this
 * order: a blank shot id; a duration that is not finite and positive; at each
 * camera boundary, a field of view outside `(0, 180)`, an aspect that is not
 * finite and positive, or a non-finite or missing position or rotation
 * component; then per subject in id order, a blank or repeated id, a non-finite
 * or missing point component, a height that is not finite and positive, a
 * radius that is negative or not finite, or a blank eyeline target or
 * non-finite eyeline point; a primary subject that is not observed; an action
 * axis that repeats or misses an observed subject; and repeated style intents.
 *
 * @param input One observed shot as the production grammar pass built it.
 * @returns A new record whose subjects are sorted and indexed by id and whose
 *   axis endpoints are sorted; the camera and subject objects are shared with
 *   `input`, not copied.
 *
 * @evidence contracts/common.md#principled-implementation Each component is read by name, `x`, `y`, `z` and `w`, so a missing component is refused as non-finite rather than skipped as an absent key would be by `Object.entries`; subjects are sorted with the locale-independent `compareCodeUnits`, and the axis is stored as an unordered pair by the same comparison, so producer order cannot reach any finding.
 * @evidence contracts/common.md#clear-and-simple-design Validation and canonical ordering of one shot live together because the duplicate-id test and the index are the same pass; `readFilmGrammar` only inspects already-normalized shots and owns the cross-shot checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shot, subject or intent is special-cased, nothing is clamped or defaulted except an absent `styleIntent`, which the observation documents as none, and the first defect throws instead of being repaired.
 * @evidence contracts/common.md#meaningful-documentation States the throw condition of every field in check order, what the result canonicalizes, and that camera and subject objects are shared with the input.
 * @evidence contracts/performance.md#efficient-algorithms Dominated by the `O(n log n)` sort of the shot's `n` subjects; the duplicate test, the index and every field check are one linear pass, and the index is built here once so no later check rebuilds it.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure transform of one observation; reuse of its output across the read's checks is answered on `readFilmGrammar`.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates one sorted subject array, one map with an entry per subject and one intent array, all owned by the returned record; nothing is retained after return.
 */
export function normalizeGrammarShot (
  input: IAutoMovieGrammarShotObservation,
): IAutoMovieNormalizedGrammarShot {
  nonBlank(input.id, "shot.id");
  assertGrammarPositive(input.duration, `${input.id}.duration`);
  for (const boundary of ["start", "end"] as const) {
    const camera: IAutoMovieGrammarCameraObservation = input.camera[boundary];
    const path: string = `${input.id}.camera.${boundary}`;
    assertGrammarPositive(camera.fovY, `${path}.fovY`);
    if (camera.fovY >= 180) throw new Error(`${path}.fovY must be below 180.`);
    assertGrammarPositive(camera.aspect, `${path}.aspect`);
    finiteVector(camera.position, `${path}.position`);
    finiteQuaternion(camera.rotation, `${path}.rotation`);
  }

  const subjects: IAutoMovieGrammarSubjectObservation[] = [
    ...input.subjects,
  ].sort(
    (
      a: IAutoMovieGrammarSubjectObservation,
      b: IAutoMovieGrammarSubjectObservation,
    ): number => compareCodeUnits(a.id, b.id),
  );
  const subjectById: Map<string, IAutoMovieGrammarSubjectObservation> =
    new Map();
  for (const subject of subjects) {
    nonBlank(subject.id, `${input.id}.subjects.id`);
    if (subjectById.has(subject.id))
      throw new Error(
        `Film grammar subject id "${subject.id}" is duplicated in "${input.id}".`,
      );
    subjectById.set(subject.id, subject);
    const path: string = `${input.id}.${subject.id}`;
    finiteVector(subject.start, `${path}.start`);
    finiteVector(subject.end, `${path}.end`);
    assertGrammarPositive(subject.height, `${path}.height`);
    if (Number.isFinite(subject.radius) === false || subject.radius < 0)
      throw new Error(`${path}.radius must be finite and non-negative.`);
    if (subject.eyeline !== null) {
      nonBlank(subject.eyeline.target, `${path}.eyeline.target`);
      finiteVector(subject.eyeline.start, `${path}.eyeline.start`);
      finiteVector(subject.eyeline.end, `${path}.eyeline.end`);
    }
  }
  if (
    input.primarySubject !== null &&
    subjectById.has(input.primarySubject) === false
  )
    throw new Error(
      `Primary subject "${input.primarySubject}" is absent from "${input.id}".`,
    );
  let actionAxis: readonly [string, string] | null = null;
  if (input.actionAxis !== null) {
    const [first, second]: readonly [string, string] = input.actionAxis;
    if (first === second)
      throw new Error(`Action axis in "${input.id}" repeats "${first}".`);
    if (subjectById.has(first) === false || subjectById.has(second) === false)
      throw new Error(
        `Action axis in "${input.id}" must reference two observed subjects.`,
      );
    actionAxis =
      compareCodeUnits(first, second) <= 0 ? [first, second] : [second, first];
  }
  const styleIntent: AutoMovieGrammarStyleIntent[] = [
    ...(input.styleIntent ?? []),
  ];
  if (new Set(styleIntent).size !== styleIntent.length)
    throw new Error(`styleIntent in "${input.id}" must be unique.`);
  return { ...input, subjects, subjectById, actionAxis, styleIntent };
}

/** Throws unless the string carries a non-whitespace character. */
function nonBlank (value: string, path: string): void {
  if (value.trim().length === 0) throw new Error(`${path} must be non-blank.`);
}

/** Throws at the first of `x`, `y`, `z` that is missing or not finite. */
function finiteVector (value: IAutoMovieVector3, path: string): void {
  for (const key of ["x", "y", "z"] as const)
    if (Number.isFinite(value[key]) === false)
      throw new Error(`${path}.${key} must be finite.`);
}

/** Throws at the first of `x`, `y`, `z`, `w` that is missing or not finite. */
function finiteQuaternion (value: IAutoMovieQuaternion, path: string): void {
  for (const key of ["x", "y", "z", "w"] as const)
    if (Number.isFinite(value[key]) === false)
      throw new Error(`${path}.${key} must be finite.`);
}
