import { TestValidator } from "@nestia/e2e";

import { withBodyCorrective } from "../../../scripts/body-basis/withBodyCorrective";
import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";

/**
 * A corrective is appended to a basis as an endpoint of its own id with its
 * rest rows sorted by vertex and stored at 10 micrometres.
 *
 * The basis is the analytic box (see `humanBodyBasisFixture`) with the
 * corrective `wideTall` and six targets. The drivers are a joint ramp and a
 * channel side, the two kinds the solver publishes.
 *
 * Scenarios:
 * 1. Rows given out of order come back sorted by vertex, each stored at five
 *    decimals (2.3456789 mm rounds to 0.00235 m), and the corrective is added
 *    with gain one, the new id as its target and its drivers as given.
 * 2. A row that moves nothing a micrometre (below 1e-6 in length, or that
 *    rounds to zero at five decimals) is dropped while its neighbours stay.
 * 3. A solve whose every row is dropped, and one with no rows, has nothing to
 *    publish and returns null.
 * 4. The input basis is not mutated, the earlier correctives and targets are
 *    kept, and the surfaces after the first are shared.
 */
export const test_human_body_corrective_rows = (): void => {
  const { basis } = humanBodyBasisFixture();
  const before = JSON.stringify(basis);
  const inputs = [
    {
      bone: "spine" as const,
      axis: "flexion" as const,
      side: "positive" as const,
      onset: 30,
      full: 90,
    },
    { channel: "width", side: "negative" as const, onset: 0, full: 1 },
  ];

  // 1. sorted and stored
  const merged = withBodyCorrective(
    basis,
    "pose/spine.flexion@90",
    inputs,
    new Map([
      [6, [0.0023456789, 0, -0.001]],
      [2, [0, 0.0049999, 0]],
    ]),
  )!;
  TestValidator.equals(
    "rows sorted by vertex at ten micrometres",
    merged.surfaces[0].targets["pose/spine.flexion@90"],
    [2, 0, 0.005, 0, 6, 0.00235, 0, -0.001],
  );
  const added = merged.correctives!.find(
    (corrective) => corrective.id === "pose/spine.flexion@90",
  )!;
  TestValidator.equals("gain one", added.weight, 1);
  TestValidator.equals("the id names the endpoint", added.target, added.id);
  TestValidator.equals("the drivers are kept", added.inputs, inputs);

  // 2. tiny rows
  const sparse = withBodyCorrective(
    basis,
    "pose/tiny",
    inputs,
    new Map([
      [0, [0.0000009, 0, 0]],
      [1, [0.000004, 0, 0]],
      [3, [0.000001, 0.000001, 0.000001]],
      [5, [0.001, 0, 0]],
    ]),
  )!;
  TestValidator.equals(
    "only the rows that move something remain",
    sparse.surfaces[0].targets["pose/tiny"],
    [5, 0.001, 0, 0],
  );

  // 3. nothing to publish
  TestValidator.equals(
    "every row below a micrometre",
    withBodyCorrective(basis, "pose/none", inputs, new Map([[0, [1e-7, 0, 0]]])),
    null,
  );
  TestValidator.equals(
    "no rows at all",
    withBodyCorrective(basis, "pose/empty", inputs, new Map()),
    null,
  );

  // 4. the input is intact
  TestValidator.equals("the input basis is not mutated", JSON.stringify(basis), before);
  TestValidator.equals(
    "the earlier corrective is kept",
    merged.correctives!.length,
    (basis.correctives ?? []).length + 1,
  );
  TestValidator.predicate(
    "the earlier targets are kept",
    Object.keys(basis.surfaces[0].targets).every(
      (name) => merged.surfaces[0].targets[name] === basis.surfaces[0].targets[name],
    ),
  );
};
