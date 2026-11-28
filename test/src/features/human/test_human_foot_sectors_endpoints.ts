import { AutoMovieHumanFootSectors } from "@automovie/human";
import type { IAutoMovieHumanFootSectors } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Foot-ring across-coordinate queries include every endpoint and preserve crossing priority.
 *
 * Scenarios:
 * 1. An out-of-range query selects the terminal endpoint of the sole listed piece and reports its true gap.
 * 2. An interior crossing and exact endpoint return their ring phases without reporting a miss.
 * 3. A constant-across segment contains an exact hit and keeps its first vertex; an equally distant miss keeps that vertex too.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the missing terminal endpoint, exact-hit and deterministic-tie cases and their observable phases and miss receipts.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual piece/join/find API and checks returned phases, sampled across positions and miss messages; the old segment-start-only fallback fails the terminal-endpoint case.
 * @evidence contracts/development/testing.md#independent-expectations A unit horizontal segment occupies half the ring, so its endpoint is pi and its midpoint pi/2. One-coordinate distance to the endpoint from x=2 is one millimetre. The 1e-12 tolerance covers floating arithmetic on these unit-scale inputs without admitting the old pi phase error. The unit ring separates a miss from an interior, terminal or constant-across hit. Equal nearest gaps retain the first vertex.
 */
export function test_human_foot_sectors_endpoints(): void {
  const misses: string[] = [];
  const ring: IAutoMovieHumanFootSectors.ISectors =
    AutoMovieHumanFootSectors.join(
      [
        AutoMovieHumanFootSectors.piece([
          [0, 0],
          [1, 0],
        ]),
        AutoMovieHumanFootSectors.piece([
          [1, 0],
          [0, 0],
        ]),
      ],
      [1, 1],
      (detail: string): void => {
        misses.push(detail);
      },
    );
  const nearest: number = ring.find(2, [0]);
  TestValidator.predicate(
    "terminal endpoint is nearest",
    nclose(nearest, Math.PI, 1e-12),
  );
  TestValidator.predicate(
    "returned phase addresses nearest point",
    nclose(ring.at(nearest)[0], 1, 1e-12),
  );
  TestValidator.equals("one miss receipt", misses.length, 1);
  TestValidator.predicate(
    "actual nearest across gap",
    misses[0]!.includes("1.00 mm outside"),
  );

  // Existing interior interpolation and exact endpoint hits do not report misses.
  TestValidator.predicate(
    "interior crossing",
    nclose(ring.find(0.5, [0]), Math.PI / 2, 1e-12),
  );
  TestValidator.predicate(
    "exact terminal crossing",
    nclose(ring.find(1, [0]), Math.PI, 1e-12),
  );
  TestValidator.equals(
    "successful queries preserve receipt count",
    misses.length,
    1,
  );

  // A vertical segment has valid arclength even though its across coordinate is constant.
  const vertical: IAutoMovieHumanFootSectors.ISectors =
    AutoMovieHumanFootSectors.join(
      [
        AutoMovieHumanFootSectors.piece([
          [1, 0],
          [1, 1],
        ]),
        AutoMovieHumanFootSectors.piece([
          [1, 1],
          [0, 0],
          [1, 0],
        ]),
      ],
      [1, 1],
      (detail: string): void => {
        misses.push(detail);
      },
    );
  TestValidator.predicate(
    "constant-coordinate exact hit",
    nclose(vertical.find(1, [0]), 0, 1e-12),
  );
  TestValidator.equals(
    "constant-coordinate hit is not a miss",
    misses.length,
    1,
  );
  TestValidator.predicate(
    "equal nearest gaps retain first vertex",
    nclose(vertical.find(2, [0]), 0, 1e-12),
  );
  TestValidator.equals(
    "constant-coordinate miss is reported once",
    misses.length,
    2,
  );
}
