import {
  physicalPlanarPolygon as Polygon,
  physicalFootSwitch,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The foot switch reports a touchdown exactly when IHMC's wrench-based switch
 * does (`WrenchBasedFootSwitch.update` l.145-199 with Zulu's 50 N, 4 mm and 75
 * N): the low force over two updates with the centre of pressure 4 mm inside
 * over three, or the high force alone, and that decision held over two.
 *
 * Scenarios, a 0.2 x 0.1 m sole:
 *
 * 1. 60 N at the sole's centre hits on the fourth update: the low force passes on
 *    the second, the centre of pressure on the third, and the output, true from
 *    the third, on the fourth.
 * 2. 80 N hits on the second update, the high force needing no centre of pressure.
 * 3. 60 N with the centre of pressure 3 mm inside the edge never hits.
 * 4. Below 5 N no centre of pressure is resolved: with the low threshold at 1 N, 4
 *    N at the centre never hits.
 * 5. A distance that is not a number skips the test: 60 N hits on the third
 *    update.
 * 6. `reset` clears only the centre-of-pressure filter.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the thresholds, windows and each scenario's update count.
 * @evidence contracts/development/testing.md#behavioral-verification Advances the switch update by update and reads its output filter.
 * @evidence contracts/development/testing.md#independent-expectations The update counts follow from the reference's windows (2, 3, 2) and thresholds by hand, and the 3 mm case from the 4 mm margin.
 * @evidence contracts/development/testing.md#distinguishing-cases A switch without the output filter hits a step early in scenarios 1, 2 and 5; one ignoring the centre of pressure hits in 3; one resolving it below 5 N hits in 4.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on in-memory states.
 */
export function test_physical_foot_switch(): void {
  const outline: Polygon.IPoint[] = Polygon.hull([
    { x: -0.1, y: -0.05 },
    { x: 0.1, y: -0.05 },
    { x: 0.1, y: 0.05 },
    { x: -0.1, y: 0.05 },
  ]);
  const first = (
    force: number,
    pressure: Polygon.IPoint,
    thresholds?: Partial<physicalFootSwitch.IThresholds>,
  ): number => {
    let state: physicalFootSwitch.IState = physicalFootSwitch.initial();
    for (let update: number = 1; update <= 10; update++) {
      state = physicalFootSwitch({
        state,
        force,
        pressure,
        outline,
        // One update of the reference's period each, so a window counts
        // updates as the reference's does.
        dt: 0.003,
        period: 0.003,
        ...(thresholds ? { thresholds } : {}),
      });
      if (state.hit.value) return update;
    }
    return Infinity;
  };
  const centre: Polygon.IPoint = { x: 0, y: 0 };

  TestValidator.equals("low force", first(60, centre), 4);
  TestValidator.equals("high force", first(80, centre), 2);
  TestValidator.equals("near edge", first(60, { x: 0.097, y: 0 }), Infinity);
  TestValidator.equals("minimum force", first(4, centre, { low: 1 }), Infinity);
  TestValidator.equals(
    "no distance",
    first(60, centre, { distance: Number.NaN }),
    3,
  );

  // 6. Reset clears the centre-of-pressure filter only.
  const hit: physicalFootSwitch.IState = {
    low: { value: true, count: 0 },
    cop: { value: true, count: 0 },
    hit: { value: true, count: 0 },
  };
  TestValidator.equals("reset", physicalFootSwitch.reset(hit), {
    ...hit,
    cop: { value: false, count: 0 },
  });
}
