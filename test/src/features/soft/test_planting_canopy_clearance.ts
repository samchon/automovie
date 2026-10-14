import {
  IAutoMoviePlantingCluster,
  IAutoMoviePlantingDomain,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validatePlantingInstallations } from "../../../../packages/engine/src/soft/validatePlantingInstallations";
import { hasViolation } from "../internal/hasViolation";
import {
  plantingCluster,
  plantingInstallation,
  plantingRecipe,
  roomEnvironment,
} from "../internal/softFixtures";

/**
 * Canopy containment includes stem thickness and the visible leaf-card width,
 * even when every branch endpoint and placement origin lies inside the room.
 *
 * Scenarios:
 *
 * 1. A vertical stem of radius 1/4 crosses a room's X/Z half-width 1/5;
 *    radius 1/8 is a valid adjacent case.
 * 2. An identity-oriented leaf card of full width 1/2 crosses the same wall;
 *    width 1/4 fits. Its centres lie on the zero-X trunk in both cases.
 * 3. Full per-axis member scale doubles the narrow card's X extent and must
 *    refuse it, while the same unit-scale member remains admitted.
 * 4. Growth zero has no stem/card volume to reject, and semantic-only space
 *    has no geometric containment claim to enforce.
 *
 * @evidence contracts/testing.md#behavioral-verification The real installation validator joins authored room, domain and cluster records; cluster-path refusal catches endpoint-only canopy measurement while the adjacent admitted cases catch unconditional rejection.
 * @evidence contracts/testing.md#independent-expectations A vertical cylinder's X radius is its authored radius, and an identity unit XY card's half-width is authored width/2. Comparing these quantities to the independent room half-width 1/5 requires no call to the canopy measurement under test.
 * @evidence contracts/testing.md#distinguishing-cases Thick/thin stems, wide/narrow cards, unit/doubled X member scale, zero growth and semantic-only space distinguish actual visible extent from centreline/origin containment; pruning and general reference admission remain in their owning tests.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_planting_canopy_clearance; existing authored-record fixtures and the product validator own all cases, without a viewer, browser, mock geometry or GPU process.
 */
export function test_planting_canopy_clearance(): void {
  const base: IAutoMoviePlantingDomain = plantingRecipe();

  /** One admitted vertical trunk, with optional identity leaf cards and no jitter. */
  const domain: (
    radius: number,
    width: number | null,
    stage?: number,
  ) => IAutoMoviePlantingDomain = (
    radius: number,
    width: number | null,
    stage: number = 1,
  ): IAutoMoviePlantingDomain =>
    plantingRecipe({
      structure: { ...base.structure, levels: 1, radius },
      growth: { stage, onset: 0 },
      foliage:
        width === null
          ? null
          : {
              density: 2,
              minLevel: 0,
              size: { x: width, y: 1 / 8, z: 1 / 16 },
              scaleJitter: 0,
              rollJitter: 0,
            },
    });

  /** Validate one fixed-origin member against an independently authored box. */
  const check: (
    recipe: IAutoMoviePlantingDomain,
    xScale?: number,
    semantic?: boolean,
  ) => IAutoMovieValidation = (
    recipe: IAutoMoviePlantingDomain,
    xScale: number = 1,
    semantic: boolean = false,
  ): IAutoMovieValidation => {
    const cluster: IAutoMoviePlantingCluster = plantingCluster({
      count: 1,
      extent: { x: 0, z: 0 },
      minSpacing: 0,
      yawJitter: 0,
      scale: {
        min: { x: xScale, y: 1, z: 1 },
        max: { x: xScale, y: 1, z: 1 },
      },
    });
    return validatePlantingInstallations({
      environment: roomEnvironment({ half: 1 / 5, semantic }),
      installations: [plantingInstallation({ irrigation: null })],
      clusters: [cluster],
      domains: [recipe],
    });
  };
  TestValidator.predicate(
    "stem radial extent crosses its room wall",
    hasViolation(
      check(domain(1 / 4, null)),
      "type",
      "installations[0].cluster",
    ),
  );
  TestValidator.predicate(
    "adjacent narrower stem fits",
    check(domain(1 / 8, null)).success,
  );
  TestValidator.predicate(
    "leaf card crosses wall despite inside centreline",
    hasViolation(
      check(domain(1 / 16, 1 / 2)),
      "type",
      "installations[0].cluster",
    ),
  );
  TestValidator.predicate(
    "adjacent narrower leaf card fits",
    check(domain(1 / 16, 1 / 4)).success,
  );
  TestValidator.predicate(
    "per-axis X scale applies to visible card extent",
    hasViolation(
      check(domain(1 / 16, 1 / 4), 2),
      "type",
      "installations[0].cluster",
    ),
  );
  TestValidator.predicate(
    "zero growth emits no canopy volume",
    check(domain(1 / 4, 1 / 2, 0)).success,
  );
  TestValidator.predicate(
    "semantic-only room does not invent containment",
    check(domain(1 / 4, 1 / 2), 1, true).success,
  );
}
