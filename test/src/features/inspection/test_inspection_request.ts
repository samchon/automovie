import {
  AUTO_MOVIE_INSPECTION_KEYS,
  type IAutoMovieInspectionRequest,
  formatAutoMovieInspectionRequest,
  parseAutoMovieInspectionRequest,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * An inspection request is read from named text values, every key the reader asks for is listed, and writing a request gives the values that read back to it.
 *
 * Scenarios:
 *
 * 1. A reader that answers null for every key, and one that answers undefined, both give the default request, and the keys the parser asks for are exactly `AUTO_MOVIE_INSPECTION_KEYS`.
 * 2. A reader holding every key gives each value as written: trimmed patterns with empty items dropped, the shade, the switches, kind patterns, the sliver limit, the cut, the stroke, label patterns, `pattern=rrggbb` colours in either letter case, and the trail patterns, reach and ticks; each of the eight shades is accepted.
 * 3. Each switch is on for the empty string, `1` and `true`, off for `0` and `false`, and refuses any other text.
 * 4. An axis cut puts the point on the named axis with a normal toward the side cut away, signed by its prefix, and a general cut is the point and direction as written.
 * 5. An unknown shade, a colour that is not `pattern=rrggbb`, a sliver limit, stroke, reach or tick rate that is zero, negative, blank, not a number or infinite, and a cut that is malformed, incomplete or has a zero direction are refused.
 * 6. The default request is written as no values, and the full request, a request with an axis cut, and requests changing one key each read back equal after being written, with every written key among `AUTO_MOVIE_INSPECTION_KEYS` in that list's order.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public parser through readers the test supplies, records the keys it asks for, writes requests with the public formatter and parses the written values back.
 * @evidence contracts/development/testing.md#independent-expectations Expected requests are written out from the documented key table, not derived from the parser; the round trip is checked against the request the test wrote, not against the formatter's output.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts absent against present keys, every accepted switch text against refused ones, both signs of an axis cut, the axis form against the general form, each refusal against its accepted neighbour, and the default request against requests that change each key.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit supplies its own readers and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A reader that answers null for every key, and one that answers undefined, both give the default request).
 */
export function test_inspection_request(): void {
  const parse = (values: Record<string, string>): IAutoMovieInspectionRequest =>
    parseAutoMovieInspectionRequest((key: string): string | null => values[key] ?? null);
  const defaults: IAutoMovieInspectionRequest = InspectionScene.ask({});

  // 1. Defaults and the keys read.
  TestValidator.equals("a reader answering null gives the defaults", parse({}), defaults);
  const asked: string[] = [];
  TestValidator.equals(
    "a reader answering undefined gives the defaults",
    parseAutoMovieInspectionRequest((key: string): undefined => {
      asked.push(key);
      return undefined;
    }),
    defaults,
  );
  TestValidator.equals(
    "the parser asks for exactly the listed keys",
    [...asked].sort((a: string, b: string): number => a.localeCompare(b)),
    [...AUTO_MOVIE_INSPECTION_KEYS].sort((a: string, b: string): number =>
      a.localeCompare(b),
    ),
  );

  // 2. Every key.
  const full: IAutoMovieInspectionRequest = {
    parts: ["hero", "*arm*"],
    hide: ["prop"],
    shade: "faces",
    surface: false,
    marks: ["curve/section", "defect"],
    sliver: 0.05,
    section: { point: { x: 0, y: 1.2, z: 0 }, normal: { x: 0, y: 1, z: 0 } },
    xray: true,
    stroke: 5,
    label: ["hero", "**/section/*"],
    color: [
      { pattern: "hero/arm", color: 0xff8800 },
      { pattern: "curve/section", color: 0x00ff00 },
    ],
    trail: ["hero/*Hand"],
    reach: 0.5,
    ticks: 10,
  };
  TestValidator.equals(
    "every key is read as written",
    parse({
      parts: " hero , *arm* ,,",
      hide: "prop",
      shade: "faces",
      surface: "0",
      marks: "curve/section, defect",
      sliver: "0.05",
      section: "y:1.2",
      xray: "true",
      stroke: "5",
      label: "hero, **/section/*",
      color: "hero/arm=FF8800, curve/section=00ff00",
      trail: "hero/*Hand",
      reach: "0.5",
      ticks: "10",
    }),
    full,
  );
  const shades: IAutoMovieInspectionRequest.Shade[] = ["beauty", "depth", "mask", "normal", "outline", "pose", "clay", "faces"];
  for (const shade of shades)
    TestValidator.equals(`shade ${shade} is accepted`, parse({ shade }).shade, shade);

  // 3. Switch forms.
  for (const key of ["surface", "xray"] as const) {
    for (const text of ["", "1", "true"])
      TestValidator.equals(`${key} is on for "${text}"`, parse({ [key]: text })[key], true);
    for (const text of ["0", "false"])
      TestValidator.equals(`${key} is off for "${text}"`, parse({ [key]: text })[key], false);
    for (const text of ["yes", "TRUE", "on", "2"])
      TestValidator.error(`${key} refuses "${text}"`, (): void => {
        parse({ [key]: text });
      });
  }

  // 4. Section forms.
  const cuts: [text: string, point: number[], normal: number[]][] = [
    ["x:0.2", [0.2, 0, 0], [1, 0, 0]],
    ["-x:0.2", [0.2, 0, 0], [-1, 0, 0]],
    ["+y:1.2", [0, 1.2, 0], [0, 1, 0]],
    ["-y:0", [0, 0, 0], [0, -1, 0]],
    ["z:-3", [0, 0, -3], [0, 0, 1]],
    ["0.1,0.2,0.3:0,2,0", [0.1, 0.2, 0.3], [0, 2, 0]],
  ];
  for (const [text, point, normal] of cuts)
    TestValidator.equals(`section "${text}" is read`, parse({ section: text }).section, {
      point: { x: point[0]!, y: point[1]!, z: point[2]! },
      normal: { x: normal[0]!, y: normal[1]!, z: normal[2]! },
    });

  // 5. Refusals.
  const refused: Record<string, string>[] = [
    { shade: "wire" },
    { shade: "" },
    { color: "hero" },
    { color: "hero=ff00" },
    { color: "=ff0000" },
    { color: "hero=gg0000" },
  ];
  for (const key of ["sliver", "stroke", "reach", "ticks"])
    for (const text of ["0", "-1", "", "abc", "Infinity"]) refused.push({ [key]: text });
  for (const text of ["x", "x:1:2", "w:1", "x:abc", "x:", "1,2:0,0,1", "1,2,3:0,a,0", "1,2,3:0,0,0"])
    refused.push({ section: text });
  for (const values of refused)
    TestValidator.error(`${JSON.stringify(values)} is refused`, (): void => {
      parse(values);
    });

  // 6. Writing reads back.
  TestValidator.equals("the default request writes no value", formatAutoMovieInspectionRequest(defaults), []);
  const requests: IAutoMovieInspectionRequest[] = [
    full,
    { ...full, section: { point: { x: -0.5, y: 0, z: 0 }, normal: { x: -1, y: 0, z: 0 } } },
    InspectionScene.ask({ parts: ["a/b", "**"] }),
    InspectionScene.ask({ shade: "clay" }),
    InspectionScene.ask({ surface: false }),
    InspectionScene.ask({ marks: ["**"] }),
    InspectionScene.ask({ sliver: 1 / 3 }),
    InspectionScene.ask({ xray: true }),
    InspectionScene.ask({ stroke: 0.1 + 0.2 }),
    InspectionScene.ask({ label: ["a"] }),
    InspectionScene.ask({ trail: ["a", "b/*"], reach: 2, ticks: 24 }),
    InspectionScene.ask({ color: [{ pattern: "a", color: 0x00000f }] }),
  ];
  for (const request of requests) {
    const written: [string, string][] = formatAutoMovieInspectionRequest(request);
    const values: Record<string, string> = Object.fromEntries(written);
    TestValidator.equals(`${JSON.stringify(written)} reads back`, parse(values), request);
    const order: number[] = written.map(([key]: [string, string]): number => AUTO_MOVIE_INSPECTION_KEYS.indexOf(key));
    TestValidator.predicate(
      `${JSON.stringify(written)} writes listed keys in order`,
      order.every((index: number, i: number): boolean => index >= 0 && (i === 0 || index > order[i - 1]!)),
    );
  }
}
