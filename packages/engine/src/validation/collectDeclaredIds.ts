import { ViolationCollector } from "./ViolationCollector";

/**
 * Collect the ids a list of records declares, reporting each blank or
 * repeated one.
 *
 * Each record's id is checked at `<path>[<index>].id`: a blank id gets a `type`
 * violation `<label> id must be non-empty`, and an id already seen earlier in
 * the list gets a `type` violation `<label> id "<id>" must be unique` on the
 * later record. Every id, blank or repeated included, is in the returned set,
 * so references to it resolve and the one defect is reported once, on the
 * declaration.
 *
 * @param records Records in declaration order.
 * @param path Violation path of the list itself, such as `$input.spaces`.
 * @param label Name of one record in the messages, such as `logical space`.
 * @param collector Sink that receives the violations.
 * @returns The set of declared ids, for resolving references.
 *
 * @evidence contracts/common.md#principled-implementation One pass with a hash set decides uniqueness exactly by string equality, and blankness uses the collector's trim rule; returning every id, defective ones included, keeps a single defect from cascading into unresolved-reference reports.
 * @evidence contracts/common.md#clear-and-simple-design The declaration rule the building, lineage and design-reference validators each kept as an identical private `collectIds`, now one helper beside the collector they all write to.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No record kind or id is special-cased; the label only names the record in the message.
 * @evidence contracts/common.md#meaningful-documentation The documentation states both violation kinds with their paths and messages, which record a repeat is reported on, and why defective ids stay in the returned set.
 * @evidence contracts/performance.md#efficient-algorithms O(n) expected time and space for n records, one set insertion and lookup each, instead of a pairwise comparison.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call judges one list of one record; callers keep the returned set and reuse it for every reference into that list.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a set bounded by the record count, which the caller owns, and appends at most two violations per record to the collector; nothing else is retained.
 */
export const collectDeclaredIds = <Declared extends { id: string }>(
  records: readonly Declared[],
  path: string,
  label: string,
  collector: ViolationCollector,
): Set<string> => {
  const ids: Set<string> = new Set();
  records.forEach((record: Declared, index: number): void => {
    collector.nonEmpty(`${path}[${index}].id`, record.id, `${label} id`);
    if (ids.has(record.id))
      collector.push(
        "type",
        `${path}[${index}].id`,
        `${label} id "${record.id}" must be unique`,
        record.id,
      );
    ids.add(record.id);
  });
  return ids;
};
