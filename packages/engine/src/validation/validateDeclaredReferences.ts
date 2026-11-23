import type { IAutoMovieViolationCollector } from "@automovie/interface";

/**
 * Report each reference in a list that resolves to no declared id or repeats an
 * earlier one.
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
 */
export const validateDeclaredReferences = (
  references: readonly string[],
  targets: ReadonlySet<string>,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
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
