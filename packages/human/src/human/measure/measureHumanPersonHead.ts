import { HUMAN_HEAD_MEASUREMENTS } from "../../common/measure/HUMAN_HEAD_MEASUREMENTS";
import type { IAutoMovieHumanHeadReading } from "../../common/measure/IAutoMovieHumanHeadReading";
import { readHumanHeadMeasurement } from "../../common/measure/readHumanHeadMeasurement";
import type { IAutoMovieHumanPersonCompiledGeneration } from "../structures/IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import { readHumanPersonRestHead } from "./readHumanPersonRestHead";

/**
 * Measure a person's head with every rule of `HUMAN_HEAD_MEASUREMENTS`
 * on one evaluation of its skin at rest, keyed by the rule's name. A rule
 * whose points or areas the head view does not declare, or whose instrument
 * cannot read this skin, refuses by name; the caller sees which.
 */
export function measureHumanPersonHead(
  compiled: IAutoMovieHumanPersonCompiledGeneration,
  document: IAutoMovieHumanPersonDocument,
): Record<string, IAutoMovieHumanHeadReading> {
  const head = readHumanPersonRestHead(compiled, document);
  const readings: Record<string, IAutoMovieHumanHeadReading> = {};
  for (const [name, rule] of Object.entries(HUMAN_HEAD_MEASUREMENTS))
    readings[name] = readHumanHeadMeasurement(head, rule);
  return readings;
}
