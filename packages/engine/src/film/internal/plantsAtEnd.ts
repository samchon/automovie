import {
  AutoMovieHumanoidBone,
  IAutoMovieBeatEndFootPlant,
} from "@automovie/interface";

/*
 * The stance plant each foot holds at `localTime`, the contact the next beat
 * keeps that foot on.
 *
 * For admitted finite times and stance bounds, a plant is held when `start <=
 * localTime <= end`, both bounds inclusive. When one foot has several held
 * plants, the one with the latest `start` wins, and a later entry wins an
 * equal-start tie. Feet appear in the order their first held plant appears in
 * `plants`, and each returned plant is the input object itself. `undefined`
 * plants, meaning no plant data was supplied, and a cut where no plant is held
 * both answer `null`. `resolveBeatEnd` and `resolveBeatOpening` store the
 * result as an actor's `footPlants`. This selector does not itself validate
 * interval values; NaN comparisons do not establish the stated containment
 * rule.
 * Parameter plants: Stance runs on the ended beat's local clock, or `undefined`.
 * Parameter localTime: The cut instant on the same clock, in seconds.
 * Returns: At most one plant per foot, or `null` when none is held.
 */
export function plantsAtEnd(
  plants: readonly IAutoMovieBeatEndFootPlant[] | undefined,
  localTime: number,
): IAutoMovieBeatEndFootPlant[] | null {
  if (plants === undefined) return null;
  const byFoot: Map<AutoMovieHumanoidBone, IAutoMovieBeatEndFootPlant> =
    new Map();
  for (const plant of plants) {
    if (plant.start > localTime || plant.end < localTime) continue;
    const held: IAutoMovieBeatEndFootPlant | undefined = byFoot.get(plant.foot);
    if (held === undefined || plant.start >= held.start)
      byFoot.set(plant.foot, plant);
  }
  const kept: IAutoMovieBeatEndFootPlant[] = [...byFoot.values()];
  return kept.length === 0 ? null : kept;
}
