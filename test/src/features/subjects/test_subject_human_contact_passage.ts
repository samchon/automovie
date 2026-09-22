import {
  type IAutoMovieHumanFaceContactSummary,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A tongue passes only through an aperture wider than it is.
 * Scenarios:
 * 1. Protrusion through closed incisors refuses, naming the channel, the
 *    thickness, the gap and how much the opening channel must add.
 * 2. Protrusion through an open jaw passes and reports its reach and slab
 *    thickness; a tongue behind the plane reports no passage.
 * 3. Protrusion through an open jaw whose lips are sealed refuses on the lips
 *    and names the closure channel.
 */
export const test_subject_human_contact_passage = (): void => {
  const { basis, document } = humanFaceContactFixture();
  let last: IAutoMovieHumanFaceContactSummary | null = null;
  const build = createHumanFaceBasisBuilder(basis, {
    observe: (summary) => {
      last = summary;
    },
  });
  TestValidator.predicate(
    "closed incisors refuse the tongue",
    throwsError(
      () => build({ ...document, expression: { out: 1 } }),
      [
        "cannot pass the incisors",
        "out puts a 300.0 mm tongue through a 200.0 mm gap",
        "open must open it by at least 100.0 mm more",
      ],
    ),
  );
  build({ ...document, expression: { out: 1, open: 1 } });
  TestValidator.predicate(
    "open jaw passes the tongue",
    last!.passage !== null &&
      nclose(last!.passage!.protrudingMetres, 0.5) &&
      nclose(last!.passage!.thicknessMetres, 0.3),
  );
  build({ ...document, expression: { open: 1 } });
  TestValidator.equals("tongue behind the plane", last!.passage, null);
  TestValidator.predicate(
    "sealed lips refuse the tongue",
    throwsError(
      () => build({ ...document, expression: { out: 1, open: 1, close: 1 } }),
      ["cannot pass the lips", "close must open it by at least"],
    ),
  );
};
