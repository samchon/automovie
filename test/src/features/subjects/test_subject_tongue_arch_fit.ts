import { assertPortraitTongueWithinArch } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { portraitTongueFixture } from "../internal/portraitTongueFixture";
import { throwsError } from "../internal/predicates";

/**
 * A resting tongue must fit between the teeth of the lower arch that holds it.
 *
 * Scenarios:
 * 1. The fixture tongue in a 24 by 18 mm arch fits; the maximum tongue (35 mm
 *    half-width) does not, and the cause names the width and the arch's room.
 * 2. Where the whole tongue lies behind the arch's ellipse the room is a minus
 *    the crown half-depth: a 60 mm tongue of half-width 19 in a 20 mm arch of
 *    crown depth 1 fits at the mid-body ring and 19.001 does not, exactly.
 * 3. A tongue whose tip is at the incisors' lingual face has no room there and
 *    is refused; a tongue wholly in front of the arch, as a protruded one is,
 *    is not compared. A nonfinite recess and a row without crowns refuse.
 */
export const test_subject_tongue_arch_fit = (): void => {
  const crown = { width: 5, height: 7, depth: 1, cervicalWidth: 0.8, edgeRise: 0.3 };
  const arch = (halfWidth: number, depth: number) => ({
    halfWidth,
    depth,
    gap: 0.1,
    crowns: [crown],
  });
  assertPortraitTongueWithinArch(
    { ...portraitTongueFixture(), recess: 12 },
    arch(24, 18),
    5,
  );
  TestValidator.predicate(
    "maximum tongue is refused with its cause",
    throwsError(
      () =>
        assertPortraitTongueWithinArch(
          { ...portraitTongueFixture(), halfWidth: 35 },
          arch(24, 18),
          5,
        ),
      "wider than the lower dental arch",
    ),
  );
  const long = { ...portraitTongueFixture(), length: 60, recess: 15 };
  assertPortraitTongueWithinArch({ ...long, halfWidth: 19 }, arch(20, 15), 0);
  TestValidator.predicate(
    "the room behind the arch is exact",
    throwsError(() =>
      assertPortraitTongueWithinArch(
        { ...long, halfWidth: 19.001 },
        arch(20, 15),
        0,
      ),
    ),
  );
  TestValidator.predicate(
    "a tongue tip inside the incisors is refused",
    throwsError(
      () =>
        assertPortraitTongueWithinArch(
          { ...long, halfWidth: 5, recess: 0 },
          arch(20, 15),
          0,
        ),
      "0.0 mm",
    ),
  );
  assertPortraitTongueWithinArch(
    { ...long, halfWidth: 35, recess: 0 },
    arch(20, 15),
    80,
  );
  TestValidator.predicate(
    "nonfinite recess refuses",
    throwsError(() =>
      assertPortraitTongueWithinArch(long, arch(20, 15), Infinity),
    ),
  );
  TestValidator.predicate(
    "an arch without crowns refuses",
    throwsError(() =>
      assertPortraitTongueWithinArch(long, { ...arch(20, 15), crowns: [] }, 0),
    ),
  );
};
