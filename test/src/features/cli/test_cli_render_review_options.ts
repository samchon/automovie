import { TestValidator } from "@nestia/e2e";
import {
  AutoMovieCliRender,
  AutoMovieCliReview,
} from "automovie";

import { throwsError } from "../internal/predicates";

/**
 * `automovie render` and `automovie review` take exactly the options they list
 * and refuse every other, so a command line means one thing and the README's
 * table, which a test keeps equal to the lists, documents every option.
 *
 * Scenarios:
 *
 * 1. Render with only `--module` takes the module, no props, the default folder
 *    and the software backend and leaves an empty request; with every listed
 *    option it takes each as given and leaves `subject` to the request.
 *    Checkpoint directory and lowercase SHA-256 are accepted together.
 * 2. Render refuses an empty value of its own option, a missing `--module`, a
 *    backend other than software or gpu, and a background other than scene or
 *    transparent; a request key such as `--at` is left to the request, which
 *    the command refuses for every key but `subject`.
 * 3. Review takes a loopback address with its query, a number of seconds and an
 *    optional folder.
 * 4. Review refuses a missing `--url` or `--seconds`, an address on another
 *    machine or over HTTPS, seconds that are zero, negative, above a day or not
 *    a number, and an option outside its list.
 * 5. Every listed option is admitted by its reader, so the lists and the readers
 *    agree.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls both readers with literal option maps and reads the records or the refusals; a reader that ignored an unknown option, guessed a module, admitted a remote page or an unbounded duration fails.
 * @evidence contracts/development/testing.md#independent-expectations The accepted options are the commands' documented usage; the loopback rule keeps a review from driving a page elsewhere, as the delivery host's capture address rule did; a day is the documented upper bound.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_cli_render_review_options(): void {
  const render: (values: [string, string][]) => unknown = (
    values: [string, string][],
  ): unknown => {
    const read: ReturnType<typeof AutoMovieCliRender.readOptions> =
      AutoMovieCliRender.readOptions(new Map(values));
    return { ...read, request: [...read.request] };
  };
  // 1. Render's options.
  TestValidator.equals(
    "render with a module",
    render([["module", "src/subjects.ts"]]),
    {
      module: "src/subjects.ts",
      props: null,
      out: null,
      backend: "software",
      timeout: 120000,
      request: [],
      background: "scene",
      checkpoint: null,
    },
  );
  TestValidator.equals(
    "render with every option",
    render([
      ["module", "src/subjects.ts"],
      ["subject", "starter"],
      ["props", "case.json"],
      ["out", "media/out"],
      ["backend", "gpu"],
      ["timeout-ms", "600000"],
      ["background", "transparent"],
      ["checkpoint-dir", "media/cache"],
      ["checkpoint-identity", "1".repeat(64)],
    ]),
    {
      module: "src/subjects.ts",
      props: "case.json",
      out: "media/out",
      backend: "gpu",
      timeout: 600000,
      request: [["subject", "starter"]],
      background: "transparent",
      checkpoint: { directory: "media/cache", identity: "1".repeat(64) },
    },
  );

  // 2. Render's refusals; a request key passes on.
  TestValidator.equals(
    "a request key passes to the request",
    [
      ...AutoMovieCliRender.readOptions(
        new Map([
          ["module", "m.ts"],
          ["at", "1"],
        ]),
      ).request.keys(),
    ],
    ["at"],
  );
  for (const [values, fragment] of [
    [
      [
        ["module", "m.ts"],
        ["out", " "],
      ],
      "--out needs a value",
    ],
    [[["subject", "starter"]], "--module"],
    [
      [
        ["module", "m.ts"],
        ["backend", "vulkan"],
      ],
      "vulkan",
    ],
    [
      [
        ["module", "m.ts"],
        ["background", "green"],
      ],
      "not scene or transparent",
    ],
    [[['module', 'm.ts'], ['checkpoint-dir', 'frames']], 'together'],
    [[['module', 'm.ts'], ['checkpoint-identity', '1'.repeat(64)]], 'together'],
    [[['module', 'm.ts'], ['checkpoint-dir', 'frames'], ['checkpoint-identity', 'other']], '64 lowercase SHA-256 digits'],
  ] as [string[][], string][])
    TestValidator.predicate(
      `render refuses ${JSON.stringify(values)}`,
      throwsError(
        (): unknown =>
          AutoMovieCliRender.readOptions(new Map(values as [string, string][])),
        fragment,
      ),
    );

  // 3. Review's options.
  TestValidator.equals(
    "review of the inspector",
    AutoMovieCliReview.readOptions(
      new Map([
        ["url", "http://127.0.0.1:5173/?subject=starter"],
        ["seconds", "12.5"],
      ]),
    ),
    { url: "http://127.0.0.1:5173/?subject=starter", seconds: 12.5, out: null },
  );
  TestValidator.equals(
    "review into a folder",
    AutoMovieCliReview.readOptions(
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
    [
      [
        ["url", "http://example.com/"],
        ["seconds", "3"],
      ],
      "on this machine",
    ],
    [
      [
        ["url", "https://127.0.0.1/"],
        ["seconds", "3"],
      ],
      "on this machine",
    ],
    [
      [
        ["url", "http://127.0.0.1/"],
        ["seconds", "0"],
      ],
      "above 0",
    ],
    [
      [
        ["url", "http://127.0.0.1/"],
        ["seconds", "-1"],
      ],
      "above 0",
    ],
    [
      [
        ["url", "http://127.0.0.1/"],
        ["seconds", "86401"],
      ],
      "at most 86400",
    ],
    [
      [
        ["url", "http://127.0.0.1/"],
        ["seconds", "soon"],
      ],
      "soon",
    ],
    [
      [
        ["url", "http://127.0.0.1/"],
        ["seconds", "3"],
        ["module", "m.ts"],
      ],
      "--module",
    ],
  ] as [string[][], string][])
    TestValidator.predicate(
      `review refuses ${JSON.stringify(values)}`,
      throwsError(
        (): unknown =>
          AutoMovieCliReview.readOptions(new Map(values as [string, string][])),
        fragment,
      ),
    );

  // 5. The lists and the readers agree.
  const renderSamples: Record<string, [string, string][]> = {
    backend: [["backend", "gpu"]],
    "timeout-ms": [["timeout-ms", "600000"]],
    background: [["background", "transparent"]],
    "checkpoint-dir": [["checkpoint-dir", "frames"], ["checkpoint-identity", "1".repeat(64)]],
    "checkpoint-identity": [["checkpoint-dir", "frames"], ["checkpoint-identity", "1".repeat(64)]],
  };
  TestValidator.predicate(
    "every render option is admitted",
    AutoMovieCliRender.OPTIONS.every((option: string): boolean => {
      AutoMovieCliRender.readOptions(
        new Map([
          ["module", "m.ts"],
          ...(renderSamples[option] ?? [[option, option === "module" ? "m.ts" : "value"]]),
        ]),
      );
      return true;
    }),
  );
  const examples: [string, string][][] = [
    [
      ["url", "http://127.0.0.1/"],
      ["seconds", "1"],
      ["out", "media/review"],
    ],
    [
      ["file", "film.mp4"],
      ["at", "0.12"],
      ["note", "The hands miss"],
    ],
    [
      ["file", "film.mp4"],
      ["at", "0.12"],
      ["note", "The hands meet"],
      ["reviewer", "Director"],
      ["decision", "accepted"],
      ["viewed", "still"],
    ],
    [
      ["mark", "old/review.json"],
      ["file", "film.mp4"],
      ["from", "0.1"],
      ["to", "0.2"],
      ["reviewer", "Director"],
      ["decision", "accepted"],
      ["viewed", "playback"],
    ],
    [
      ["file", "film.mp4"],
      ["from", "0.1"],
      ["to", "0.2"],
      ["note", "The footsteps line up"],
      ["reviewer", "Director"],
      ["decision", "accepted"],
      ["viewed", "listening"],
    ],
  ];
  const admitted: string[] = [
    ...new Set(
      examples.flatMap((pairs): string[] => {
        AutoMovieCliReview.readOptions(new Map(pairs));
        return pairs.map(([key]): string => key);
      }),
    ),
  ];
  const byKey = (left: string, right: string): number =>
    left < right ? -1 : left > right ? 1 : 0;
  TestValidator.equals(
    "review examples cover every option",
    admitted.sort(byKey),
    [...AutoMovieCliReview.OPTIONS].sort(byKey),
  );
  for (const [values, fragment] of [
    [
      [
        ["file", "film.mp4"],
        ["at", "0"],
        ["from", "0"],
        ["to", "1"],
      ],
      "--at excludes",
    ],
    [
      [
        ["file", "film.mp4"],
        ["at", "0"],
        ["note", "Review"],
        ["decision", "accepted"],
      ],
      "together",
    ],
    [
      [
        ["file", "film.mp4"],
        ["at", "0"],
        ["note", "Review"],
        ["reviewer", "Director"],
        ["decision", "accepted"],
        ["viewed", "listening"],
      ],
      "need --from and --to",
    ],
    [
      [
        ["file", "film.mp4"],
        ["from", "0"],
        ["to", "1"],
        ["note", "Review"],
        ["reviewer", "Director"],
        ["decision", "accepted"],
        ["viewed", "still"],
      ],
      "Still review needs --at",
    ],
    [
      [
        ["mark", "old/review.json"],
        ["at", "0"],
      ],
      "with --file",
    ],
    [
      [
        ["mark", "old/review.json"],
        ["note", "Review"],
      ],
      "explicit position",
    ],
  ] as [string[][], string][])
    TestValidator.predicate(
      `review refuses ${JSON.stringify(values)}`,
      throwsError(
        (): unknown =>
          AutoMovieCliReview.readOptions(new Map(values as [string, string][])),
        fragment,
      ),
    );
}
