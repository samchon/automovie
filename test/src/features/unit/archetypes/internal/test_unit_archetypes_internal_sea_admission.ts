import { AutoMovieArchetypeSea as sea } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Argument reduction for whole turns yields identical trigonometric inputs. */
const PERIODIC_TOLERANCE: number = 0;

/**
 * Significant height and heading admit a representable sea before sampling.
 *
 * Scenarios:
 *
 * 1. A zero height is calm at every sample and reports zero crest and slope.
 * 2. Negative height, a positive height below the representable spectrum and
 *    a heading that cannot define an angular direction are refused.
 * 3. Adding one full turn preserves elevation and slope for the same seed.
 */
export function test_unit_archetypes_internal_sea_admission(): void {
  const calm: sea.ISea = sea.of({height: 0, heading: 0, seed: 1});
  TestValidator.equals("zero height has no components", calm.components, []);
  TestValidator.equals("calm bounds and point", [calm.crest, calm.steepest, calm.elevation(1, 2, 3)], [0, 0, 0]);
  TestValidator.equals("calm slope", calm.slope(1, 2, 3), {x: 0, z: 0});
  TestValidator.error("negative height", (): unknown => sea.of({height: -1, seed: 1}));
  TestValidator.error("unrepresentable spectrum", (): unknown => sea.of({height: Number.MIN_VALUE, seed: 1}));
  TestValidator.error("unrepresentable heading", (): unknown => sea.of({height: 1, heading: Infinity, seed: 1}));

  const first: sea.ISea = sea.of({height: 1, heading: 45, seed: 1});
  const repeated: sea.ISea = sea.of({height: 1, heading: 405, seed: 1});
  TestValidator.predicate("elevation is periodic in the heading", nclose(first.elevation(2, 3, 4), repeated.elevation(2, 3, 4), PERIODIC_TOLERANCE));
  const a: ReturnType<sea.ISea["slope"]> = first.slope(2, 3, 4);
  const b: ReturnType<sea.ISea["slope"]> = repeated.slope(2, 3, 4);
  TestValidator.predicate("the slope shares the same bearing", nclose(a.x, b.x, PERIODIC_TOLERANCE) && nclose(a.z, b.z, PERIODIC_TOLERANCE));
}
