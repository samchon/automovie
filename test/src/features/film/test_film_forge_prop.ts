import { IAutoMoviePropSpec } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieForgedProp } from "../../../../packages/engine/src/film/IAutoMovieForgedProp";
import { forgeProp } from "../../../../packages/engine/src/film/forgeProp";
import { createDoorPropSpec } from "../internal/createDoorPropSpec";

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
 * @evidence contracts/testing.md#behavioral-verification Calls forgeProp with a fully admitted door and its rigid variant; success and the returned node identity show that articulated and articulation-null props reach the staging join.
 * @evidence contracts/testing.md#independent-expectations Both inputs satisfy the model contract and the articulated fixture's explicit hierarchy, driver, binding and travel declarations; expected success and node "door" follow those authored values, without deriving an oracle from forgeProp. This case does not prove every returned field is copied or immutable.
 * @evidence contracts/testing.md#distinguishing-cases Keeps the same model while changing articulation to null, isolating the optional articulation boundary. Malformed model/articulation refusals, dangling joint bindings and mesh reach are owned by the dedicated forge_prop_gates and forge_prop_articulation_mesh tests.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_forge_prop and calls portable TypeScript forgeProp over in-memory data, with no renderer, process or external asset; this function owns both cases.
 */
export function test_film_forge_prop(): void {
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
