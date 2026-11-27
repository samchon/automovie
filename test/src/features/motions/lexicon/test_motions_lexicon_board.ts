import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanBoardAdmit
} from "../../../../../packages/motions/src/lexicon/internal/HumanBoardAdmit";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * The `HumanBoard` law's admission of the way to the seat
 * (`HumanBoardAdmit.way`): the take-off at most 1.5 m/s against the seat, and
 * the way to the seated key at most 2.5 m across, 1.5 m up and 3 m down.
 *
 * Scenarios:
 *
 * 1. Running level with the seat, a take-off 1 m behind and 1 m below it boards.
 * 2. A take-off 3 m away, 2 m below the seat, or slipping 2 m/s against it, is
 *    refused.
 */
export function test_motions_lexicon_board(): void {
  const at = (x: number, y: number): { root: IAutoMovieVector3 } => ({
    root: { x, y, z: 0 },
  });
  const seat: { root: IAutoMovieVector3 } = at(0, 1.5);
  TestValidator.predicate(
    "within reach",
    !throwsError(() => HumanBoardAdmit.way(0.2, at(-1, 0.5), seat)),
  );
  TestValidator.predicate(
    "too far, too low or too fast",
    throwsError(() => HumanBoardAdmit.way(0, at(-3, 1.5), seat)) &&
      throwsError(() => HumanBoardAdmit.way(0, at(0, -0.5), seat)) &&
      throwsError(() => HumanBoardAdmit.way(2, at(-1, 0.5), seat)),
  );
}
