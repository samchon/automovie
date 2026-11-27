import { HumanProxemics, AutoMovieMotionHumanRefusal } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a few square roots, metres and degrees. */
const ROUNDING: number = 1e-12;

/**
 * `HumanProxemics`' distances: `reach` is how far ahead of the chest a hand
 * held out with the elbow bent `HANDING_ELBOW` (35 degrees) reaches at a
 * height, the arm's span by the law of cosines, its horizontal part at that
 * height less half the chest's depth; `gap` is a named band's distance, a given
 * one in metres, or for a handover the two hands' reaches at the mean of the
 * two waists and chests; `stop` is where an approach stops, the gap and the
 * chest short of the target, facing it.
 *
 * Scenarios, a 0.3 m upper arm, 0.27 m forearm and 0.19 m hand, shoulders 1.45
 * m up, a 0.24 m deep chest, waist 1.05 m and chest 1.3 m up:
 *
 * 1. At the shoulder's own height the reach is the arm's whole span, by the law of
 *    cosines over the upper arm and the forearm with 0.4 of the hand at 35
 *    degrees of elbow flexion, less 0.12 m.
 * 2. A handover between two such people is twice the reach at 1.175 m; the social
 *    band is 1.6 m; 0.8 m is 0.8 m; a negative gap is refused on `at`.
 * 3. Approaching (0, 0, 3) from the origin with a 1 m gap and a 0.12 m chest stops
 *    at (0, 0, 1.88) facing 0; toward (3, 0, 0) it faces 90; a target where the
 *    performer stands is refused on `target`.
 */
export function test_motions_everyday_human_proxemics(): void {
  const measure: Parameters<typeof HumanProxemics.gap>[1] = {
    upperArm: 0.3,
    forearm: 0.27,
    hand: 0.19,
    shoulderHeight: 1.45,
    chestDepth: 0.24,
    waistHeight: 1.05,
    chestHeight: 1.3,
  };
  const a: number = 0.3;
  const b: number = 0.27 + 0.4 * 0.19;
  const span: number = Math.sqrt(
    a * a + b * b + 2 * a * b * Math.cos((35 * Math.PI) / 180),
  );
  const at: (height: number) => number = (height: number): number =>
    Math.sqrt(span * span - (1.45 - height) ** 2) - 0.12;
  TestValidator.predicate(
    "the reach",
    nclose(HumanProxemics.reach(measure, 1.45), span - 0.12, ROUNDING),
  );
  TestValidator.predicate(
    "the gaps",
    nclose(HumanProxemics.gap("handing", measure), 2 * at(1.175), ROUNDING) &&
      HumanProxemics.gap("social", measure) === 1.6 &&
      HumanProxemics.gap(0.8, measure) === 0.8,
  );
  let axis: string | undefined;
  try {
    HumanProxemics.gap(-1, measure);
  } catch (error: unknown) {
    if (error instanceof AutoMovieMotionHumanRefusal) axis = error.axis;
  }
  TestValidator.equals("a negative gap", axis, "at");
  const ahead: ReturnType<typeof HumanProxemics.stop> = HumanProxemics.stop(
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 3 },
    1,
    0.12,
  );
  TestValidator.predicate(
    "the stops",
    vclose(ahead.at, { x: 0, y: 0, z: 1.88 }, ROUNDING) &&
      ahead.yaw === 0 &&
      nclose(
        HumanProxemics.stop({ x: 0, y: 0, z: 0 }, { x: 3, y: 0, z: 0 }, 1, 0.12)
          .yaw,
        90,
        ROUNDING,
      ),
  );
  let target: string | undefined;
  try {
    HumanProxemics.stop({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1, 0.12);
  } catch (error: unknown) {
    if (error instanceof AutoMovieMotionHumanRefusal) target = error.axis;
  }
  TestValidator.equals("no way", target, "target");
}
