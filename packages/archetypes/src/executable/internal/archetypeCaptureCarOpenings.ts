import type { IAutoMovieAffordance } from "@automovie/interface";

import type { AutoMovieArchetype } from "../../core";
import { AutoMovieArchetypeCar } from "../../vehicles";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * Rear-access states of every coarse car class, without a performer.
 *
 * @returns One closed/open comparison subject covering rear doors/windows and
 *   each class's load opening.
 */
export function archetypeCaptureCarOpenings(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const selected: ReadonlySet<AutoMovieArchetypeCar.Affordance> = new Set([
    "rearLeftDoor",
    "rearRightDoor",
    "rearLeftWindow",
    "rearRightWindow",
    "boot",
    "slidingDoor",
    "tailgate",
  ]);
  const members: Record<string, AutoMovieArchetype> = {};
  for (const kind of AutoMovieArchetypeCar.KINDS) {
    const car: ReturnType<typeof AutoMovieArchetypeCar.create> =
      AutoMovieArchetypeCar.create({ kind }, 17);
    const movements: Partial<Record<AutoMovieArchetypeCar.Affordance, number>> =
      {};
    for (const id of selected) {
      if (
        !car.affordances.some(
          (contact: IAutoMovieAffordance): boolean => contact.id === id,
        )
      )
        continue;
      const contact: IAutoMovieAffordance = car.affordance(id);
      if (!((contact.travel ?? 0) > 0))
        throw new RangeError(
          `Car inspection requires the actual ${kind}/${contact.id} travel`,
        );
      movements[id] = contact.travel;
    }
    members[`${kind}-closed`] = car;
    members[`${kind}-open`] = car.articulate(movements);
  }
  return { "car-rear-openings": archetypeCaptureSubject.still(members) };
}
