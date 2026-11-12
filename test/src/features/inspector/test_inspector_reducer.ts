import type { IAutoMovieCapturePlanRequest } from "@automovie/render";
import {
  type IAutoMovieInspectorAction,
  type IAutoMovieInspectorState,
  createAutoMovieInspectorState,
  reduceAutoMovieInspectorState,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * Every edit of the inspector's request changes the request member it names and nothing else, and an edit the grammar refuses keeps the previous request with a reason naming the key.
 *
 * Scenarios:
 *
 * 1. Starting from a request that sets several keys, each edit (select, hide, label, colour, mark kind, shade, surface, x-ray, view, time, subject) changes exactly the members the action table names, to the value the grammar's key table gives, and clears the error.
 * 2. A toggle given twice in the same direction changes nothing the second time, and turning it off restores the starting request; a colour given twice to one pattern keeps one pair with the newer colour, and a null colour removes it.
 * 3. A shade edit on a request with several passes leaves one pass, and a time edit on an even sampling replaces it with that one second.
 * 4. A view the view grammar refuses, an address with an unknown key, and an address with an unreadable shade each keep the previous request object and give an error naming the key.
 * 5. The first state read from a refused address is the request that asks for nothing with the refusal, and from the empty address is that request without one; a restore sets the given request and reason.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Dispatches every action through the public reducer and compares the resulting requests member by member against the starting one.
 * @evidence contracts/development/testing.md#independent-expectations The member each action may change comes from the action table in `IAutoMovieInspectorAction`, and each expected value is written out from the plan grammar's key table (for example `at=1.5` is one explicit second), not read from the reducer.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts on against off, a repeated toggle against the first, replacing against removing a colour, one pass against several, an explicit second against even sampling, accepted edits against refusals of three kinds, and the empty against a refused first address.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_inspector_reducer`; it renders no component and starts no browser. The address round trip belongs to `test_inspector_address`.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming its input and the behaviour it pins.
 */
export function test_inspector_reducer(): void {
  const start: IAutoMovieInspectorState = createAutoMovieInspectorState(
    "?parts=prop/**&marks=edge&views=front&from=0.5&rate=10&subject=a",
  );
  TestValidator.equals("the starting address is read", start.error, null);
  const reduce: (
    state: IAutoMovieInspectorState,
    action: IAutoMovieInspectorAction,
  ) => IAutoMovieInspectorState = (
    state: IAutoMovieInspectorState,
    action: IAutoMovieInspectorAction,
  ): IAutoMovieInspectorState => reduceAutoMovieInspectorState(state, action);

  // 1. Each edit changes its members only.
  const cases: [
    action: IAutoMovieInspectorAction,
    members: string[],
    check: (request: IAutoMovieCapturePlanRequest) => boolean,
  ][] = [
    [
      { type: "select", pattern: "hero/**", on: true },
      ["inspection.parts"],
      (r: IAutoMovieCapturePlanRequest): boolean =>
        same(r.inspection.parts, ["prop/**", "hero/**"]),
    ],
    [
      { type: "hide", pattern: "hero/arm", on: true },
      ["inspection.hide"],
      (r: IAutoMovieCapturePlanRequest): boolean =>
        same(r.inspection.hide, ["hero/arm"]),
    ],
    [
      { type: "label", pattern: "hero/**", on: true },
      ["inspection.label"],
      (r: IAutoMovieCapturePlanRequest): boolean =>
        same(r.inspection.label, ["hero/**"]),
    ],
    [
      { type: "color", pattern: "hero/arm", color: 0xff8800 },
      ["inspection.color"],
      (r: IAutoMovieCapturePlanRequest): boolean =>
        same(r.inspection.color, [{ pattern: "hero/arm", color: 0xff8800 }]),
    ],
    [
      { type: "marks", pattern: "defect/*", on: true },
      ["inspection.marks"],
      (r: IAutoMovieCapturePlanRequest): boolean =>
        same(r.inspection.marks, ["edge", "defect/*"]),
    ],
    [
      { type: "shade", shade: "clay" },
      ["passes", "inspection.shade"],
      (r: IAutoMovieCapturePlanRequest): boolean =>
        same(r.passes, ["clay"]) && r.inspection.shade === "clay",
    ],
    [
      { type: "switch", key: "surface", on: false },
      ["inspection.surface"],
      (r: IAutoMovieCapturePlanRequest): boolean =>
        r.inspection.surface === false,
    ],
    [
      { type: "switch", key: "xray", on: true },
      ["inspection.xray"],
      (r: IAutoMovieCapturePlanRequest): boolean => r.inspection.xray === true,
    ],
    [
      { type: "view", view: "side@ortho@follow@focus=hero/arm" },
      ["views"],
      (r: IAutoMovieCapturePlanRequest): boolean =>
        same(r.views, ["side@ortho@follow@focus=hero/arm"]),
    ],
    [
      { type: "time", seconds: 1.5 },
      ["sampling"],
      (r: IAutoMovieCapturePlanRequest): boolean =>
        same(r.sampling, { kind: "at", seconds: [1.5] }),
    ],
    [
      { type: "subject", name: "b" },
      ["subject"],
      (r: IAutoMovieCapturePlanRequest): boolean => r.subject === "b",
    ],
    [
      { type: "subject", name: null },
      ["subject"],
      (r: IAutoMovieCapturePlanRequest): boolean => r.subject === null,
    ],
  ];
  for (const [action, members, check] of cases) {
    const next: IAutoMovieInspectorState = reduce(
      { ...start, error: "old" },
      action,
    );
    TestValidator.equals(`${action.type} is accepted`, next.error, null);
    TestValidator.equals(
      `${action.type} changes ${members.join(", ")} only`,
      differing(start.request, next.request),
      [...members].sort((a: string, b: string): number => a.localeCompare(b)),
    );
    TestValidator.predicate(
      `${action.type} writes the asked value`,
      check(next.request),
    );
  }

  // 2. Repeated toggles and colours.
  const once: IAutoMovieInspectorState = reduce(start, {
    type: "hide",
    pattern: "x",
    on: true,
  });
  TestValidator.equals(
    "a repeated toggle changes nothing",
    reduce(once, { type: "hide", pattern: "x", on: true }).request,
    once.request,
  );
  TestValidator.equals(
    "off restores the start",
    reduce(once, { type: "hide", pattern: "x", on: false }).request,
    start.request,
  );
  const red: IAutoMovieInspectorState = reduce(start, {
    type: "color",
    pattern: "a/b",
    color: 0xff0000,
  });
  const blue: IAutoMovieInspectorState = reduce(red, {
    type: "color",
    pattern: "a/b",
    color: 0x0000ff,
  });
  TestValidator.equals(
    "a newer colour replaces the pair",
    blue.request.inspection.color,
    [{ pattern: "a/b", color: 0x0000ff }],
  );
  TestValidator.equals(
    "a null colour removes it",
    reduce(blue, { type: "color", pattern: "a/b", color: null }).request,
    start.request,
  );

  // 3. Several passes and even sampling collapse to one.
  const passes: IAutoMovieInspectorState =
    createAutoMovieInspectorState("passes=clay,normal");
  TestValidator.equals("several passes are read", passes.request.passes, [
    "clay",
    "normal",
  ]);
  TestValidator.equals(
    "a shade leaves one pass",
    reduce(passes, { type: "shade", shade: "faces" }).request.passes,
    ["faces"],
  );
  TestValidator.predicate(
    "the start samples evenly",
    start.request.sampling.kind === "even",
  );

  // 4. Refusals keep the previous request and name the key.
  const refusals: [action: IAutoMovieInspectorAction, key: string][] = [
    [{ type: "view", view: "front@bogus" }, "views"],
    [{ type: "text", text: "unknown=1" }, "unknown"],
    [{ type: "text", text: "?shade=wire" }, "shade"],
  ];
  for (const [action, key] of refusals) {
    const refused: IAutoMovieInspectorState = reduce(start, action);
    TestValidator.predicate(
      `${JSON.stringify(action)} keeps the previous request`,
      refused.request === start.request,
    );
    TestValidator.predicate(
      `${JSON.stringify(action)} names ${key}`,
      refused.error !== null && refused.error.includes(key),
    );
  }

  // 5. First states and restore.
  const empty: IAutoMovieInspectorState = createAutoMovieInspectorState("");
  TestValidator.equals("the empty address has no error", empty.error, null);
  TestValidator.equals(
    "the empty address asks for the film view",
    empty.request.views,
    ["film"],
  );
  const opened: IAutoMovieInspectorState =
    createAutoMovieInspectorState("shade=wire");
  TestValidator.equals(
    "a refused address opens the empty request",
    opened.request,
    empty.request,
  );
  TestValidator.predicate(
    "a refused address shows why",
    opened.error !== null && opened.error.includes("shade"),
  );
  const restored: IAutoMovieInspectorState = reduce(start, {
    type: "restore",
    request: empty.request,
    error: "refused",
  });
  TestValidator.predicate(
    "restore sets the request and reason",
    restored.request === empty.request && restored.error === "refused",
  );
}

/** Whether two values are deeply equal as JSON. */
function same(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

/** The members of two requests that differ, the inspection's by their own names. */
function differing(
  before: IAutoMovieCapturePlanRequest,
  after: IAutoMovieCapturePlanRequest,
): string[] {
  const names: string[] = [];
  for (const key of Object.keys(
    before,
  ) as (keyof IAutoMovieCapturePlanRequest)[])
    if (key === "inspection") {
      for (const member of Object.keys(
        before.inspection,
      ) as (keyof IAutoMovieCapturePlanRequest["inspection"])[])
        if (!same(before.inspection[member], after.inspection[member]))
          names.push(`inspection.${member}`);
    } else if (!same(before[key], after[key])) names.push(key);
  return names.sort((a: string, b: string): number => a.localeCompare(b));
}
