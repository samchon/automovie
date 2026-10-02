import { evaluateHumanFacePassage } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { throwsError } from "../internal/predicates";

/**
 * A tongue triangle crossing the incisal slab cannot pass sealed apertures
 * merely because none of its original vertices falls inside the slab.
 *
 * Scenarios:
 * 1. The analytic triangle spans z=-2 to z=2 around a half-metre slab;
 *    all vertices lie outside it, but its clipped section has positive height
 *    and must refuse a zero interincisal gap.
 */
export const test_subject_human_passage_sparse_slab = (): void => {
  const { basis } = humanFaceContactFixture();
  TestValidator.predicate(
    "a sparse tongue section cannot pass sealed incisors",
    throwsError(
      () => evaluateHumanFacePassage(
        basis.contact!,
        [0, -1, -2, 0, 1, 2, 1, -1, 2],
        {
          up: { x: 0, y: 1, z: 0 },
          forward: { x: 0, y: 0, z: 1 },
          lips: { gap: 0 },
          incisors: {
            upper: { x: 0, y: 0, z: 0 },
            lower: { x: 0, y: 0, z: 0 },
            gap: 0,
          },
        },
        [0, 1, 2],
      ),
      "cannot pass the incisors",
    ),
  );
};
