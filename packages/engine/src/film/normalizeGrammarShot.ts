import {
  AutoMovieGrammarStyleIntent,
  type IAutoMovieGrammarCameraObservation,
  type IAutoMovieGrammarShotObservation,
  type IAutoMovieGrammarSubjectObservation,
  type IAutoMovieNormalizedGrammarShot,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";
import { assertGrammarPositive } from "./assertGrammarPositive";

/**
 * Validates one shot observation and returns it in the canonical form the
 * film-grammar read inspects.
 *
 * Throws an `Error` naming the offending field at the first defect, in this
 * order: a duration that is not finite and positive; at each camera boundary,
 * a field of view outside `(0, 180)`, an aspect that is not finite and
 * positive, or a non-finite or missing position or rotation component; then per
 * subject in id order, a repeated id, a non-finite or missing point component,
 * a height that is not finite and positive, a radius that is negative or not
 * finite, or a non-finite eyeline point; a primary subject that is not
 * observed; an action axis that repeats or misses an observed subject; and repeated style intents.
 *
 * @param input One observed shot as the production grammar pass built it.
 * @returns A new record whose subjects are sorted and indexed by id and whose
 *   axis endpoints are sorted; the camera and subject objects are shared with
 *   `input`, not copied.
 */
export function normalizeGrammarShot(
  input: IAutoMovieGrammarShotObservation,
): IAutoMovieNormalizedGrammarShot {
  assertGrammarPositive(input.duration, `${input.id}.duration`);
  for (const boundary of ["start", "end"] as const) {
    const camera: IAutoMovieGrammarCameraObservation = input.camera[boundary];
    const path: string = `${input.id}.camera.${boundary}`;
    assertGrammarPositive(camera.fovY, `${path}.fovY`);
    if (camera.fovY >= 180) throw new Error(`${path}.fovY must be below 180.`);
    assertGrammarPositive(camera.aspect, `${path}.aspect`);
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
    if (subjectById.has(subject.id))
      throw new Error(
        `Film grammar subject id "${subject.id}" is duplicated in "${input.id}".`,
      );
    subjectById.set(subject.id, subject);
    const path: string = `${input.id}.${subject.id}`;
    assertGrammarPositive(subject.height, `${path}.height`);
    if (subject.radius < 0)
      throw new Error(`${path}.radius must be finite and non-negative.`);
    if (subject.eyeline !== null) {
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

