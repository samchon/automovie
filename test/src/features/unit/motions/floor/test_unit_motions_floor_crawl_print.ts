import type {
  IAutoMovieMotionHumanCrawl,
  IAutoMovieVector3,
} from "@automovie/interface";
import { crawlPrint } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of one turn by a right angle and one sum, metres. */
const ROUNDING: number = 1e-12;

/**
 * `crawlPrint` places a limb's print in the floor frame: its nominal place
 * moved along the heading by the stride times the landed share for the entry
 * print and the limb's centred share after, turned by the frame's yaw (local
 * `(x, z)` to world `(z, -x)` at 90 degrees) and moved to its origin.
 *
 * The frame here stands at (1, 0, 2) facing 90 degrees; the left hand's nominal
 * place is (0.1, 0, 0.2), the stride 0.5 m, the landed share a quarter and the
 * centred share of print `j` is `j`.
 *
 * Scenarios:
 *
 * 1. The entry print is 0.125 m ahead of the nominal place: local (0.1, 0,
 *    0.325), world (1.325, 0, 1.9).
 * 2. Print 2 is a metre ahead: local (0.1, 0, 1.2), world (2.2, 0, 1.9).
 */
export function test_unit_motions_floor_crawl_print(): void {
  const nominal: Record<IAutoMovieMotionHumanCrawl.Limb, IAutoMovieVector3> = {
    leftHand: { x: 0.1, y: 0, z: 0.2 },
    rightHand: { x: -0.1, y: 0, z: 0.2 },
    leftKnee: { x: 0.1, y: 0.05, z: -0.3 },
    rightKnee: { x: -0.1, y: 0.05, z: -0.3 },
  };
  const print: (
    limb: IAutoMovieMotionHumanCrawl.Limb,
    j: number,
  ) => IAutoMovieVector3 = crawlPrint({
    frame: { origin: { x: 1, y: 0, z: 2 }, yaw: 90 },
    nominal,
    stride: 0.5,
    landed: 0.25,
    centred: (_limb: IAutoMovieMotionHumanCrawl.Limb, j: number): number => j,
  });
  TestValidator.predicate(
    "the entry print",
    vclose(print("leftHand", 0), { x: 1.325, y: 0, z: 1.9 }, ROUNDING),
  );
  TestValidator.predicate(
    "the second print",
    vclose(print("leftHand", 2), { x: 2.2, y: 0, z: 1.9 }, ROUNDING),
  );
}
