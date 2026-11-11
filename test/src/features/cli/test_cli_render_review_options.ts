import { TestValidator } from "@nestia/e2e";
import {
  AUTOMOVIE_RENDER_OPTIONS,
  AUTOMOVIE_REVIEW_OPTIONS,
  readAutoMovieRenderOptions,
  readAutoMovieReviewOptions,
} from "automovie";

import { throwsError } from "../internal/predicates";

/**
 * `automovie render` and `automovie review` take exactly the options they list and refuse every other, so a command line means one thing and the README's table, which a test keeps equal to the lists, documents every option.
 *
 * Scenarios:
 *
 * 1. Render with only `--module` takes the module, no props, the default folder and the software backend and leaves an empty request; with every listed option it takes each as given and leaves `subject` to the request.
 * 2. Render refuses an empty value of its own option, a missing `--module`, and a backend other than software or gpu; a request key such as `--at` is left to the request, which the command refuses for every key but `subject`.
 * 3. Review takes a loopback address with its query, a number of seconds and an optional folder.
 * 4. Review refuses a missing `--url` or `--seconds`, an address on another machine or over HTTPS, seconds that are zero, negative, above a day or not a number, and an option outside its list.
 * 5. Every listed option is admitted by its reader, so the lists and the readers agree.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls both readers with literal option maps and reads the records or the refusals; a reader that ignored an unknown option, guessed a module, admitted a remote page or an unbounded duration fails.
 * @evidence contracts/development/testing.md#independent-expectations The accepted options are the commands' documented usage; the loopback rule keeps a review from driving a page elsewhere, as the delivery host's capture address rule did; a day is the documented upper bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Minimal against full option sets, listed against unlisted options, a loopback against a remote and a secure address, and seconds at and beyond each bound. The README's agreement with the lists is owned by `test_render_readme_keys`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_cli_render_review_options`; it reads literal maps and starts no browser or process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_cli_render_review_options(): void {
  const render: (values: [string, string][]) => unknown = (values: [string, string][]): unknown => {
    const read: ReturnType<typeof readAutoMovieRenderOptions> = readAutoMovieRenderOptions(new Map(values));
    return { ...read, request: [...read.request] };
  };
  // 1. Render's options.
  TestValidator.equals("render with a module", render([["module", "src/subjects.ts"]]), {
    module: "src/subjects.ts",
    props: null,
    out: null,
    backend: "software",
    request: [],
  });
  TestValidator.equals(
    "render with every option",
    render([
      ["module", "src/subjects.ts"],
      ["subject", "starter"],
      ["props", "case.json"],
      ["out", "media/out"],
      ["backend", "gpu"],
    ]),
    { module: "src/subjects.ts", props: "case.json", out: "media/out", backend: "gpu", request: [["subject", "starter"]] },
  );

  // 2. Render's refusals; a request key passes on.
  TestValidator.equals(
    "a request key passes to the request",
    [...readAutoMovieRenderOptions(new Map([["module", "m.ts"], ["at", "1"]])).request.keys()],
    ["at"],
  );
  for (const [values, fragment] of [
    [[["module", "m.ts"], ["out", " "]], "--out needs a value"],
    [[["subject", "starter"]], "--module"],
    [[["module", "m.ts"], ["backend", "vulkan"]], "vulkan"],
  ] as [string[][], string][])
    TestValidator.predicate(
      `render refuses ${JSON.stringify(values)}`,
      throwsError((): unknown => readAutoMovieRenderOptions(new Map(values as [string, string][])), fragment),
    );

  // 3. Review's options.
  TestValidator.equals(
    "review of the inspector",
    readAutoMovieReviewOptions(
      new Map([
        ["url", "http://127.0.0.1:5173/?subject=starter"],
        ["seconds", "12.5"],
      ]),
    ),
    { url: "http://127.0.0.1:5173/?subject=starter", seconds: 12.5, out: null },
  );
  TestValidator.equals(
    "review into a folder",
    readAutoMovieReviewOptions(
      new Map([
        ["url", "http://localhost:5173/"],
        ["seconds", "86400"],
        ["out", "media/review"],
      ]),
    ).out,
    "media/review",
  );

  // 4. Review's refusals.
  for (const [values, fragment] of [
    [[["seconds", "3"]], "--url"],
    [[["url", "http://127.0.0.1:5173/"]], "--seconds"],
    [[["url", "http://example.com/"], ["seconds", "3"]], "on this machine"],
    [[["url", "https://127.0.0.1/"], ["seconds", "3"]], "on this machine"],
    [[["url", "http://127.0.0.1/"], ["seconds", "0"]], "above 0"],
    [[["url", "http://127.0.0.1/"], ["seconds", "-1"]], "above 0"],
    [[["url", "http://127.0.0.1/"], ["seconds", "86401"]], "at most 86400"],
    [[["url", "http://127.0.0.1/"], ["seconds", "soon"]], "soon"],
    [[["url", "http://127.0.0.1/"], ["seconds", "3"], ["module", "m.ts"]], "--module"],
  ] as [string[][], string][])
    TestValidator.predicate(
      `review refuses ${JSON.stringify(values)}`,
      throwsError((): unknown => readAutoMovieReviewOptions(new Map(values as [string, string][])), fragment),
    );

  // 5. The lists and the readers agree.
  TestValidator.predicate(
    "every render option is admitted",
    AUTOMOVIE_RENDER_OPTIONS.every((option: string): boolean => {
      readAutoMovieRenderOptions(new Map([["module", "m.ts"], [option, option === "backend" ? "gpu" : option === "module" ? "m.ts" : "value"]]));
      return true;
    }),
  );
  TestValidator.predicate(
    "every review option is admitted",
    AUTOMOVIE_REVIEW_OPTIONS.every((option: string): boolean => {
      readAutoMovieReviewOptions(
        new Map([
          ["url", "http://127.0.0.1/"],
          ["seconds", "1"],
          [option, option === "url" ? "http://127.0.0.1/" : option === "seconds" ? "1" : "value"],
        ]),
      );
      return true;
    }),
  );
}
