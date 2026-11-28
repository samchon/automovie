import { AutoMovieViewerInspector } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieViewerInspector.createAddressWriter` replaces the page address's query
 * with the inspector's text, keeping its path and hash, and only when it
 * changes.
 *
 * Scenarios:
 *
 * 1. Text `shade=depth` on `/draw` with hash `#t` replaces the state with
 *    `/draw?shade=depth#t`.
 * 2. The same text again writes nothing.
 * 3. The empty text clears the query.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when history is updated and what the URL retains.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the writer with a recording interface, repeats an address and clears its query, then reads all writes in order.
 * @evidence contracts/development/testing.md#independent-expectations A fixed /draw location and #t fragment remain in both expected URLs. Adding depth contributes one query and clearing restores the original path and fragment.
 */
export function test_viewer_inspector_address_writer(): void {
  const writes: string[] = [];
  const location: { pathname: string; search: string; hash: string } = {
    pathname: "/draw",
    search: "",
    hash: "#t",
  };
  const write: (text: string) => void = AutoMovieViewerInspector.createAddressWriter({
    location,
    history: {
      state: null,
      replaceState: (_state: unknown, _title: string, url?: string | URL | null): void => {
        writes.push(String(url));
        const query: number = String(url).indexOf("?");
        location.search =
          query < 0 ? "" : String(url).slice(query, String(url).indexOf("#"));
      },
    },
  });
  write("shade=depth");
  write("shade=depth");
  TestValidator.equals("written once", writes, ["/draw?shade=depth#t"]);
  write("");
  TestValidator.equals("cleared", writes, ["/draw?shade=depth#t", "/draw#t"]);
}