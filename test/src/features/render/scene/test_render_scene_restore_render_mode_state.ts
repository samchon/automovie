import {
  AutoMovieRenderSceneResource,
  AutoMovieRenderSceneRenderMode,
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
 * `restoreRenderModeState` runs every restoration and then reports the
 * failures; `reportResourceRetirement` words them for a retirement.
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases describe restoration order, primary error precedence, flattening and the retirement report wording.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that all restorations run, nested failures flatten in order, a primary error stays first, and a sole failure keeps its identity.
 * @evidence contracts/development/testing.md#independent-expectations Uses callback order markers and independently created error identities to specify ordered, flattened and single-failure results.
 */
export function test_render_scene_restore_render_mode_state(): void {
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
      AutoMovieRenderSceneRenderMode.restoreState([mark("1"), failing(a), mark("2")]),
    ),
    a,
  );
  TestValidator.equals("all ran", ran, ["1", "2"]);

  const several = caught((): void =>
    AutoMovieRenderSceneRenderMode.restoreState([
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
    caught((): void => AutoMovieRenderSceneRenderMode.restoreState([], { error: a })),
    a,
  );
  const primaryFirst = caught((): void =>
    AutoMovieRenderSceneRenderMode.restoreState([failing(b)], { error: a }),
  );
  TestValidator.predicate(
    "primary first",
    primaryFirst instanceof AggregateError &&
      primaryFirst.errors[0] === a &&
      primaryFirst.errors[1] === b,
  );
  AutoMovieRenderSceneRenderMode.restoreState([mark("3")]);

  const retired = caught((): void =>
    AutoMovieRenderSceneResource.reportRetirement([failing(a), failing(b)]),
  );
  TestValidator.predicate(
    "retirement",
    retired instanceof AggregateError &&
      retired.errors.length === 2 &&
      retired.message === "Resource retirement failed: a; b",
  );
  TestValidator.equals(
    "single retirement",
    caught((): void => AutoMovieRenderSceneResource.reportRetirement([failing(c)])),
    c,
  );
}