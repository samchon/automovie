import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import {
  type IAutoMovieViewerInspectorState,
  AutoMovieViewerInspector,



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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names request round-trip, history writes when the query changes and recovery from unsupported or repeated address keys.
 * @evidence contracts/development/testing.md#behavioral-verification Drives the public address writer with a recording history and location. Reads the resulting address through the public parser and checks refused address initialization.
 * @evidence contracts/development/testing.md#independent-expectations The fixture supplies the path, query, fragment and history state separately, so it can predict the one new address, one clearing write and both no-op conditions. Unknown and repeated keys each use a distinct literal input.
 */
export function test_inspector_page(): void {
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
  const write: (text: string) => void = AutoMovieViewerInspector.createAddressWriter({
    location,
    history,
  });

  // 1. Write, then read back.
  const request: IAutoMovieCapturePlanRequest = AutoMovieViewerInspector.readAddress(
    "?parts=hero/**&marks=edge&views=front@ortho&at=1.5&color=hero/arm=ff8800",
  );
  const text: string = AutoMovieViewerInspector.formatAddress(request);
  write(text);
  TestValidator.equals(
    "one entry replaced with path, query and fragment",
    written,
    [[{ kept: true }, `/inspect/?${text}#notes`]],
  );
  const address: URL = new URL(written[0]![1], "http://page.test");
  TestValidator.equals(
    "the written query reads back",
    AutoMovieViewerInspector.readAddress(address.search),
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
  const empty: IAutoMovieCapturePlanRequest = AutoMovieViewerInspector.readAddress("");
  for (const [query, key] of [
    ["?parts=hero/**&unknown=1", "unknown"],
    ["?shade=clay&shade=faces", "shade"],
  ] as const) {
    let message: string = "";
    try {
      AutoMovieViewerInspector.readAddress(query);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    TestValidator.predicate(
      `${query} is refused naming ${key}`,
      message.includes(`"${key}"`),
    );
    const opened: IAutoMovieViewerInspectorState =
      AutoMovieViewerInspector.createState(query);
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
