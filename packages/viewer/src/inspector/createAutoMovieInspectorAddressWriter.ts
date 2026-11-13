/**
 * Build an `onRequestChange` listener that keeps a page's address equal to the inspector's request, writing through the `history` and `location` the host passes.
 *
 * Each text the inspector reports, as `formatAutoMovieInspectorAddress` writes it, becomes the address's query: the path and the fragment are kept, the empty request clears the query, and `history.replaceState` writes it with the entry's own state, so editing the request adds no history entry. A text equal to the current query writes nothing. The library reaches no global: a host that passes no listener keeps its address untouched.
 *
 * ```ts
 * const onRequestChange = createAutoMovieInspectorAddressWriter({ location, history });
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what becomes of each text, what is kept, the empty and unchanged cases, why history gains no entry, and that nothing global is reached.
 * @evidence contracts/development/implementation.md#principled-implementation `replaceState` changes the current entry's URL without navigating or adding an entry, and `location.search` is `?` plus the query, or empty, which the comparison mirrors.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One closure over the two injected objects.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No `window` is read; the host's objects are the only ones written.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work plus the length of the address per call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work An unchanged query is not written again, which the inspector's report at mount relies on.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the two borrowed objects for as long as the listener lives; nothing else.
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
