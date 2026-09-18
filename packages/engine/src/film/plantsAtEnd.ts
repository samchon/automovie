import { IAutoMovieBeatEndFootPlant } from "@automovie/interface";

/**
 * The most recent stance plant per foot active at `localTime`, the contact the
 * next beat should keep each foot on. Stance bounds are inclusive; later
 * entries win equal-start ties. Returns `null` when no plant data was supplied
 * or every run is past/future at the cut.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-phases plantsAtEnd preserves planted contact phases: The most recent stance plant per foot active at `localTime`, the contact the next beat should keep each foot on. Stance bounds are inclusive; later entries win equal-start ties. Returns `null` when no plant data was supplied or every run is past/future at the cut.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support plantsAtEnd realizes contact-phase support: The most recent stance plant per foot active at `localTime`, the contact the next beat should keep each foot on. Stance bounds are inclusive; later entries win equal-start ties. Returns `null` when no plant data was supplied or every run is past/future at the cut.
 */
export const plantsAtEnd = (
  plants: readonly IAutoMovieBeatEndFootPlant[] | undefined,
  localTime: number,
): IAutoMovieBeatEndFootPlant[] | null => {
  if (plants === undefined) return null;
  const byFoot = new Map<
    IAutoMovieBeatEndFootPlant["foot"],
    IAutoMovieBeatEndFootPlant
  >();
  for (const plant of plants) {
    if (plant.start > localTime || plant.end < localTime) continue;
    const held = byFoot.get(plant.foot);
    if (held === undefined || plant.start >= held.start)
      byFoot.set(plant.foot, plant);
  }
  const kept = [...byFoot.values()];
  return kept.length === 0 ? null : kept;
};
