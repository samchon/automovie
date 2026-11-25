import { AutoMovieGravity } from "@automovie/engine";
import { lineWalk, lineWalkFootprints } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * The `lineWalk` law's footprints (`lineWalkFootprints.pace`) and its sagging
 * line (`lineWalkFootprints.sagged`): heel to toe, enough foot lengths to cover
 * the way and at least one; a walker at the middle of a line sagging `sag`
 * needs `W L / (4 sag)`, refused beyond the 15 kN working load.
 *
 * Scenarios:
 *
 * 1. One metre forward on a 0.25 m foot is four 0.25 m steps; a metre back on a
 *    0.3 m foot is four -0.25 m steps; no way is one step of none.
 * 2. A 70 kg walker on a 10 m line sagging 0.1 m needs 70 g 25 ≈ 17.2 kN and is
 *    refused; sagging 0.2 m it needs 8.6 kN; a line without ends, or with no
 *    sag, is not checked.
 */
export function test_motions_exercise_line_walk(): void {
  TestValidator.equals(
    "the footprints",
    [
      lineWalkFootprints.pace(0, 1, 0.25, undefined),
      lineWalkFootprints.pace(1, 0, 0.3, undefined),
      lineWalkFootprints.pace(0, 0, 0.25, undefined),
    ],
    [
      { steps: 4, step: 0.25 },
      { steps: 4, step: -0.25 },
      { steps: 1, step: 0 },
    ],
  );
  TestValidator.predicate(
    "the working load",
    lineWalk.LOAD === 15000 &&
      nclose((70 * AutoMovieGravity.STANDARD * 10) / 0.4, 17161.6375, 1e-6) &&
      throwsError(() => lineWalkFootprints.sagged(70, 5, 0.1)) &&
      !throwsError(() => lineWalkFootprints.sagged(70, 5, 0.2)) &&
      !throwsError(() => lineWalkFootprints.sagged(70, Infinity, 0.01)) &&
      !throwsError(() => lineWalkFootprints.sagged(70, 5, 0)),
  );
}
