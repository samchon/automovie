import { AutoMovieHumanBodyLaw } from "@automovie/human";
import type { IAutoMovieHumanParameters } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import PEOPLE from "../../internal/MOTION_HUMAN_PEOPLE.json";

/**
 * The normal neck band and the higher base landmark share one station.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads ordinary body placement, the native radius outline and the actual prepared head axis.
 * @evidence contracts/development/testing.md#independent-expectations The higher public base landmark, scaled once by the original neck, gives the normal band's authored upper height.
 * @evidence contracts/development/testing.md#distinguishing-cases The side-neck point is highest for f-small. Cervicale is highest for both male inputs. Reprojecting the shared site gave two adjacent binary64 stations in each fixture.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous original-source preparation using the existing parameter file. It performs no tape closure, skin rendering, or asset read.
 * @evidence contracts/development/common.md#meaningful-documentation Names the shared station and the two anatomical owners that can supply it.
 */
export function test_human_head_neck_band_identity(): void {
  for (const name of ["f-small", "m-broad", "m-short-legged"] as const) {
    const input = PEOPLE[name].params as IAutoMovieHumanParameters;
    const sources = AutoMovieHumanBodyLaw.prepareSources(input);
    const { neckSource, pose } = sources.common();
    const original = sources.headSource().source.tapeInvariant.part;
    const neck = pose.neck.layout.neck;
    const expected = Math.max(
      neck.base!.cervicaleHeight,
      neck.base!.sideNeckPointHeight,
    );
    const upper = neck.curves!.radius.knots.find(
      ({ site }) => site === "neck.cylinder.upper",
    );
    TestValidator.predicate(
      `${name} uses one exact anatomical upper station`,
      () =>
        neckSource.head.normalBandUpper === expected &&
        neck.curves!.band[1] === expected &&
        upper?.station === expected &&
        original.stations.filter((s) => s === expected).length === 1,
    );
  }
}
