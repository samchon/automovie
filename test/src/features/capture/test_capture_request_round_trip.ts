import {
  type IAutoMovieCapturePlanRequest,
  formatAutoMovieCapturePlanRequest,
  parseAutoMovieCapturePlanRequest,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * A plan request written back as named values reads back as the same request, so the page can keep its address equal to what it draws and show the command that repeats it.
 *
 * Scenarios:
 *
 * 1. The request that asks for nothing writes as no values.
 * 2. Requests with explicit seconds, with an even range and events, with several views and passes, with a sweep and margin, with a budget, with a round compared at a tolerance, and with inspection keys each read back equal after writing.
 * 3. One pass is written through `shade` and several through `passes`, never both.
 * 4. A written request read through `URLSearchParams`, the page's own form, reads back equal too.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Formats parsed requests with the public writer and parses the result again; a writer that dropped a key, wrote a number that reads differently, or wrote both `passes` and `shade` fails.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the request the reader itself returned from hand-written text, the round-trip property the writer documents; the empty request and the pass encoding are written by hand from the documented rules.
 * @evidence contracts/development/testing.md#distinguishing-cases An empty request against requests touching every key family, one pass against several, and the address form against a plain map. Host equality is owned by `test_capture_request_host_parity`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_request_round_trip`; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_capture_request_round_trip(): void {
  const read: (pairs: [string, string][]) => IAutoMovieCapturePlanRequest = (
    pairs: [string, string][],
  ): IAutoMovieCapturePlanRequest =>
    parseAutoMovieCapturePlanRequest(new Map(pairs));

  // 1. Nothing asked writes nothing.
  TestValidator.equals(
    "the empty request writes no value",
    formatAutoMovieCapturePlanRequest(read([])),
    [],
  );

  // 2. Each family of keys survives the round trip.
  const cases: [string, string][][] = [
    [["at", "0.25,1,0.125"]],
    [
      ["subject", "duel"],
      ["from", "0.1"],
      ["to", "2.7"],
      ["rate", "7.5"],
      ["events", "1.2,0.3"],
      ["window", "0"],
      ["threshold", "12.5"],
    ],
    [
      ["views", "film;front@ortho@focus=hero;0,1.6,3:0,1,0"],
      ["passes", "beauty,clay,faces"],
    ],
    [
      ["sweep", "hero/*"],
      ["margin", "0.02"],
      ["parts", "hero"],
    ],
    [
      ["longest", "2576"],
      ["smallest", "180"],
      ["reduction", "nearest"],
    ],
    [
      ["round", "after"],
      ["compare", "before"],
      ["tolerance", "1.5"],
    ],
    [
      ["shade", "depth"],
      ["surface", "0"],
      ["marks", "curve/**,defect"],
      ["sliver", "8"],
      ["section", "-y:0.5"],
      ["xray", ""],
      ["stroke", "2"],
      ["hide", "floor"],
    ],
  ];
  for (const pairs of cases) {
    const request: IAutoMovieCapturePlanRequest = read(pairs);
    const written: [string, string][] = formatAutoMovieCapturePlanRequest(request);
    TestValidator.equals(
      `${pairs.map(([key]: [string, string]): string => key).join(",")} reads back`,
      read(written),
      request,
    );

    // 4. The address form.
    TestValidator.equals(
      `${pairs[0]![0]} reads back from an address`,
      parseAutoMovieCapturePlanRequest(new URLSearchParams(written)),
      request,
    );
  }

  // 3. Passes and shade.
  const keys: (pairs: [string, string][]) => string[] = (
    pairs: [string, string][],
  ): string[] =>
    formatAutoMovieCapturePlanRequest(read(pairs)).map(
      ([key]: [string, string]): string => key,
    );
  TestValidator.equals("one pass is the shade", keys([["passes", "clay"]]), ["shade"]);
  TestValidator.equals("several passes are passes", keys([["passes", "clay,depth"]]), [
    "passes",
  ]);
}
