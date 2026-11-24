import { AutoMovieHumanLimbRootStrip } from "@automovie/human";
import type { AutoMovieVector3Tuple } from "@automovie/interface";
import assert from "node:assert/strict";

/**
 * Both strip stencils prepare only their stated stations across two meridians.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the centred and edge ring jets in physical station.
 * @evidence contracts/development/testing.md#independent-expectations A quadratic has exact first and second derivatives in both stencils. Calls record the three centred and four edge sample stations.
 * @evidence contracts/development/testing.md#distinguishing-cases Reversing the signed edge step or requesting any row per meridian changes the readings or call sequence.
 * @evidence contracts/development/testing.md#execution-ownership Evaluates two in-memory polynomial meridians without a renderer or external source.
 * @evidence contracts/development/common.md#meaningful-documentation Each expected jet follows by differentiating the polynomial coordinates at station 3.
 */
export function test_human_limb_root_strip_stencils(): void {
  const stations: number[] = [];
  const ring = (s: number): AutoMovieVector3Tuple[] => {
    stations.push(s);
    return [
      [2 + s + 3 * s * s, 2 * s, 5],
      [-2 * s * s, 7, s - 1],
    ];
  };
  const expected = [
    { point: [32, 6, 5], first: [19, 2, 0], second: [6, 0, 0] },
    { point: [-18, 7, 2], first: [-12, 0, 1], second: [-4, 0, 0] },
  ];
  assert.deepEqual(
    AutoMovieHumanLimbRootStrip.centredRing(ring, 3, 0.5),
    expected,
  );
  assert.deepEqual(stations, [3, 2.5, 3.5]);
  stations.length = 0;
  // The one-sided zero first derivatives divide by a negative signed step.
  assert.deepEqual(AutoMovieHumanLimbRootStrip.edgeRing(ring, 3, -0.5), [
    { ...expected[0], first: [19, 2, -0] },
    { ...expected[1], first: [-12, -0, 1] },
  ]);
  assert.deepEqual(stations, [3, 2.5, 2, 1.5]);
}
