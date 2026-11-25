import {
  reportAutoMovieResourceRetirement,
  restoreAutoMovieRenderModeState,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

const failing = (error: unknown) => (): void => {
  throw error;
};

/** The error a call throws, or undefined when it returns. */
const caught = (call: () => void): unknown => {
  try {
    call();
  } catch (error) {
    return error;
  }
  return undefined;
};

/**
 * `restoreAutoMovieRenderModeState` runs every restoration and then reports the
 * failures; `reportAutoMovieResourceRetirement` words them for a retirement.
 *
 * Scenarios:
 *
 * 1. Every operation runs although an earlier one failed; one failure is thrown
 *    as it is, several as an `AggregateError` in order, nested aggregates
 *    flattened.
 * 2. A primary failure stays first, and alone it is thrown as it is.
 * 3. No failure returns.
 * 4. A retirement with two failures reports one `AggregateError` whose message
 *    names both causes; a single failure is rethrown unchanged.
 */
export function test_unit_render_scene_restore_render_mode_state(): void {
  const ran: string[] = [];
  const mark = (name: string) => (): void => {
    ran.push(name);
  };
  const a: Error = new Error("a");
  const b: Error = new Error("b");
  const c: Error = new Error("c");
  TestValidator.equals(
    "single",
    caught((): void =>
      restoreAutoMovieRenderModeState([mark("1"), failing(a), mark("2")]),
    ),
    a,
  );
  TestValidator.equals("all ran", ran, ["1", "2"]);

  const several = caught((): void =>
    restoreAutoMovieRenderModeState([
      failing(new AggregateError([a, b], "nested")),
      failing(c),
    ]),
  );
  TestValidator.predicate(
    "flattened",
    several instanceof AggregateError &&
      several.errors.length === 3 &&
      several.errors[0] === a &&
      several.errors[1] === b &&
      several.errors[2] === c,
  );
  TestValidator.equals(
    "primary alone",
    caught((): void => restoreAutoMovieRenderModeState([], { error: a })),
    a,
  );
  const primaryFirst = caught((): void =>
    restoreAutoMovieRenderModeState([failing(b)], { error: a }),
  );
  TestValidator.predicate(
    "primary first",
    primaryFirst instanceof AggregateError &&
      primaryFirst.errors[0] === a &&
      primaryFirst.errors[1] === b,
  );
  restoreAutoMovieRenderModeState([mark("3")]);

  const retired = caught((): void =>
    reportAutoMovieResourceRetirement([failing(a), failing(b)]),
  );
  TestValidator.predicate(
    "retirement",
    retired instanceof AggregateError &&
      retired.errors.length === 2 &&
      retired.message === "Resource retirement failed: a; b",
  );
  TestValidator.equals(
    "single retirement",
    caught((): void => reportAutoMovieResourceRetirement([failing(c)])),
    c,
  );
}