import { forgeProp } from "@automovie/engine";
import {
  type IAutoMovieForgedProp,
  IAutoMoviePropSpec,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createDoorPropSpec } from "../../../internal/createDoorPropSpec";

/**
 * ForgeProp accepts a prop authored entirely as data (crude primitive parts
 * carrying a physical body, a stack-top affordance, and a self-declared hinge
 * articulation) when both the model contract and the articulation contract
 * hold.
 *
 * Scenarios:
 *
 * 1. The fully-loaded door prop passes and the accepted spec is echoed for the
 *    staging join.
 * 2. A rigid prop (articulation null) passes on the model contract alone: the
 *    articulation gates never fire for it.
 */
export function test_unit_engine_film_film_forge_prop(): void {
  const spec: IAutoMoviePropSpec = createDoorPropSpec();
  const forged: IAutoMovieForgedProp = forgeProp(spec);
  TestValidator.equals("articulated prop passes", forged.success, true);
  TestValidator.equals(
    "accepted spec echoed",
    forged.success === true ? forged.prop.node : null,
    "door",
  );

  const rigid: IAutoMovieForgedProp = forgeProp({
    ...spec,
    articulation: null,
  });
  TestValidator.equals("rigid prop passes", rigid.success, true);
}
