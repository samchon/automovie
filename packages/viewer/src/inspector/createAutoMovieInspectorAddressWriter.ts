/**
 * Build an `onRequestChange` listener that keeps a page's address equal to the
 * inspector's request, writing through the `history` and `location` the host
 * passes.
 *
 * Each text the inspector reports, as `formatAutoMovieInspectorAddress` writes
 * it, becomes the address's query: the path and the fragment are kept, the
 * empty request clears the query, and `history.replaceState` writes it with the
 * entry's own state, so editing the request adds no history entry. A text equal
 * to the current query writes nothing. The library reaches no global: a host
 * that passes no listener keeps its address untouched.
 *
 * ```ts
 * const onRequestChange = createAutoMovieInspectorAddressWriter({
 *   location,
 *   history,
 * });
 * ```
 */
export function createAutoMovieInspectorAddressWriter(props: {
  /** The page's location, read for the current path, query and fragment. */
  location: Pick<Location, "pathname" | "search" | "hash">;

  /** The page's history, whose current entry's address is replaced. */
  history: Pick<History, "replaceState" | "state">;
}): (text: string) => void {
  return (text: string): void => {
    const search: string = text === "" ? "" : `?${text}`;
    if (search === props.location.search) return;
    props.history.replaceState(
      props.history.state,
      "",
      `${props.location.pathname}${search}${props.location.hash}`,
    );
  };
}
