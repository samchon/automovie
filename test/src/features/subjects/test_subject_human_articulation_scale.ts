import { measureHumanFaceBasisChannels } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceArticulationFixture } from "../internal/humanFaceArticulationFixture";
import { nclose } from "../internal/predicates";

/**
 * A joint-driving channel measures as the builder poses it, not as its
 * residual rows alone.
 *
 * On the analytic articulated basis, full opening turns the arch 90 degrees
 * about +X through the origin and adds 0.1 along +Z: arch vertex (0, -1, 1)
 * lands at (0, -1, -0.9), 1.9 away; (0, -1, 0) and (1, -1, 0) land 0.9 below
 * and one back, sqrt(1.81) away. On the skin the fully attached (0, 1, 0)
 * moves to (0, 0, 1.1), sqrt(2.21) away; the half-attached (1, 1, 0) moves
 * halfway to its rigid image (1, 0, 1.1), sqrt(0.25 + 0.3025) away; vertex 0
 * carries the 0.01 residual row and vertex 1 nothing. The globe is not
 * attached to the jaw. Ten vertices are resident, so the rms is the root of
 * the sum of those squares over ten, the peak is 1.9 and six vertices move.
 * A gaze channel measures the globe's turn the same way, and a plain
 * expression still measures its rows.
 *
 * Scenarios:
 * 1. The opening channel's rms, peak and moved count follow the posed arch
 *    and skin, exactly as hand-computed.
 * 2. The gaze channel measures the globe's rotation about its centre.
 * 3. The shape channel measures its rows only.
 */
export const test_subject_human_articulation_scale = (): void => {
  const { basis } = humanFaceArticulationFixture();
  const scales = new Map(
    measureHumanFaceBasisChannels(basis).map((scale) => [scale.id, scale]),
  );
  const open = scales.get("open")!.positive;
  const squares = 0.01 ** 2 + (0.25 + 0.3025) + 2.21 + 1.9 ** 2 + 2 * 1.81;
  TestValidator.predicate(
    "opening measures the posed arch and skin",
    nclose(open.displacement, Math.sqrt(squares / 10)) &&
      nclose(open.peak, 1.9) &&
      open.vertices === 6,
  );
  const gaze = scales.get("gazeUp")!.positive;
  // Globe vertex (2, 0, 1) turns 90 degrees about -X through (2, 0, 0) to
  // (2, 1, 0), sqrt(2) away; (2, 1, 1) lands at (2, 1, -1), 2 away; (3, 0, 1)
  // moves like the first. The skin residual row adds 0.05 on one vertex.
  TestValidator.predicate(
    "gaze measures the globe's turn about its centre",
    nclose(gaze.displacement, Math.sqrt((2 + 4 + 2 + 0.05 ** 2) / 10)) &&
      nclose(gaze.peak, 2) &&
      gaze.vertices === 4,
  );
  TestValidator.predicate(
    "a shape channel measures its rows only",
    nclose(scales.get("spacing")!.positive.peak, 1) &&
      scales.get("spacing")!.positive.vertices === 1,
  );
};
