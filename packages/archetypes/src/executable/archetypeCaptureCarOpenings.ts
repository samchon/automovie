import type { IAutoMovieAffordance } from "@automovie/interface";

import type { AutoMovieArchetype } from "../core";
import { createCar } from "../vehicles";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * Actual rear-access states of every coarse car class, without a performer.
 *
 * @returns One closed/open comparison subject covering rear doors/windows and each class's actual load opening.
 * @evidence contracts/development/common.md#meaningful-documentation Names the four actual car classes, rear door/window and boot/slide/tailgate states, producer-declared travel units and static-staging boundary. No Human ingress or collision-free choreography is claimed.
 * @evidence contracts/development/implementation.md#principled-implementation Public createCar builds each original model. Its actual declared rear articulations supply their own maximum travels to the public articulate operation, so moved leaves, windows, apertures and cargo/load/bed contacts come from the real consumer path.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed rear-access vocabulary selects existing affordances; one loop builds each closed model and its corresponding fully open actual output for the common still instrument.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No absent hatch is invented, class geometry is substituted, renderer-only transform moves a door, undocumented angle is tuned or Human law is imported. Missing/nonpositive travel on a declared selected opening refuses instead of silently skipping it.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(K(P+A)) preparation for four classes, their actual part/affordance counts and two static states; drawing reuses the prepared actual models.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each class's closed model supplies its actual contacts, movements and open counterpart; no second producer or copied hinge/window computation supplies expectations.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The finite subject owns eight plain models for its catalogue lifetime, retains no current-frame cache and starts no renderer, process, file or external handle.
 */
export function archetypeCaptureCarOpenings(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const selected: ReadonlySet<createCar.Affordance> = new Set([
    "rearLeftDoor",
    "rearRightDoor",
    "rearLeftWindow",
    "rearRightWindow",
    "boot",
    "slidingDoor",
    "tailgate",
  ]);
  const members: Record<string, AutoMovieArchetype> = {};
  for (const kind of createCar.KINDS) {
    const car: ReturnType<typeof createCar> = createCar({ kind }, 17);
    const movements: Partial<Record<createCar.Affordance, number>> = {};
    for (const id of selected) {
      if (
        !car.affordances.some(
          (contact: IAutoMovieAffordance): boolean => contact.id === id,
        )
      )
        continue;
      const contact: IAutoMovieAffordance = car.affordance(id);
      if (
        !(
          typeof contact.travel === "number" &&
          Number.isFinite(contact.travel) &&
          contact.travel > 0
        )
      )
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
