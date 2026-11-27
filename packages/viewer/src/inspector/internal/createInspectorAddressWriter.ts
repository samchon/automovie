import type { AutoMovieViewerInspector } from "../AutoMovieViewerInspector";

/*
 * Keep a page's address query equal to inspector request text through the host's location and history.
 * The current path, hash and history state are preserved; unchanged text writes nothing and an empty
 * request clears the query. This touches no global state.
 */
export function createInspectorAddressWriter(
  props: AutoMovieViewerInspector.IAddressWriterProps,
): (text: string) => void {
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