import type {
  IAutoMovieBodyMeasure,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  MartialArtStanceForms,
  martialArtGuardSite,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** A body's measures the guard reads, metres. */
const MEASURE: Pick<
  IAutoMovieBodyMeasure,
  "shoulderHalfWidth" | "upperArm" | "forearm" | "chestDepth" | "forearmRadius"
> = {
  shoulderHalfWidth: 0.2,
  upperArm: 0.3,
  forearm: 0.26,
  chestDepth: 0.24,
  forearmRadius: 0.035,
};

/**
 * `martialArtGuardSite` places a guard fist from its shoulder joint by the
 * guard's shares, never nearer than a forearm diameter ahead of the chest's
 * front (half the chest's depth ahead of the shoulder).
 *
 * Scenarios:
 *
 * 1. The Muay Thai lead fist stands 0.6 upper arms above the shoulder, 0.55 half
 *    widths inward, its 0.45 arm lengths ahead already clear of the chest.
 * 2. The taekwondo rear fist stands 0.4 upper arms below its shoulder, and its 0.3
 *    arm lengths (0.168 m) are pushed out to the chest's clearance, 0.12 + 0.07
 *    = 0.19 m.
 * 3. A left hand's inward share points to -X, a right hand's to +X.
 */
export function test_unit_motions_sport_martial_art_guard_site(): void {
  const high: IAutoMovieVector3 = martialArtGuardSite(
    MartialArtStanceForms.GUARDS.highGuard.lead,
    "left",
    MEASURE,
  );
  TestValidator.predicate(
    "the high guard",
    vclose(high, { x: -0.11, y: 0.18, z: 0.252 }, 1e-12),
  );
  const low: IAutoMovieVector3 = martialArtGuardSite(
    MartialArtStanceForms.GUARDS.lowGuard.rear,
    "right",
    MEASURE,
  );
  TestValidator.predicate(
    "the low guard clear of the chest",
    vclose(low, { x: 0.12, y: -0.12, z: 0.19 }, 1e-12),
  );
}
