import type { IAutoMovieViolationAppendSink } from "@automovie/interface";

/*
 * Collect the ids a list of records declares, reporting each repeated one.
 *
 * Each record's id is checked at `<path>[<index>].id`: an id already seen
 * earlier in the list gets a `type` violation `<label> id "<id>" must be
 * unique` on the later record. Every id, repeated included, is in the returned
 * set,
 * so references to it resolve and the one defect is reported once, on the
 * declaration.
 * Parameter records: Records in declaration order.
 * Parameter path: Violation path of the list itself, such as `$input.spaces`.
 * Parameter label: Name of one record in the messages, such as `logical space`.
 * Parameter collector: Sink that receives the violations.
 * Returns: The set of declared ids, for resolving references.
 */
export const collectDeclaredIds = <Declared extends { id: string }>(
  records: readonly Declared[],
  path: string,
  label: string,
  collector: IAutoMovieViolationAppendSink,
): Set<string> => {
  const ids: Set<string> = new Set();
  records.forEach((record: Declared, index: number): void => {
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
