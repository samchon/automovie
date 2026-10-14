import { ViolationCollector } from "./ViolationCollector";

/**
 * Report each reference in a list that resolves to no declared id or repeats
 * an earlier one.
 *
 * Reference `i` is checked at `<path>[i]`: one that is not in `targets` gets a
 * `type` violation `<label> "<id>" does not resolve`, and one equal to an
 * earlier entry gets a `type` violation `<label> "<id>" is duplicated`. A
 * reference that is both gets both.
 *
 * @param references Referenced ids, in authored order.
 * @param targets Ids the references may name, usually from
 *   {@link collectDeclaredIds}.
 * @param path Violation path of the reference list itself.
 * @param label Name of the referenced record in the messages.
 * @param collector Sink that receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation Membership in the target set decides resolution exactly, and a second set of references seen so far decides repetition, both by string equality.
 * @evidence contracts/common.md#clear-and-simple-design The reference rule the building, lineage and design-reference validators each kept as an identical private `validateReferences`, now one helper beside `collectDeclaredIds`, whose set it reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No record kind or id is special-cased; the label only names the target in the message.
 * @evidence contracts/common.md#meaningful-documentation The documentation states both violation kinds with their paths and messages, that one reference may get both, and where the targets usually come from.
 * @evidence contracts/performance.md#efficient-algorithms O(n) expected time and space for n references, one set lookup and insertion each.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call judges one reference list against a target set the caller computed once and passes to every list.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The seen set is local and released on return; at most two violations per reference are appended to the caller's collector.
 */
export const validateDeclaredReferences = (
  references: readonly string[],
  targets: ReadonlySet<string>,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  const seen: Set<string> = new Set();
  references.forEach((reference: string, index: number): void => {
    if (!targets.has(reference))
      collector.push(
        "type",
        `${path}[${index}]`,
        `${label} "${reference}" does not resolve`,
        reference,
      );
    if (seen.has(reference))
      collector.push(
        "type",
        `${path}[${index}]`,
        `${label} "${reference}" is duplicated`,
        reference,
      );
    seen.add(reference);
  });
};
