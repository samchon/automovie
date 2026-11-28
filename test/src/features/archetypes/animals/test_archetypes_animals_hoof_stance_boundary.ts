import type { AutoMovieArchetypeCourse } from "@automovie/archetypes";
import {
  QuadrupedHoofTrack as Hoof
} from "../../../../../packages/archetypes/src/animals/quadruped/QuadrupedHoofTrack";
import type { IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** The grid uses dyadic phases, so positions in the normalized swing are exact. */
const EXACT: number = 0;

/** One prepared course state with an independently specified stationary frame. */
const STATE: AutoMovieArchetypeCourse.IState = {
  distance: 0,
  progress: 0,
  speed: 0,
  curvature: 0,
  reverse: false,
  placement: {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
};

/**
 * One prepared hoof stance selects its fixed footprint and exact release.
 *
 * Scenarios:
 * 1. A half-stride stance holds only up to lift-off. At the normalized swing
 *    midpoint, rest-to-rest symmetry gives half travel and the apex.
 * 2. An initial standing request substitutes the initial placement and zero
 *    travel only for its preceding touchdown; the next stance is ordinary.
 * 3. A declared cross-step moves the opposite hoof toward the figure. The
 *    neutral fore offset is clamped to half the stance travel before rotation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States ordinary touchdown, lift-off, swing midpoint, initial standing and the proposed cross-step.
 * @evidence contracts/development/testing.md#behavioral-verification Samples the actual stance preparation and lifted trajectory at boundaries and midpoint. Observes held initial placement, next ordinary touchdown and which side crosses for the declared step.
 * @evidence contracts/development/testing.md#independent-expectations A half-stride duty ends at phase 1/2. A symmetric rest-to-rest swing reaches half travel and full height at its midpoint. The authored stance travel limits the fore offset before rotation.
 */
export function test_archetypes_animals_hoof_stance_boundary(): void {
  const ordinary: Hoof.IStance = { duty: 1 / 2, landed: STATE, travel: 1 / 2 };
  const before: ReturnType<typeof Hoof.step> = Hoof.step(5 / 8, 1 / 4, 5 / 4, ordinary, undefined);
  const release: ReturnType<typeof Hoof.step> = Hoof.step(3 / 4, 1 / 4, 5 / 4, ordinary, undefined);
  const middle: ReturnType<typeof Hoof.step> = Hoof.step(1, 1 / 4, 5 / 4, ordinary, undefined);
  const next: ReturnType<typeof Hoof.step> = Hoof.step(5 / 4, 5 / 4, 9 / 4, ordinary, undefined);
  TestValidator.predicate("the ordinary stance holds strictly before lift-off",
    before.planted && before.from === ordinary && before.along === 0 && before.rise === 0,
  );
  TestValidator.predicate("lift-off releases with zero initial swing", !release.planted && release.along === 0 && release.rise === 0);
  TestValidator.predicate("the swing midpoint is half travel at maximum lift",
    !middle.planted && nclose(middle.along, 1 / 2, EXACT) && nclose(middle.rise, 1, EXACT),
  );
  TestValidator.predicate("the next touchdown starts a new stance", next.planted && next.rise === 0);

  const standing: AutoMovieArchetypeCourse.IState = {
    ...STATE,
    placement: { ...STATE.placement, translation: { x: 2, y: 0, z: 3 } },
  };
  const first: ReturnType<typeof Hoof.step> = Hoof.step(0, -3 / 8, 5 / 8, ordinary, standing);
  const startingRelease: ReturnType<typeof Hoof.step> = Hoof.step(1 / 8, -3 / 8, 5 / 8, ordinary, standing);
  const afterStarting: ReturnType<typeof Hoof.step> = Hoof.step(5 / 8, 5 / 8, 13 / 8, ordinary, standing);
  TestValidator.predicate("standing holds the actual initial frame with zero rolling travel",
    first.planted && first.from.landed === standing && first.from.travel === 0,
  );
  TestValidator.predicate("standing releases at its remaining eighth-stride",
    !startingRelease.planted && startingRelease.along === 0 && startingRelease.rise === 0,
  );
  TestValidator.predicate("ordinary touchdown restores the authored travel", afterStarting.from === ordinary);

  const turn: IAutoMovieTransform = {
    ...standing.placement,
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  };
  const crossed: Hoof.IStance = {
    ...ordinary,
    landed: { ...standing, placement: turn },
    across: { toward: 1, shift: 1 / 8 },
  };
  const point: IAutoMovieVector3 = Hoof.footprint({ x: -1 / 2, y: 1 / 8, z: 1 }, crossed, -10);
  TestValidator.predicate("the rotated footprint preserves the authored X-side and clamped forward coordinates",
    nclose(point.x, 3, 16 * Number.EPSILON) &&
      nclose(point.y, 0, EXACT) &&
      nclose(point.z, 27 / 8, 16 * Number.EPSILON),
  );
}
