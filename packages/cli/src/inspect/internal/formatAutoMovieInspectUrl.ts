import type { AutoMovieCliInspectTypes } from "../AutoMovieCliInspectTypes";

/**
 * The address of a served inspector page that opens on a request: the page's
 * base address with the request's named text values as its query.
 *
 * `values` are the pairs `formatAutoMovieCapturePlanRequest` writes, in its
 * order; they are joined by `URLSearchParams`, which the page reads back with
 * the same decoder. The request that asks for nothing is the base address
 * alone.
 */
export function formatAutoMovieInspectUrl(
  base: string,
  values: readonly AutoMovieCliInspectTypes.QueryPair[],
): string {
  const query: string = new URLSearchParams(
    values.map(([key, value]: readonly [string, string]): [string, string] => [
      key,
      value,
    ]),
  ).toString();
  return query === "" ? base : `${base}?${query}`;
}
