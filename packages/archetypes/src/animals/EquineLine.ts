import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeFrame, ArchetypeRefusal, type ArchetypeRide } from "../core";

/**
 * A lead laid from the halter to a held point away from the head: the lunge line paid out to the handler at the circle's centre, or the lead tied to a ring.
 *
 * The lead is the equid's own line (`HorseSaddle.lead`): a span from its held run to the halter. Each sample moves the held run's contact to the given world point and re-lays the span through the model's own span owner (`Archetype.reposed`), so the line runs straight from that point to the halter and its held run lies along it. The line's drawn length is the distance between them; a point farther from the halter than the line's length is refused, as a line cannot stretch.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is laid, by whom, its length and the refusal.
 * @evidence contracts/development/design.md#principled-representation A ride in, a ride out on the same clock; the held point is a world point at each film second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One layer; the line's geometry and its held run's alignment are the span owner's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The lead is the model's own span; no second line is drawn.
 */
export namespace EquineLine {
  /**
   * The world point the line's held run is at, at a film second, given the equid's sample there before the line is laid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Metres in the world; the sample is the base ride's, its lead still where the ride put it.
   * @evidence contracts/development/design.md#principled-representation A function of film seconds and the base sample.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `layer`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Held<Id extends string, D extends string> = (
    seconds: number,
    sample: ArchetypeRide.ISample<Id, D>,
  ) => IAutoMovieVector3;

  /**
   * Lay the lead to a held point.
   *
   * @param ride The equid's ride, its lead already on the model; lay the line after any layer that moves the head's contacts.
   * @param lead The lead's held-run contact.
   * @param held Where the held run is at each film second.
   * @param length The line's whole length, metres.
   * @returns The ride with the line laid.
   * @throws {ArchetypeRefusal} At a sample whose held point is farther from the halter than the line's length.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order it must be applied in and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Carry the world point into the model's space through the sample's placement, rebind the contact there and let the span owner re-lay the line and turn its held run onto it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read, rebind, re-lay, measure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A line longer than its length refuses; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One base sample and one re-lay per sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the model's span owner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the base ride and the held function.
   */
  export function layer<Id extends string, D extends string>(
    ride: ArchetypeRide.IRide<Id, D>,
    lead: Id,
    held: Held<Id, D>,
    length: number,
  ): ArchetypeRide.IRide<Id, D> {
    if (!(Number.isFinite(length) && length > 0))
      throw new RangeError("A line has a positive finite length");
    const at = (seconds: number): ArchetypeRide.ISample<Id, D> => {
      const base: ArchetypeRide.ISample<Id, D> = ride.at(seconds);
      const point: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(base.placement.rotation),
        Vector3.subtract(held(seconds, base), base.placement.translation),
      );
      const frames: Map<string, IAutoMovieTransform> = new Map(
        base.archetype.affordances.map(
          (contact: IAutoMovieAffordance): [string, IAutoMovieTransform] => [
            contact.id,
            contact.id === lead
              ? { ...ArchetypeFrame.copy(contact.frame), translation: point }
              : ArchetypeFrame.copy(contact.frame),
          ],
        ),
      );
      const archetype: ArchetypeRide.ISample<Id, D>["archetype"] =
        base.archetype.reposed(base.archetype.parts, frames);
      const drawn: number = archetype.span(lead).length;
      if (!(drawn <= length))
        throw new ArchetypeRefusal({
          kind: "parameter",
          archetype: archetype.archetype,
          axis: "held",
          value: drawn,
          feasible: { kind: "range", minimum: 0, maximum: length, unit: "m" },
          reason: `the line would stretch to ${drawn} m at film second ${seconds}, beyond its ${length} m`,
          fix: "Bring the held point within the line's length of the halter.",
        });
      return { ...base, archetype };
    };
    return {
      plan: ride.plan,
      duration: ride.duration,
      instants: ride.instants,
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: ArchetypeRide.ISample<Id, D> = at(seconds);
        return ArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }
}
