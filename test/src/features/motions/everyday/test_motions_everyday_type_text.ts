import type {
  AutoMovieHumanSide,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  typeTextPresses
} from "../../../../../packages/motions/src/everyday/internal/typeTextPresses";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** Rounding of a few minimum-jerk products, metres. */
const ROUNDING: number = 1e-12;

/**
 * `typeTextPresses` reads each typing hand's fingertip: it reaches its key over
 * 40 % of the nominal interval before the press, descending from the hover
 * height to the key's travel, and lifts back over the other 60 % after it, each
 * share taken of the hand's actual gap to its neighbouring press where that is
 * shorter, so a lift ends where the next reach starts.
 *
 * Scenarios, a keyboard 0.75 m up, a 0.2 s interval, a 10 mm hover and 3 mm of
 * travel; the right hand presses keys 20 mm and 40 mm right of its home at 1
 * and 1.1 s, the left one 50 mm left of the board's middle at 2 s:
 *
 * 1. Before its first reach, at 0.5 s, the right fingertip hovers over its home.
 * 2. At its first press it is on the key, 3 mm down; half way through the lift,
 *    shortened to 0.6 of the 0.1 s gap, at 1.03 s, it is 3.5 mm up.
 * 3. The next reach starts where the lift ends, at 1.06 s, hovering over the first
 *    key, and after its last press the hand hovers over its last key.
 * 4. The left fingertip is on its key at its press.
 */
export async function test_motions_everyday_type_text(): Promise<void> {
  const key: (
    x: number,
    side: AutoMovieHumanSide,
  ) => {
    at: IAutoMovieVector3;
    side: AutoMovieHumanSide;
  } = (
    x: number,
    side: AutoMovieHumanSide,
  ): { at: IAutoMovieVector3; side: AutoMovieHumanSide } => ({
    at: { x, y: 0, z: 0 },
    side,
  });
  const tip: (side: AutoMovieHumanSide, seconds: number) => IAutoMovieVector3 =
    typeTextPresses(
      [key(0.02, "right"), key(0.04, "right"), key(-0.05, "left")],
      [1, 1.1, 2],
      0.2,
      { left: { x: -0.03, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
      { origin: { x: 0, y: 0.75, z: 0 }, yaw: 0 },
      0.01,
      0.003,
    );
  TestValidator.predicate(
    "the right hand",
    vclose(tip("right", 0.5), { x: 0, y: 0.76, z: 0 }, ROUNDING) &&
      vclose(tip("right", 1), { x: 0.02, y: 0.747, z: 0 }, ROUNDING) &&
      vclose(tip("right", 1.03), { x: 0.02, y: 0.7535, z: 0 }, ROUNDING) &&
      vclose(tip("right", 1.06), { x: 0.02, y: 0.76, z: 0 }, ROUNDING) &&
      vclose(tip("right", 3), { x: 0.04, y: 0.76, z: 0 }, ROUNDING),
  );
  TestValidator.predicate(
    "the left hand",
    vclose(tip("left", 2), { x: -0.05, y: 0.747, z: 0 }, ROUNDING),
  );
}
