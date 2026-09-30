import { Vector3 } from "@automovie/engine";
import { limitHumanFaceHairTurn } from "@automovie/human/face/anatomy/hair/limitHumanFaceHairTurn";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/**
 * A hair turns at most step / 6 mm radians in one step: a wanted direction
 * within that is kept as it is, a sharper one is rotated by exactly that much
 * toward it, and an exactly opposite one, which spans no plane, goes straight.
 * Scenarios:
 * 1. A 3 mm step allows 0.5 rad. A wanted direction 0.2 rad away and one
 *    exactly 0.5 rad away are returned as the same object.
 * 2. A wanted direction 1 rad away in the xy plane and one in the xz plane
 *    come back at 0.5 rad in their own plane, unit length.
 * 3. The opposite direction returns the previous direction; one just short of
 *    opposite still turns by the limit.
 */
export const test_subject_human_hair_turn_limit = (): void => {
  const before = Vector3.create(1, 0, 0);
  const at = (angle: number, plane: "y" | "z") =>
    Vector3.create(
      Math.cos(angle),
      plane === "y" ? Math.sin(angle) : 0,
      plane === "z" ? Math.sin(angle) : 0,
    );
  const step = 0.003;
  const within = at(0.2, "y");
  TestValidator.predicate(
    "a turn inside the limit is kept",
    limitHumanFaceHairTurn({ before, direction: within, step }) === within,
  );
  const exact = at(0.5, "y");
  TestValidator.predicate(
    "a turn just at the limit is kept",
    limitHumanFaceHairTurn({ before, direction: exact, step }) === exact ||
      vclose(
        limitHumanFaceHairTurn({ before, direction: exact, step }),
        exact,
        1e-12,
      ),
  );
  for (const plane of ["y", "z"] as const) {
    const held = limitHumanFaceHairTurn({
      before,
      direction: at(1, plane),
      step,
    });
    TestValidator.predicate(
      "a sharper turn is held to the limit in its own plane",
      vclose(held, at(0.5, plane), 1e-12) &&
        nclose(Vector3.length(held), 1, 1e-12),
    );
  }
  const opposite = Vector3.create(-1, 0, 0);
  TestValidator.predicate(
    "an exactly opposite direction goes straight",
    limitHumanFaceHairTurn({ before, direction: opposite, step }) === before,
  );
  const almost = Vector3.normalize(Vector3.create(-1, 1e-3, 0));
  TestValidator.predicate(
    "an almost opposite direction still turns by the limit",
    vclose(
      limitHumanFaceHairTurn({ before, direction: almost, step }),
      at(0.5, "y"),
      1e-9,
    ),
  );
};
