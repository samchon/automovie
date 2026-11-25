import {
  AutoMovieLoftChain,
  AutoMovieLoftJet,
  AutoMovieLoftPoint,
} from "@automovie/engine";
import type {
  IAutoMovieLoftChain,
  IAutoMovieLoftSurfaceJet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionNativeContinuation as Made } from "../../internal/construction/ConstructionNativeContinuation";
import { nclose } from "../../internal/predicates";

/**
 * A loft chain of the polynomial circle r(y) = 3 + y + y^2 (a circle about the
 * y axis whose radius is that polynomial in the station y, authored with exact
 * first and second station derivatives) is read by `AutoMovieLoftChain`,
 * `AutoMovieLoftJet` and `AutoMovieLoftPoint` against the closed form
 *
 * P = (r cos t, y, r sin t), p_s = (r' cos t, 1, r' sin t), p_t = (-r sin t, 0,
 * r cos t), p_ss = (2 cos t, 0, 2 sin t), p_st = (-r' sin t, 0, r' cos t), p_tt
 * = (-r cos t, 0, -r sin t), with r' = 1 + 2y,
 *
 * Every component within 2e-8.
 *
 * Chain: stations 0, 0.5 and 1, section order 64, 40 samples.
 *
 * Scenarios:
 *
 * 1. `AutoMovieLoftChain.bracket` of 0.25 is the layers [0, 1] and of 0.75 the
 *    layers [1, 2].
 * 2. `AutoMovieLoftJet.at` at stations 0, 0.125, 0.5, 0.9, 1 and phases -0.31, 0,
 *    0.77, 3.7 equals the closed form in all six vectors.
 * 3. `AutoMovieLoftChain.point` and `AutoMovieLoftPoint.point` equal the closed
 *    point, and `AutoMovieLoftPoint.sampler` of a station at several phases
 *    gives the same points as `point`.
 */
export function test_engine_geometry_loft_jet(): void {
  const chain: IAutoMovieLoftChain = Made.chain(
    Made.source("circle", 64, 40, 0),
  );
  const near = (
    actual: readonly number[],
    expected: readonly number[],
  ): boolean =>
    actual.length === expected.length &&
    actual.every((value: number, index: number): boolean =>
      nclose(value, expected[index]!, 2e-8),
    );

  TestValidator.equals(
    "bracket low",
    AutoMovieLoftChain.bracket(chain, 0.25),
    [0, 1],
  );
  TestValidator.equals(
    "bracket high",
    AutoMovieLoftChain.bracket(chain, 0.75),
    [1, 2],
  );

  const keys: (keyof IAutoMovieLoftSurfaceJet)[] = [
    "p",
    "s",
    "t",
    "ss",
    "st",
    "tt",
  ];
  const stations: number[] = [0, 0.125, 0.5, 0.9, 1];
  const phases: number[] = [-0.31, 0, 0.77, 3.7];
  for (const s of stations)
    for (const phi of phases) {
      const expected: IAutoMovieLoftSurfaceJet = Made.oracle(s, phi, 1);
      const actual: IAutoMovieLoftSurfaceJet = AutoMovieLoftJet.at(
        chain,
        s,
        phi,
      );
      for (const key of keys)
        TestValidator.predicate(
          `jet ${key} at ${s}/${phi}`,
          near(actual[key], expected[key]),
        );
      TestValidator.predicate(
        `chain point at ${s}/${phi}`,
        near(AutoMovieLoftChain.point(chain, s, phi), expected.p),
      );
      TestValidator.predicate(
        `loft point at ${s}/${phi}`,
        near(AutoMovieLoftPoint.point(chain, s, phi), expected.p),
      );
    }
  for (const s of stations) {
    const read = AutoMovieLoftPoint.sampler(chain, s);
    for (const phi of phases)
      TestValidator.equals(
        `sampler at ${s}/${phi}`,
        read(phi),
        AutoMovieLoftPoint.point(chain, s, phi),
      );
  }
}
