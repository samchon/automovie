import { HumanAffect, HumanRefusal } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few products, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `HumanAffect.angles` is what an affect display adds to the joints at a time
 * into it: nothing at or outside its two ends, a laugh's trunk pulsing once
 * every `NOTE` (210 ms, Provine 1996) under its envelope with the head held
 * back, and a refusal of a length that is not positive.
 *
 * Scenarios:
 *
 * 1. A 1.5 s laugh adds nothing before it, at its start, at its end or after.
 * 2. Inside its steady part the laugh's chest flexion repeats every 210 ms, its
 *    spine taking half of it, and its head is held back 5 degrees.
 * 3. Twice the intensity doubles every angle.
 * 4. A display of no length is refused on `seconds`.
 */
export function test_unit_motions_everyday_human_affect_angles(): void {
  TestValidator.equals(
    "nothing at the ends",
    [-0.1, 0, 1.5, 2].map((t: number): number =>
      Object.keys(HumanAffect.angles("laugh", t, 1.5)).length,
    ),
    [0, 0, 0, 0],
  );
  const at: (t: number, intensity?: number) => ReturnType<typeof HumanAffect.angles> = (
    t: number,
    intensity: number = 1,
  ): ReturnType<typeof HumanAffect.angles> =>
    HumanAffect.angles("laugh", t, 1.5, intensity);
  const chest: (t: number) => number = (t: number): number => at(t).chest![0];
  TestValidator.predicate(
    "the pulse repeats every note",
    [0.6, 0.65, 0.7].every((t: number): boolean =>
      nclose(chest(t), chest(t + HumanAffect.NOTE), ROUNDING),
    ) &&
      nclose(at(0.65).spine![0], chest(0.65) / 2, ROUNDING) &&
      nclose(at(0.65).head![0], -5, ROUNDING),
  );
  TestValidator.predicate(
    "twice the intensity",
    nclose(at(0.65, 2).chest![0], 2 * chest(0.65), ROUNDING) &&
      nclose(at(0.65, 2).head![0], -10, ROUNDING),
  );
  let refused: boolean = false;
  try {
    HumanAffect.angles("laugh", 0.5, 0);
  } catch (error: unknown) {
    refused = error instanceof HumanRefusal && error.axis === "seconds";
  }
  TestValidator.predicate("no length", refused);
}
