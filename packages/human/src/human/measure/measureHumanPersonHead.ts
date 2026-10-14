import { HUMAN_HEAD_MEASUREMENTS } from "../../common/measure/HUMAN_HEAD_MEASUREMENTS";
import type { IAutoMovieHumanHeadReading } from "../../common/measure/IAutoMovieHumanHeadReading";
import { readHumanHeadMeasurement } from "../../common/measure/readHumanHeadMeasurement";
import type { IAutoMovieHumanPersonCompiledGeneration } from "../structures/IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import { readHumanPersonRestHead } from "./readHumanPersonRestHead";

/**
 * Read every registered head rule on one source-rest skin evaluation, keyed by rule name, retaining metre values and actual instrument marker points. Missing named source points/areas or an unreadable instrument refuse through their existing owners. The rest shortcut omits full build contact/closure stages and does not certify equal full-neutral geometry, clinical applicability or current rendered appearance.
 *
 * @evidence contracts/common.md#principled-implementation One actual source-rest head and the existing registered head instruments produce each rule's named metre reading/marker receipt.
 * @evidence contracts/common.md#clear-and-simple-design This aggregate evaluates head skin once and delegates each instrument; source-rest generation and measurement geometry remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing source acquisitions refuse without a proxy point or target substitution; shortcut geometry supplies no unobserved full-build or clinical guarantee.
 * @evidence contracts/common.md#meaningful-documentation Prose states rule-keyed metres/markers, single rest evaluation and actual missing-source/validation boundaries.
 * @evidence contracts/performance.md#efficient-algorithms One rest evaluation precedes the sum of all registered instrument costs and an O(rule count) result dictionary.
 * @evidence contracts/performance.md#reuse-equivalent-work Every registered head rule shares one evaluated head coordinate population rather than constructing its own source-rest skin.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned readings/markers belong to the caller; evaluated head buffers and rule iteration state are call-local with no persistent source task or cache.
 */
export function measureHumanPersonHead(
  compiled: IAutoMovieHumanPersonCompiledGeneration,
  document: IAutoMovieHumanPersonDocument,
): Record<string, IAutoMovieHumanHeadReading> {
  const head: ReturnType<typeof readHumanPersonRestHead> =
    readHumanPersonRestHead(compiled, document);
  const readings: Record<string, IAutoMovieHumanHeadReading> = {};
  for (const [name, rule] of Object.entries(HUMAN_HEAD_MEASUREMENTS))
    readings[name] = readHumanHeadMeasurement(head, rule);
  return readings;
}
