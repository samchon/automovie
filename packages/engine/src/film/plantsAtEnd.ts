import {
  AutoMovieHumanoidBone,
  IAutoMovieBeatEndFootPlant,
} from "@automovie/interface";

/**
 * The stance plant each foot holds at `localTime`, the contact the next beat keeps that foot on.
 *
 * For admitted finite times and stance bounds, a plant is held when `start <= localTime <= end`, both bounds inclusive. When one foot has several held plants, the one with the latest `start` wins, and a later entry wins an equal-start tie. Feet appear in the order their first held plant appears in `plants`, and each returned plant is the input object itself. `undefined` plants, meaning no plant data was supplied, and a cut where no plant is held both answer `null`. `resolveBeatEnd` and `resolveBeatOpening` store the result as an actor's `footPlants`. This selector does not itself validate interval values; NaN comparisons do not establish the stated containment rule.
 *
 * @param plants Stance runs on the ended beat's local clock, or `undefined`.
 * @param localTime The cut instant on the same clock, in seconds.
 * @returns At most one plant per foot, or `null` when none is held.
 *
 * @evidence contracts/common.md#principled-implementation Under admitted finite interval values, a single-pass per-foot fold keeps the greatest held start, the most recent inclusive contact; >= replaces equal-start ties with the later entry, and map insertion order fixes output order. Numeric admission remains the caller's responsibility.
 * @evidence contracts/common.md#clear-and-simple-design One selection rule shared by both beat-boundary resolvers, so the end of one beat and the opening of the next keep the same foot on the same contact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every foot and every run is judged by the same interval and recency rule; no foot or rig is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the inclusive interval, the recency and tie rules, the output order, that plants are returned by reference, both `null` cases, the clock and unit, and which resolvers store the answer.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the plants with a map bounded by the number of feet, linear in the plant count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure selection over one list at one instant that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The per-foot map is dropped on return; the caller owns the returned array, which references the input plants.
 */
export function plantsAtEnd (
  plants: readonly IAutoMovieBeatEndFootPlant[] | undefined,
  localTime: number,
): IAutoMovieBeatEndFootPlant[] | null {
  if (plants === undefined) return null;
  const byFoot: Map<AutoMovieHumanoidBone, IAutoMovieBeatEndFootPlant> =
    new Map();
  for (const plant of plants) {
    if (plant.start > localTime || plant.end < localTime) continue;
    const held: IAutoMovieBeatEndFootPlant | undefined = byFoot.get(
      plant.foot,
    );
    if (held === undefined || plant.start >= held.start)
      byFoot.set(plant.foot, plant);
  }
  const kept: IAutoMovieBeatEndFootPlant[] = [...byFoot.values()];
  return kept.length === 0 ? null : kept;
}
