import { HUMAN_PERSON_HEAD_MEASUREMENTS } from "../constants/HUMAN_PERSON_HEAD_MEASUREMENTS";
import type { IAutoMovieHumanPersonCompiledGeneration } from "../structures/IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonHeadReading } from "../structures/IAutoMovieHumanPersonHeadReading";
import { readHumanPersonHeadMeasurement } from "./readHumanPersonHeadMeasurement";
import { readHumanPersonRestHead } from "./readHumanPersonRestHead";

/**
 * Measure a person's head with every rule of `HUMAN_PERSON_HEAD_MEASUREMENTS`
 * on one evaluation of its skin at rest, keyed by the rule's name. A rule
 * whose points or areas the head view does not declare, or whose instrument
 * cannot read this skin, refuses by name; the caller sees which.
 *
 * @evidence contracts/common.md#principled-implementation Every head rule reads the same rest skin, evaluated once.
 * @evidence contracts/common.md#clear-and-simple-design One rest evaluation and one read per rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A rule that cannot be read refuses; no partial table is returned.
 * @evidence contracts/common.md#meaningful-documentation States the evaluation, the result keys and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions Readings are metres of the person frame at rest.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rules cite their protocols.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing; the rule's range is a report.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function measureHumanPersonHead(
  compiled: IAutoMovieHumanPersonCompiledGeneration,
  document: IAutoMovieHumanPersonDocument,
): Record<string, IAutoMovieHumanPersonHeadReading> {
  const head = readHumanPersonRestHead(compiled, document);
  const readings: Record<string, IAutoMovieHumanPersonHeadReading> = {};
  for (const [name, rule] of Object.entries(HUMAN_PERSON_HEAD_MEASUREMENTS))
    readings[name] = readHumanPersonHeadMeasurement(head, rule);
  return readings;
}
