import { createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  articulatedPositions,
  humanFaceArticulationFixture,
} from "../internal/humanFaceArticulationFixture";
import { nclose } from "../internal/predicates";

/**
 * A globe turns about its centre landmark, and the landmark follows identity.
 * Scenarios:
 * 1. Half gaze turns the globe 45 degrees about -X through the centre, so a
 *    vertex one metre in front of the centre rises along the arc.
 * 2. Skin without an eye attachment does not move with gaze beyond its own
 *    residual row.
 * 3. A shape channel that moves the centre landmark moves the pivot with it:
 *    the same gaze at the shifted identity turns about the shifted centre.
 * 4. Zero gaze leaves the globe at rest exactly.
 * 5. A gaze channel's eccentric translation shifts the turned globe by its
 *    weighted amount.
 */
export const test_subject_human_articulation_eyes = (): void => {
  const { basis, document } = humanFaceArticulationFixture();
  const build = createHumanFaceBasisBuilder(basis);
  const globe = (
    shape: Record<string, number>,
    expression: Record<string, number>,
  ) =>
    articulatedPositions(
      build({ ...document, shape, expression }),
      "globe/all",
    );
  // Vertex 0 rests at (2, 0, 1), one metre in front of the centre (2, 0, 0).
  // A turn of a about -X maps (y, z) to (y cos a + z sin a, -y sin a + z cos a).
  const half = globe({}, { gazeUp: 0.5 });
  const s = Math.SQRT1_2;
  TestValidator.predicate(
    "half gaze sits on the arc about the centre",
    nclose(half[0], 2) && nclose(half[1], s) && nclose(half[2], s),
  );
  const skin = articulatedPositions(
    build({ ...document, expression: { gazeUp: 1 } }),
    "skin/all",
  );
  TestValidator.predicate(
    "skin carries only its authored residual under gaze",
    nclose(skin[2], 0.05) && nclose(skin[3 * 3 + 2], 0),
  );
  const spaced = globe({ spacing: 1 }, { gazeUp: 1 });
  TestValidator.predicate(
    "the shifted identity turns about the shifted centre",
    nclose(spaced[0], 2) && nclose(spaced[1], 1) && nclose(spaced[2], 0),
  );
  TestValidator.equals(
    "zero gaze is the rest globe",
    globe({}, { gazeUp: 0 }),
    basis.surfaces[2].positions,
  );
  const shifted = humanFaceArticulationFixture().basis;
  shifted.articulation!.eyes[0].gaze[0].translation = [0.2, 0, 0];
  const moved = articulatedPositions(
    createHumanFaceBasisBuilder(shifted)({
      ...document,
      expression: { gazeUp: 0.5 },
    }),
    "globe/all",
  );
  TestValidator.predicate(
    "the eccentric translation adds to the turned globe",
    nclose(moved[0], 2.1) && nclose(moved[1], s) && nclose(moved[2], s),
  );
};
