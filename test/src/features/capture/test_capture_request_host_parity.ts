import {
  type IAutoMovieCapturePlanRequest,
  parseAutoMovieCapturePlanRequest,
  readAutoMovieCaptureArguments,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * The same named values give the same plan request whether a page address or a command line carries them, because both hosts only map their text onto the one reader.
 *
 * Scenarios:
 *
 * 1. An address and a command line naming the subject, a range, events, two views holding commas and colons, two passes, a sweep with its margin, a budget, a round with its comparison and tolerance, and inspection keys read to equal requests, and the request holds the values written.
 * 2. A switch given bare (`?xray`, `--xray`), with `=1` and with a value after a space reads alike in both hosts.
 * 3. A command line value that starts with one dash, such as the axis cut `-x:0.2` or `-1`, is a value, and `--key=` gives the empty string.
 * 4. A command line argument that is not an option and an option given twice are refused naming them.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Parses `URLSearchParams` and `readAutoMovieCaptureArguments` output through the public reader and compares the requests; a host mapping that dropped, renamed or reinterpreted a key, or an argument reader that swallowed a dash value, fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected request members are the values this test writes, with units and defaults from the reader's documented table; equality of the two hosts' requests needs no oracle beyond the shared text.
 * @evidence contracts/development/testing.md#distinguishing-cases Every switch form, dash-leading values against option-like arguments, an empty `=` value, and both argument refusals. Unknown keys, malformed values and the round trip are owned by `test_capture_request_unknown_key`, `test_capture_request_malformed_value` and `test_capture_request_round_trip`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_request_host_parity`; it builds its text in memory and starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_capture_request_host_parity(): void {
  // 1. A full request through both hosts.
  const pairs: [string, string][] = [
    ["subject", "duel"],
    ["from", "1.5"],
    ["to", "4"],
    ["rate", "8"],
    ["events", "2,3.25"],
    ["window", "2"],
    ["views", "front@ortho;1,2,3:0,1,0"],
    ["passes", "clay,depth"],
    ["sweep", "hero/*"],
    ["margin", "0.05"],
    ["longest", "2576"],
    ["smallest", "240"],
    ["reduction", "nearest"],
    ["round", "after"],
    ["compare", "before"],
    ["tolerance", "2"],
    ["marks", "curve/section"],
    ["section", "-x:0.2"],
    ["stroke", "4"],
  ];
  const address: IAutoMovieCapturePlanRequest =
    parseAutoMovieCapturePlanRequest(new URLSearchParams(pairs));
  const command: IAutoMovieCapturePlanRequest =
    parseAutoMovieCapturePlanRequest(
      readAutoMovieCaptureArguments(
        pairs.flatMap(([key, value]: [string, string]): string[] => [
          `--${key}`,
          value,
        ]),
      ),
    );
  TestValidator.equals("the hosts read one request", command, address);
  TestValidator.equals(
    "the request holds the values written",
    [
      address.subject,
      address.sampling,
      address.events,
      address.window,
      address.views,
      address.passes,
      address.inspection.shade,
      address.sweep,
      address.margin,
      address.budget,
      address.round,
      address.compare,
      address.tolerance,
      address.inspection.marks,
      address.inspection.section,
      address.inspection.stroke,
    ],
    [
      "duel",
      { kind: "even", from: 1.5, to: 4, rate: 8 },
      [2, 3.25],
      2,
      ["front@ortho", "1,2,3:0,1,0"],
      ["clay", "depth"],
      "clay",
      "hero/*",
      0.05,
      { longest: 2576, smallest: 240, reduction: "nearest" },
      "after",
      "before",
      2,
      ["curve/section"],
      { point: { x: 0.2, y: 0, z: 0 }, normal: { x: -1, y: 0, z: 0 } },
      4,
    ],
  );

  // 2. Every switch form.
  const switched: boolean[] = [
    parseAutoMovieCapturePlanRequest(new URLSearchParams("xray")),
    parseAutoMovieCapturePlanRequest(new URLSearchParams("xray=1")),
    parseAutoMovieCapturePlanRequest(readAutoMovieCaptureArguments(["--xray"])),
    parseAutoMovieCapturePlanRequest(
      readAutoMovieCaptureArguments(["--xray=1"]),
    ),
    parseAutoMovieCapturePlanRequest(
      readAutoMovieCaptureArguments(["--xray", "1", "--stroke", "2"]),
    ),
  ].map(
    (request: IAutoMovieCapturePlanRequest): boolean => request.inspection.xray,
  );
  TestValidator.equals("a switch reads alike in every form", switched, [
    true,
    true,
    true,
    true,
    true,
  ]);

  // 3. Values that start with one dash, and an empty value.
  TestValidator.equals(
    "a dash-leading value is a value",
    [
      ...readAutoMovieCaptureArguments([
        "--section",
        "-x:0.2",
        "--from",
        "-1",
        "--wire=",
      ]),
    ],
    [
      ["section", "-x:0.2"],
      ["from", "-1"],
      ["wire", ""],
    ],
  );

  // 4. Argument refusals.
  for (const [title, argv, fragment] of [
    ["a stray value", ["duel"], "duel"],
    ["a single-dash option", ["-x"], "-x"],
    ["an option given twice", ["--rate", "5", "--rate", "6"], "--rate"],
  ] as const)
    TestValidator.predicate(
      `${title} is refused naming it`,
      throwsError((): unknown => readAutoMovieCaptureArguments(argv), fragment),
    );
}
