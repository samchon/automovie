import {
  type IAutoMovieInspectionRequest,
  parseAutoMovieInspectionRequest,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * An inspection request is read from named text values: absent keys take
 * their defaults, every key has one accepted form, and unreadable text is
 * refused instead of defaulted.
 *
 * Scenarios:
 *
 * 1. A reader that answers null for every key, and one that answers
 *    undefined, both give the default request.
 * 2. A reader holding every key gives each value as written: trimmed
 *    patterns with empty items dropped, the shade, the switches, kinds in the
 *    type's own order without repeats, the sliver limit, the cut and the
 *    stroke; `all` gives every kind, and each of the eight shades is
 *    accepted.
 * 3. Each switch is on for the empty string, `1` and `true`, off for `0` and
 *    `false`, and refuses any other text.
 * 4. An axis cut puts the point on the named axis with a normal toward the
 *    side cut away, signed by its prefix, and a general cut is the point and
 *    direction as written.
 * 5. An unknown shade, an unknown curve or defect kind alone or beside
 *    `all`, a sliver limit or stroke that is zero, negative, blank, not a
 *    number or infinite, and a cut that is malformed, incomplete or has a
 *    zero direction are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public parser through readers the test supplies and reads the returned request or the refusal.
 * @evidence contracts/development/testing.md#independent-expectations Expected requests are written out from the documented key table, not derived from the parser.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts absent against present keys, every accepted switch text against refused ones, both signs of an axis cut, the axis form against the general form, and each refusal against its accepted neighbour.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit supplies its own readers and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A reader that answers null for every key, and one that answers undefined, both give the default request).
 */
export function test_viewer_inspection_request(): void {
  const parse = (values: Record<string, string>): IAutoMovieInspectionRequest =>
    parseAutoMovieInspectionRequest(
      (key: string): string | null => values[key] ?? null,
    );
  const defaults: IAutoMovieInspectionRequest = {
    parts: [],
    hide: [],
    shade: "beauty",
    surface: true,
    wire: false,
    curves: [],
    defects: [],
    sliver: null,
    section: null,
    xray: false,
    stroke: 3,
  };

  // 1. Defaults.
  TestValidator.equals(
    "a reader answering null gives the defaults",
    parse({}),
    defaults,
  );
  TestValidator.equals(
    "a reader answering undefined gives the defaults",
    parseAutoMovieInspectionRequest((): undefined => undefined),
    defaults,
  );

  // 2. Every key.
  TestValidator.equals(
    "every key is read as written",
    parse({
      parts: " hero , *arm* ,,",
      hide: "prop",
      shade: "faces",
      surface: "0",
      wire: "",
      curves: "axis,section,axis",
      defects: "degenerate, open",
      sliver: "0.05",
      section: "y:1.2",
      xray: "true",
      stroke: "5",
    }),
    {
      parts: ["hero", "*arm*"],
      hide: ["prop"],
      shade: "faces",
      surface: false,
      wire: true,
      curves: ["section", "axis"],
      defects: ["open", "degenerate"],
      sliver: 0.05,
      section: { point: { x: 0, y: 1.2, z: 0 }, normal: { x: 0, y: 1, z: 0 } },
      xray: true,
      stroke: 5,
    },
  );
  TestValidator.equals(
    "all names every curve kind",
    parse({ curves: "all" }).curves,
    ["section", "guide", "axis"],
  );
  TestValidator.equals(
    "all names every defect kind that needs no limit",
    parse({ defects: "open, all" }).defects,
    ["open", "non-manifold", "inconsistent", "degenerate"],
  );
  const shades: IAutoMovieInspectionRequest.Shade[] = [
    "beauty",
    "depth",
    "mask",
    "normal",
    "outline",
    "pose",
    "clay",
    "faces",
  ];
  for (const shade of shades)
    TestValidator.equals(
      `shade ${shade} is accepted`,
      parse({ shade }).shade,
      shade,
    );

  // 3. Switch forms.
  for (const key of ["surface", "wire", "xray"] as const) {
    for (const text of ["", "1", "true"])
      TestValidator.equals(
        `${key} is on for "${text}"`,
        parse({ [key]: text })[key],
        true,
      );
    for (const text of ["0", "false"])
      TestValidator.equals(
        `${key} is off for "${text}"`,
        parse({ [key]: text })[key],
        false,
      );
    for (const text of ["yes", "TRUE", "on", "2"])
      TestValidator.error(`${key} refuses "${text}"`, (): void => {
        parse({ [key]: text });
      });
  }

  // 4. Section forms.
  const cuts: [
    text: string,
    point: [number, number, number],
    normal: [number, number, number],
  ][] = [
    ["x:0.2", [0.2, 0, 0], [1, 0, 0]],
    ["-x:0.2", [0.2, 0, 0], [-1, 0, 0]],
    ["+y:1.2", [0, 1.2, 0], [0, 1, 0]],
    ["-y:0", [0, 0, 0], [0, -1, 0]],
    ["z:-3", [0, 0, -3], [0, 0, 1]],
    ["0.1,0.2,0.3:0,2,0", [0.1, 0.2, 0.3], [0, 2, 0]],
    ["1,2,3:-1,0.5,0.25", [1, 2, 3], [-1, 0.5, 0.25]],
  ];
  for (const [text, point, normal] of cuts)
    TestValidator.equals(
      `section "${text}" is read`,
      parse({ section: text }).section,
      {
        point: { x: point[0], y: point[1], z: point[2] },
        normal: { x: normal[0], y: normal[1], z: normal[2] },
      },
    );

  // 5. Refusals.
  const refused: Record<string, string>[] = [
    { shade: "wire" },
    { shade: "" },
    { curves: "section,spline" },
    { defects: "sliver" },
    { defects: "open,closed" },
    { curves: "all,spline" },
    { defects: "closed,all" },
  ];
  for (const key of ["sliver", "stroke"])
    for (const text of ["0", "-1", "", "abc", "Infinity"])
      refused.push({ [key]: text });
  for (const text of [
    "x",
    "x:1:2",
    "w:1",
    "x:abc",
    "x:",
    "xy:1",
    "1,2:0,0,1",
    "1,2,3:0,1",
    "1,2,3:0,a,0",
    "1,2,3:0,0,0",
  ])
    refused.push({ section: text });
  for (const values of refused)
    TestValidator.error(`${JSON.stringify(values)} is refused`, (): void => {
      parse(values);
    });
}
