import { IAutoMovieVisualDeliveryOccurrence } from "./IAutoMovieVisualDeliveryOccurrence";
import { productionRepaintLaneIsExactText } from "./productionRepaintLaneIsExactText";

/**
 * Refuse duplicate occurrence IDs or inexact occurrence/shot text before position-based lane joins. Repeated shots are supported; malformed nonrecord rows can throw under the typed-array premise.
 *
 * @evidence contracts/common.md#principled-implementation Set cardinality checks occurrence uniqueness, then exact-text predicates admit both identity fields without collapsing repeated shots.
 * @evidence contracts/common.md#clear-and-simple-design One population predicate serves timeline and lane arrays before source/policy work begins.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shot repetition is not treated as duplication, and no normalization manufactures an exact identity from padded text.
 * @evidence contracts/common.md#meaningful-documentation Prose gives duplicate-versus-inexact meaning and the typed-record access premise.
 * @evidence contracts/performance.md#efficient-algorithms Mapping/Set and at most one text scan pass cost O(N+total identity text) with O(N) identity storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One Set cardinality serves uniqueness for this population; mutable arrays are not cached across planner calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary mapped IDs/Set expire and only a boolean escapes; neither population is retained.
 */
export const productionRepaintLaneDuplicateOccurrences: (values: readonly IAutoMovieVisualDeliveryOccurrence[]) => boolean = (
  values: readonly IAutoMovieVisualDeliveryOccurrence[],
): boolean =>
  new Set(values.map((value: IAutoMovieVisualDeliveryOccurrence): string => value.occurrence)).size !== values.length ||
  values.some(
    (value: IAutoMovieVisualDeliveryOccurrence): boolean => !productionRepaintLaneIsExactText(value.occurrence) || !productionRepaintLaneIsExactText(value.shot),
  );
