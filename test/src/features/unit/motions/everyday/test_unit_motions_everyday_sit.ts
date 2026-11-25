import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import { lowerHumanPosture, sitPlace } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

namespace part_sit_place {
  /** Rounding of a chord and a turn. */
  const ROUNDING: number = 1e-12;

  /**
   * `sitPlace.band` is the band of hip-to-ankle distances a seated leg reaches,
   * the chord `sqrt(t^2 + s^2 + 2 t s cos k)` of the thigh `t` and shank `s` at
   * the knee's flexion limit and at the lowering's knee
   * (`lowerHumanPosture.KNEE`); `turn` wraps a heading into (-180, 180].
   *
   * Scenarios, a 0.45 m thigh and a 0.42 m shank:
   *
   * 1. The band's ends are the chords at the range table's knee flexion and at
   *    `lowerHumanPosture.KNEE`.
   * 2. 190 turns to -170, -190 to 170, 180 stays 180 and -180 becomes 180.
   */
  export function run(): void {
    const t: number = 0.45;
    const s: number = 0.42;
    const chord: (k: number) => number = (k: number): number =>
      Math.sqrt(t * t + s * s + 2 * t * s * Math.cos((k * Math.PI) / 180));
    const [shortest, longest]: readonly [number, number] = sitPlace.band(
      { measure: { thigh: t, shank: s } },
      "left",
    );
    TestValidator.predicate(
      "the band",
      nclose(
        shortest,
        chord(DEFAULT_HUMANOID_ROM.leftLowerLeg!.flexion!.max),
        ROUNDING,
      ) && nclose(longest, chord(lowerHumanPosture.KNEE), ROUNDING),
    );
    TestValidator.equals(
      "the turns",
      [
        sitPlace.turn(190),
        sitPlace.turn(-190),
        sitPlace.turn(180),
        sitPlace.turn(-180),
      ],
      [-170, 170, 180, 180],
    );
  }
}

/**
 * `sit`'s unit contract: its place.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `sit_place`: `sitPlace.band` is the band of hip-to-ankle distances a seated
 *   leg reaches, the chord `sqrt(t^2 + s^2 + 2 t s cos k)` of the thigh `t` and
 *   shank `s` at the knee's flexion limit and at the lowering's knee
 *   (`lowerHumanPosture.KNEE`);
 */
export async function test_unit_motions_everyday_sit(): Promise<void> {
  part_sit_place.run();
}
