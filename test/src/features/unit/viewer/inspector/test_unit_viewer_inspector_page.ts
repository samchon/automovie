import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import {
  type IAutoMovieInspectorState,
  createAutoMovieInspectorAddressWriter,
  createAutoMovieInspectorState,
  formatAutoMovieInspectorAddress,
  readAutoMovieInspectorAddress,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * The inspector page reads its first request from the address and keeps the address equal to the request through an injected history, and an address the grammar refuses names the key.
 *
 * Scenarios:
 *
 * 1. A request written as text and handed to the address writer replaces the current history entry with the page's path, the text as the query and the fragment, passing the entry's own state; the query of that address read back gives the same request.
 * 2. A text equal to the current query writes nothing; the empty text clears a present query and writes nothing when the query is already empty.
 * 3. An address with an unknown key and one with a key given twice are refused naming the key, and the first state read from such an address is the request that asks for nothing with that refusal.
 */
export function test_unit_viewer_inspector_page(): void {
  const location: { pathname: string; search: string; hash: string } = {
    pathname: "/inspect/",
    search: "",
    hash: "#notes",
  };
  const written: [state: unknown, url: string][] = [];
  const history: {
    state: unknown;
    replaceState: (
      state: unknown,
      unused: string,
      url?: string | URL | null,
    ) => void;
  } = {
    state: { kept: true },
    replaceState: (
      state: unknown,
      _unused: string,
      url?: string | URL | null,
    ): void => {
      written.push([state, String(url)]);
    },
  };
  const write: (text: string) => void = createAutoMovieInspectorAddressWriter({
    location,
    history,
  });

  // 1. Write, then read back.
  const request: IAutoMovieCapturePlanRequest = readAutoMovieInspectorAddress(
    "?parts=hero/**&marks=edge&views=front@ortho&at=1.5&color=hero/arm=ff8800",
  );
  const text: string = formatAutoMovieInspectorAddress(request);
  write(text);
  TestValidator.equals(
    "one entry replaced with path, query and fragment",
    written,
    [[{ kept: true }, `/inspect/?${text}#notes`]],
  );
  const address: URL = new URL(written[0]![1], "http://page.test");
  TestValidator.equals(
    "the written query reads back",
    readAutoMovieInspectorAddress(address.search),
    request,
  );

  // 2. Unchanged and empty queries.
  location.search = `?${text}`;
  write(text);
  TestValidator.equals("an unchanged query writes nothing", written.length, 1);
  write("");
  TestValidator.equals(
    "the empty text clears the query",
    written.at(-1)![1],
    "/inspect/#notes",
  );
  location.search = "";
  write("");
  TestValidator.equals(
    "an already empty query writes nothing",
    written.length,
    2,
  );

  // 3. Refusals name the key.
  const empty: IAutoMovieCapturePlanRequest = readAutoMovieInspectorAddress("");
  for (const [query, key] of [
    ["?parts=hero/**&unknown=1", "unknown"],
    ["?shade=clay&shade=faces", "shade"],
  ] as const) {
    let message: string = "";
    try {
      readAutoMovieInspectorAddress(query);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    TestValidator.predicate(
      `${query} is refused naming ${key}`,
      message.includes(`"${key}"`),
    );
    const opened: IAutoMovieInspectorState =
      createAutoMovieInspectorState(query);
    TestValidator.equals(
      `${query} opens the empty request`,
      opened.request,
      empty,
    );
    TestValidator.predicate(
      `${query} opens with the refusal`,
      opened.error === message,
    );
  }
}
