import { smoothMinimum } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The smooth minimum is the plain one away from the crossing and rounds the
 * corner with a continuous slope.
 *
 * Scenarios:
 * 1. Values a width or more apart return the plain minimum, in either order.
 * 2. Equal values fall a quarter of the width below them, the deepest the
 *    rounding goes; values in between fall by `h² width / 4` with
 *    `h = 1 - |a - b| / width`.
 * 3. Along `a` from 0 to 2 against `b = 1` with width 0.5 the result never
 *    exceeds the plain minimum, and its slope by finite differences runs from
 *    1 to 0 without a step larger than the differencing allows.
 * 4. The negated rule is a smooth maximum that never falls below the plain
 *    one.
 * 5. A non-finite value and a non-positive width throw.
 */
export function test_motion_smooth_minimum(): void {
  const close = (a: number, b: number, e: number = 1e-12): boolean =>
    Math.abs(a - b) <= e;
  TestValidator.predicate(
    "plain minimum a width or more apart",
    smoothMinimum(1, 1.5, 0.5) === 1 &&
      smoothMinimum(3, -2, 0.5) === -2 &&
      smoothMinimum(-2, 3, 0.5) === -2,
  );
  TestValidator.predicate(
    "a quarter of the width under equal values",
    close(smoothMinimum(1, 1, 0.5), 1 - 0.125) &&
      close(smoothMinimum(1, 1.25, 0.5), 1 - (0.5 * 0.5 * 0.5) / 4),
  );

  const h: number = 1e-4;
  let under: boolean = true;
  let steady: boolean = true;
  let last: number | undefined;
  for (let a: number = 0; a <= 2; a += h) {
    const value: number = smoothMinimum(a, 1, 0.5);
    under &&= value <= Math.min(a, 1) + 1e-15;
    const slope: number = (smoothMinimum(a + h, 1, 0.5) - value) / h;
    // The slope's own rate is at most 1 / (2 width) per unit, here 1.
    if (last !== undefined) steady &&= Math.abs(slope - last) <= 2 * h;
    last = slope;
  }
  TestValidator.predicate("never above the plain minimum", under);
  TestValidator.predicate("slope is continuous through the crossing", steady);
  TestValidator.predicate(
    "slope runs from one to none",
    close((smoothMinimum(h, 1, 0.5) - smoothMinimum(0, 1, 0.5)) / h, 1, 1e-9) &&
      close((smoothMinimum(2, 1, 0.5) - smoothMinimum(2 - h, 1, 0.5)) / h, 0),
  );

  let over: boolean = true;
  for (let a: number = -1; a <= 1; a += 0.01)
    over &&= -smoothMinimum(-a, -0.2, 0.3) >= Math.max(a, 0.2) - 1e-15;
  TestValidator.predicate("negated, never below the plain maximum", over);

  TestValidator.error("non-finite value", (): unknown =>
    smoothMinimum(Infinity, 0, 1),
  );
  TestValidator.error("zero width", (): unknown => smoothMinimum(0, 1, 0));
}
