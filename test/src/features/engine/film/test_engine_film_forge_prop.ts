import { AutoMovieEngineFilm } from "@automovie/engine";
import {
  type IAutoMovieForgedProp,
  IAutoMoviePropSpec,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createDoorPropSpec } from "../../internal/createDoorPropSpec";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify the articulated door and the rigid control, and state what accepted output carries into staging.
 * @evidence contracts/development/testing.md#behavioral-verification The test forges the full authored door and a version with articulation removed, then compares success and the returned spec used by staging.
 * @evidence contracts/development/testing.md#independent-expectations The fixture includes the required generated model, physical body and affordance. Its articulation binds its own declared nodes. Removing the articulation leaves the same valid model, so any articulation-specific gate cannot apply to the rigid case.
 */
export function test_engine_film_forge_prop(): void {
  const spec: IAutoMoviePropSpec = createDoorPropSpec();
  const forged: IAutoMovieForgedProp = AutoMovieEngineFilm.forgeProp(spec);
  TestValidator.equals("articulated prop passes", forged.success, true);
  TestValidator.equals(
    "accepted spec echoed",
    forged.success === true ? forged.prop.node : null,
    "door",
  );

  const rigid: IAutoMovieForgedProp = AutoMovieEngineFilm.forgeProp({
    ...spec,
    articulation: null,
  });
  TestValidator.equals("rigid prop passes", rigid.success, true);
}
