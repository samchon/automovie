import { createHumanLoopAzimuth } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * The azimuth lookup names the loop vertices on either side of an angle.
 *
 * The angle runs from +Z towards +X about the vertical through the centre, so
 * a vertex at (x, z) = (sin t, cos t) has angle t. The expected fractions are
 * hand-derived from a regular octagon of radius one, whose vertices lie every
 * pi / 4.
 *
 * Scenarios:
 * 1. Octagon vertex 2 is at pi / 2. Between vertices 0 and 1 the angle pi / 8
 *    is halfway; at a vertex's own angle the vertex is `low` with fraction
 *    zero; between vertices 7 (-pi / 4) and 0 (zero) the angle -pi / 8 is
 *    halfway; across the wrap at pi, between vertices 4 (pi) and 5
 *    (-3 pi / 4), the angle -7 pi / 8 is halfway.
 * 2. The same octagon walked backwards is the other winding: the answers name
 *    the loop indices of the walk given, so pi / 8 lies between the indices
 *    holding vertices 0 and 1, which are 7 and 6.
 * 3. A vertex directly above another (equal angle, a vertical loop edge) is
 *    allowed; looking up that angle names the upper one as `low`.
 * 4. Fewer than three vertices, a loop winding twice, a loop that doubles
 *    back and a loop not surrounding the axis each refuse.
 */
export const test_human_loop_azimuth = (): void => {
  const octagon = (turns = 1, count = 8) =>
    Array.from({ length: count * turns }, (_, k) => ({
      x: Math.sin((2 * Math.PI * k) / count),
      y: 0,
      z: Math.cos((2 * Math.PI * k) / count),
    }));
  const centre = { x: 0, z: 0 };
  const forward = createHumanLoopAzimuth(octagon(), centre);
  TestValidator.predicate(
    "vertex 2 is a quarter turn from +Z",
    nclose(forward.angle[2], Math.PI / 2, 1e-12),
  );
  const cases: [string, number, number, number, number][] = [
    ["between vertices 0 and 1", Math.PI / 8, 0, 1, 0.5],
    ["at a vertex", forward.angle[2], 2, 3, 0],
    ["between 7 and 0 across zero", -Math.PI / 8, 7, 0, 0.5],
    ["across the wrap at pi", (-7 * Math.PI) / 8, 4, 5, 0.5],
  ];
  for (const [title, angle, low, high, along] of cases) {
    const found = forward.bracket(angle);
    TestValidator.predicate(
      title,
      found.low === low &&
        found.high === high &&
        nclose(found.along, along, 1e-9),
    );
  }

  const backward = createHumanLoopAzimuth(octagon().reverse(), centre);
  const across = backward.bracket(Math.PI / 8);
  TestValidator.predicate(
    "a loop given the other way names its own indices",
    across.low === 7 && across.high === 6 && nclose(across.along, 0.5, 1e-9),
  );

  const vertical = createHumanLoopAzimuth(
    [
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0.5, z: 2 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: -1 },
      { x: -1, y: 0, z: 0 },
    ],
    centre,
  );
  TestValidator.equals(
    "looking up the shared angle names the upper vertex",
    [vertical.bracket(0).low, vertical.bracket(0).high],
    [1, 2],
  );

  TestValidator.predicate(
    "fewer than three vertices refuse",
    throwsError(
      () => createHumanLoopAzimuth(octagon().slice(0, 2), centre),
      "three vertices",
    ),
  );
  TestValidator.predicate(
    "a loop winding twice refuses",
    throwsError(
      () => createHumanLoopAzimuth(octagon(2, 8), centre),
      "wind once",
    ),
  );
  const at = (degrees: number) => ({
    x: Math.sin((degrees * Math.PI) / 180),
    y: 0,
    z: Math.cos((degrees * Math.PI) / 180),
  });
  TestValidator.predicate(
    "a loop that doubles back refuses",
    throwsError(
      () =>
        createHumanLoopAzimuth([at(0), at(120), at(60), at(240)], centre),
      "wind once",
    ),
  );
  TestValidator.predicate(
    "a loop not surrounding the axis refuses",
    throwsError(
      () =>
        createHumanLoopAzimuth(
          [
            { x: 1, y: 0, z: 1 },
            { x: 2, y: 0, z: 1 },
            { x: 1.5, y: 0, z: 2 },
          ],
          centre,
        ),
      "wind once",
    ),
  );
};
