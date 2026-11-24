import { physicalGlitchFilter } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `physicalGlitchFilter` takes a new value only after its input has held it for
 * a whole window of successive updates, as IHMC's `GlitchFilteredYoBoolean`
 * does.
 *
 * Scenarios:
 *
 * 1. A window of two: one differing update keeps the value and counts one; the
 *    second flips it and clears the count.
 * 2. A glitch, true, false, true, false, true, never flips a false filter of
 *    window two.
 * 3. An input equal to the value clears a running count.
 * 4. Windows of zero and one follow the input at once.
 * 5. `set` gives the value with no count, and a new filter is false.
 */
export function test_unit_engine_physics_glitch_filter(): void {
  const step = (
    state: physicalGlitchFilter.IState,
    value: boolean,
    window: number,
  ): physicalGlitchFilter.IState =>
    physicalGlitchFilter({ state, value, window });
  const once: physicalGlitchFilter.IState = step(
    physicalGlitchFilter.set(false),
    true,
    2,
  );
  TestValidator.equals("one update", once, { value: false, count: 1 });
  TestValidator.equals("two updates", step(once, true, 2), {
    value: true,
    count: 0,
  });
  let glitch: physicalGlitchFilter.IState = physicalGlitchFilter.set(false);
  for (const value of [true, false, true, false, true])
    glitch = step(glitch, value, 2);
  TestValidator.equals("glitch", glitch.value, false);
  TestValidator.equals("agreement", step(once, false, 2), {
    value: false,
    count: 0,
  });
  for (const window of [0, 1])
    TestValidator.equals(
      `window ${window}`,
      step(physicalGlitchFilter.set(false), true, window).value,
      true,
    );
  TestValidator.equals("new", physicalGlitchFilter.set(), {
    value: false,
    count: 0,
  });
}
