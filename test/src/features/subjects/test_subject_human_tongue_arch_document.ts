import { resolveHumanFaceDocument } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";
import { portraitTongueFixture } from "../internal/portraitTongueFixture";
import { throwsError } from "../internal/predicates";

/**
 * Document resolution refuses a tongue its lower arch cannot contain.
 *
 * Scenarios:
 * 1. A fixture tongue behind a 24 by 18 mm lower arch resolves.
 * 2. The same document with a 35 mm half-width tongue is refused with the
 *    width cause, and the caller's document keeps its authored values.
 * 3. Without a lower row the wide tongue is not compared and resolves.
 */
export const test_subject_human_tongue_arch_document = (): void => {
  const crown = { width: 5, height: 7, depth: 1.5, cervicalWidth: 0.8, edgeRise: 0.3 };
  const document = (halfWidth: number, lower: boolean) => {
    const face = humanFaceFixture("tongue-arch");
    face.basis.bindings.jawHinge = { x: 0, y: 0, z: -45 };
    face.basis.recipe.tongue = { ...portraitTongueFixture(), halfWidth };
    if (lower)
      face.basis.recipe.lowerDentition = {
        row: { halfWidth: 24, depth: 18, gap: 0.1, crowns: [crown] },
        placement: { drop: 5, recess: 5 },
      };
    return face;
  };
  resolveHumanFaceDocument(document(18, true));
  const wide = document(35, true);
  TestValidator.predicate(
    "wide tongue is refused",
    throwsError(() => resolveHumanFaceDocument(wide), "wider than the lower dental arch"),
  );
  TestValidator.equals(
    "caller values unchanged",
    wide.basis.recipe.tongue?.halfWidth,
    35,
  );
  resolveHumanFaceDocument(document(35, false));
};
