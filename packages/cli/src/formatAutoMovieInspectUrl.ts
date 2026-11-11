/**
 * The address of a served inspector page that opens on a request: the page's base address with the request's named text values as its query.
 *
 * `values` are the pairs `formatAutoMovieCapturePlanRequest` writes, in its order; they are joined by `URLSearchParams`, which the page reads back with the same decoder. The request that asks for nothing is the base address alone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the address holds, where the pairs come from, how they are encoded and the empty case.
 * @evidence contracts/development/implementation.md#principled-implementation `URLSearchParams` writes `application/x-www-form-urlencoded`, which the page's `URLSearchParams` decodes to the same pairs, so the page reads the request the command was given.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One encoding and one join.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No key is written here; the grammar's writer chose them.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the pairs' length.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh string and keeps nothing.
 */
export function formatAutoMovieInspectUrl(
  base: string,
  values: readonly (readonly [key: string, value: string])[],
): string {
  const query: string = new URLSearchParams(
    values.map(([key, value]: readonly [string, string]): [string, string] => [key, value]),
  ).toString();
  return query === "" ? base : `${base}?${query}`;
}
