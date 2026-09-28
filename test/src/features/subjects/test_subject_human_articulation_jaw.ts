import { createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  articulatedPositions,
  humanFaceArticulationFixture,
} from "../internal/humanFaceArticulationFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The mandible turns about its condylar axis on the arc, with its coupled
 * translation, and refuses to leave its envelope.
 * Scenarios:
 * 1. Half opening puts an arch vertex at 45 degrees on the arc plus half the
 *    coupled translation, not on the chord of the full endpoint.
 * 2. Full opening is the full rotation plus the full translation.
 * 3. Protrusion and each laterotrusion add their translations to the arch.
 * 4. Opening and protrusion together past the sagittal budget refuse by name;
 *    a tenth of the protrusion at full opening still builds.
 */
export const test_subject_human_articulation_jaw = (): void => {
  const { basis, document } = humanFaceArticulationFixture();
  const build = createHumanFaceBasisBuilder(basis);
  const arch = (expression: Record<string, number>) =>
    articulatedPositions(build({ ...document, expression }), "arch/all");
  // Vertex 2 of the arch rests at (0, -1, 1): a positive turn about +X of
  // angle a maps (y, z) to (y cos a - z sin a, y sin a + z cos a).
  const half = arch({ open: 0.5 });
  const s = Math.SQRT1_2;
  TestValidator.predicate(
    "half opening sits on the arc with half the coupled translation",
    nclose(half[6], 0) &&
      nclose(half[7], -s - s) &&
      nclose(half[8], -s + s + 0.05),
  );
  const chordY = (-1 + 1) / 2;
  TestValidator.predicate(
    "the chord midpoint of the full endpoint is not where the arc is",
    !nclose(half[7], chordY),
  );
  const full = arch({ open: 1 });
  TestValidator.predicate(
    "full opening is the full rotation plus the translation",
    nclose(full[6], 0) && nclose(full[7], -1) && nclose(full[8], -1 + 0.1),
  );
  const forward = arch({ forward: 1 });
  TestValidator.predicate(
    "protrusion translates the arch along +Z",
    nclose(forward[2], 0.5) && nclose(forward[0], 0) && nclose(forward[1], -1),
  );
  const left = arch({ left: 1 });
  const right = arch({ right: 0.5 });
  TestValidator.predicate(
    "laterotrusion translates the arch along its side",
    nclose(left[0], 0.3) && nclose(right[0], -0.15),
  );
  TestValidator.predicate(
    "opening and protrusion past the sagittal budget refuse",
    throwsError(() => arch({ open: 1, forward: 1 }), "budget"),
  );
  TestValidator.predicate(
    "a protrusion inside the remaining budget still builds",
    nclose(arch({ open: 1, forward: 0.1 })[8], -1 + 0.1 + 0.05),
  );
};
