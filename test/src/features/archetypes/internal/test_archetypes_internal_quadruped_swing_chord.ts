import {
  QuadrupedSwingChord
} from "../../../../../packages/archetypes/src/animals/quadruped/QuadrupedSwingChord";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * Two quarter-turn frames and one blend contribute fewer than 64 rounding steps
 * at horizontal magnitude up to 20.
 */
const POSITION_ROUNDING: number = 64 * 20 * Number.EPSILON;

/**
 * Swing blends a world chord with a path interpolated in the moving body frame.
 *
 * Scenarios:
 *
 * 1. The lifted foothold in the release frame is (1, 3, 2). The planted foothold
 *    in the landing frame is (1, 4, −3). At halfway, a quarter-turn body
 *    carries their midpoint onto (9.5, 103.5, 19), with height 6 retained from
 *    the world chord.
 * 2. At a quarter, the body path receives √2 − 1/2 of horizontal weight. Each
 *    endpoint settles on its original foothold.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two foot frames, horizontal blend, retained world height and exact foot anchors.
 * @evidence contracts/development/testing.md#behavioral-verification Samples the actual carried swing at each endpoint, the quarter and midpoint. Observes model-space transport and world-space vertical interpolation at different weights.
 * @evidence contracts/development/testing.md#independent-expectations A quarter-turn maps the two local midpoint coordinates to world X 9.5 and Z 19. The original foothold heights average to 6 independently of the carried body's height.
 */
export function test_archetypes_internal_quadruped_swing_chord(): void {
  const released: IAutoMovieTransform = {
    translation: { x: 1, y: 2, z: 0 },
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const touched: IAutoMovieTransform = {
    translation: { x: -2, y: 3, z: 5 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const current: IAutoMovieTransform = {
    ...released,
    translation: { x: 10, y: 100, z: 20 },
  };
  const lift: IAutoMovieVector3 = { x: 3, y: 5, z: -1 };
  const land: IAutoMovieVector3 = { x: -1, y: 7, z: 2 };
  const sample = (amount: number): IAutoMovieVector3 =>
    QuadrupedSwingChord.carried(current, lift, released, land, touched, amount);
  TestValidator.predicate(
    "body-carried midpoint with world height",
    vclose(sample(1 / 2), { x: 19 / 2, y: 6, z: 19 }, POSITION_ROUNDING),
  );
  const weight: number = Math.SQRT2 - 1 / 2;
  TestValidator.predicate(
    "quarter swings between world and body",
    vclose(
      sample(1 / 4),
      { x: 2 + weight * (35 / 4), y: 11 / 2, z: -1 / 4 + weight * (77 / 4) },
      POSITION_ROUNDING,
    ),
  );
  TestValidator.predicate(
    "lift stays anchored",
    vclose(sample(0), lift, POSITION_ROUNDING),
  );
  TestValidator.predicate(
    "landing stays anchored",
    vclose(sample(1), land, POSITION_ROUNDING),
  );
}
