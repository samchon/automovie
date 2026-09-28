import { assertHumanBodyBasis } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * Every body basis name that can address an authored record is safe to look up
 * without inheriting a JavaScript Object property.
 *
 * Scenarios:
 * 1. Channel, corrective, endpoint, landmark, material, surface and region
 *    names that collide with Object's prototype refuse at basis admission.
 * 2. The same analytic body with its ordinary names still admits.
 */
export const test_human_body_record_key_names = (): void => {
  const changes: [string, (basis: ReturnType<typeof humanBodyBasisFixture>["basis"]) => void][] = [
    ["channel", (basis) => { basis.channels[0].id = "constructor"; }],
    ["corrective", (basis) => { basis.correctives![0].id = "toString"; }],
    ["endpoint", (basis) => { basis.channels[0].positive = "valueOf"; }],
    ["landmark", (basis) => { basis.landmarks.ids[0] = "__proto__"; }],
    ["material", (basis) => { basis.materials[0].id = "hasOwnProperty"; }],
    ["surface", (basis) => { basis.surfaces[0].id = "isPrototypeOf"; }],
    ["region", (basis) => { basis.surfaces[0].regions[0].id = "constructor"; }],
  ];
  for (const [title, change] of changes) {
    const { basis } = humanBodyBasisFixture();
    change(basis);
    TestValidator.predicate(
      title + " refuses inherited record keys",
      throwsError(() => assertHumanBodyBasis(basis), "record keys"),
    );
  }
  TestValidator.predicate(
    "ordinary anatomy names still admit",
    (() => {
      assertHumanBodyBasis(humanBodyBasisFixture().basis);
      return true;
    })(),
  );
};
