import { createAutoMovieInspectorAddressWriter } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `createAutoMovieInspectorAddressWriter` replaces the page address's query
 * with the inspector's text, keeping its path and hash, and only when it
 * changes.
 *
 * Scenarios:
 *
 * 1. Text `shade=depth` on `/draw` with hash `#t` replaces the state with
 *    `/draw?shade=depth#t`.
 * 2. The same text again writes nothing.
 * 3. The empty text clears the query.
 */
export function test_unit_viewer_inspector_address_writer(): void {
  const writes: string[] = [];
  const location: { pathname: string; search: string; hash: string } = {
    pathname: "/draw",
    search: "",
    hash: "#t",
  };
  const write: (text: string) => void = createAutoMovieInspectorAddressWriter({
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