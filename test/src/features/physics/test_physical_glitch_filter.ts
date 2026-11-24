import { physicalGlitchFilter } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The glitch filter takes a new value only after its input has held it for a
 * whole window of successive updates, as IHMC's `GlitchFilteredYoBoolean` does
 * (IHMC 201903 ihmc-robotics-toolkit, `update` l.77-89, `set` l.68-75).
 *
 * Scenarios:
 *
 * 1. A window of two: one differing update keeps the value and counts one; the
 *    second flips it and clears the count.
 * 2. A glitch, true, false, true, never flips a false filter of window two.
 * 3. An input equal to the value clears a running count.
 * 4. Windows of zero and one follow the input at once.
 * 5. `set` gives the value with no count, and a new filter is false.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the window rule and each scenario.
 * @evidence contracts/development/testing.md#behavioral-verification Advances the filter's returned state update by update and reads its value and count.
 * @evidence contracts/development/testing.md#independent-expectations The expected values follow the reference's counting rule by hand: count while the input differs, flip at the window, reset on agreement.
 * @evidence contracts/development/testing.md#distinguishing-cases A filter flipping one update early, keeping its count after a flip or not clearing it on agreement fails scenarios 1 to 3; the boundary windows are scenario 4.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on in-memory states.
 */
export function test_physical_glitch_filter(): void {
  const step = (
    state: physicalGlitchFilter.IState,
    value: boolean,
    window: number,
  ): physicalGlitchFilter.IState =>
    physicalGlitchFilter({ state, value, window });

  // 1. Two updates flip a window of two.
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

  // 2. A glitch never flips it.
  let glitch: physicalGlitchFilter.IState = physicalGlitchFilter.set(false);
  for (const value of [true, false, true, false, true])
    glitch = step(glitch, value, 2);
  TestValidator.equals("glitch", glitch.value, false);

  // 3. Agreement clears the count.
  TestValidator.equals("agreement", step(once, false, 2), {
    value: false,
    count: 0,
  });

  // 4. Windows of zero and one follow at once.
  for (const window of [0, 1])
    TestValidator.equals(
      `window ${window}`,
      step(physicalGlitchFilter.set(false), true, window).value,
      true,
    );

  // 5. A new filter is false with no count.
  TestValidator.equals("new", physicalGlitchFilter.set(), {
    value: false,
    count: 0,
  });
}
