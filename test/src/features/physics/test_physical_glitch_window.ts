import {
  physicalBipedPlan,
  physicalFootSwitch,
  physicalGlitchFilter,
  physicalPushRecovery,
  physicalQuadPlan,
  physicalQuadTouchdown,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * Every reference window keeps its time in this controller's updates: a window
 * of n of the reference's updates lasts n times the reference controller's
 * period, Zulu's 3 ms for the biped's (`ZuluRobotModel` l.68) and the generic
 * quadruped's 1 ms for the quadruped's (`GenericQuadrupedSimulationFactory`
 * l.38).
 *
 * Scenarios, at this engine's 1/3840 s controller period and at 1/960 s:
 *
 * 1. Each window's update count times the period is within one update of the
 *    reference's time: the biped's safe window, 0.3 s, its foot switch's low,
 *    centre-of-pressure and output windows, 6, 9 and 6 ms, the quadruped's
 *    safe window, 0.1 s, and its touchdown trigger, 1 ms.
 * 2. A filter given that window flips on exactly that update of a changed
 *    input, not one before.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, both reference periods and each window's time.
 * @evidence contracts/development/testing.md#behavioral-verification Converts each window and runs the filter on it, reading the flip.
 * @evidence contracts/development/testing.md#independent-expectations The reference times are the cited counts times the cited periods, by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases A window kept as a count of this controller's updates is 3.84 or 11.5 times too short at 1/3840 s and fails scenario 1; a filter flipping early fails scenario 2.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory.
 */
export function test_physical_glitch_window(): void {
  const failures: string[] = [];
  const windows: { name: string; count: number; period: number }[] = [
    {
      name: "biped safe",
      count: physicalPushRecovery.SAFE_WINDOW,
      period: physicalBipedPlan.CONTROL_DT,
    },
    {
      name: "foot switch low",
      count: physicalFootSwitch.LOW_WINDOW,
      period: physicalBipedPlan.CONTROL_DT,
    },
    {
      name: "foot switch cop",
      count: physicalFootSwitch.COP_WINDOW,
      period: physicalBipedPlan.CONTROL_DT,
    },
    {
      name: "foot switch hit",
      count: physicalFootSwitch.HIT_WINDOW,
      period: physicalBipedPlan.CONTROL_DT,
    },
    {
      name: "quadruped safe",
      count: physicalPushRecovery.SAFE_WINDOW,
      period: physicalQuadPlan.CONTROL_DT,
    },
    {
      name: "quadruped trigger",
      count: physicalQuadTouchdown.TRIGGER_WINDOW,
      period: physicalQuadPlan.CONTROL_DT,
    },
  ];
  const expected: Record<string, number> = {
    "biped safe": 0.3,
    "foot switch low": 0.006,
    "foot switch cop": 0.009,
    "foot switch hit": 0.006,
    "quadruped safe": 0.1,
    "quadruped trigger": 0.001,
  };
  for (const dt of [1 / 3840, 1 / 960])
    for (const window of windows) {
      // 1. The window's time.
      const ticks: number = physicalGlitchFilter.ticks(
        window.count,
        window.period,
        dt,
      );
      if (!(Math.abs(ticks * dt - expected[window.name]!) <= dt + 1e-12))
        failures.push(
          `${window.name} at ${dt}: ${ticks} updates last ${ticks * dt} s, not ${expected[window.name]} s`,
        );

      // 2. The filter flips on that update.
      let state: physicalGlitchFilter.IState = physicalGlitchFilter.set(false);
      let flipped: number | undefined;
      for (let update: number = 1; update <= ticks + 1; update++) {
        state = physicalGlitchFilter({ state, value: true, window: ticks });
        if (state.value) {
          flipped = update;
          break;
        }
      }
      if (flipped !== ticks)
        failures.push(
          `${window.name} at ${dt}: the filter flipped on ${flipped}, not ${ticks}`,
        );
    }
  TestValidator.equals("glitch windows", failures, []);
}
