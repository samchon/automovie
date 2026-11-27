import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
} from "../../core";

/**
 * A lead laid from the halter to a held point away from the head: the lunge
 * line paid out to the handler at the circle's centre, or the lead tied to a
 * ring.
 *
 * The lead is the equid's own line (`EquineSaddle.lead`): a span from its held
 * run to the halter. Each sample moves the held run's contact to the given
 * world point and re-lays the span through the model's own span owner
 * (`AutoMovieArchetype.reposed`), so the line runs straight from that point to
 * the halter and its held run lies along it. The line's drawn length is the
 * distance between them; a point farther from the halter than the line's length
 * is refused, as a line cannot stretch.
 */
export namespace EquineLine {
  /**
   * The world point the line's held run is at, at a film second, given the
   * equid's sample there before the line is laid.
   */
  export type Held<Id extends string, D extends string> = (
    seconds: number,
    sample: AutoMovieArchetypeRide.ISample<Id, D>,
  ) => IAutoMovieVector3;

  /**
   * Lay the lead to a held point.
   *
   * @param ride The equid's ride, its lead already on the model; lay the line
   *   after any layer that moves the head's contacts.
   * @param lead The lead's held-run contact.
   * @param held Where the held run is at each film second.
   * @param length The line's whole length, metres.
   * @returns The ride with the line laid.
   * @throws {AutoMovieArchetypeRefusal} At a sample whose held point is farther
   *   from the halter than the line's length.
   */
  export function layer<Id extends string, D extends string>(
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
    lead: Id,
    held: Held<Id, D>,
    length: number,
  ): AutoMovieArchetypeRide.IRide<Id, D> {
    if (!(length > 0))
      throw new RangeError("A line has a positive finite length");
    const at = (seconds: number): AutoMovieArchetypeRide.ISample<Id, D> => {
      const base: AutoMovieArchetypeRide.ISample<Id, D> = ride.at(seconds);
      const point: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(base.placement.rotation),
        Vector3.subtract(held(seconds, base), base.placement.translation),
      );
      const frames: Map<string, IAutoMovieTransform> = new Map(
        base.archetype.affordances.map(
          (contact: IAutoMovieAffordance): [string, IAutoMovieTransform] => [
            contact.id,
            contact.id === lead
              ? {
                  ...AutoMovieArchetypeFrame.copy(contact.frame),
                  translation: point,
                }
              : AutoMovieArchetypeFrame.copy(contact.frame),
          ],
        ),
      );
      const archetype: AutoMovieArchetypeRide.ISample<Id, D>["archetype"] =
        base.archetype.reposed(base.archetype.parts, frames);
      const drawn: number = archetype.span(lead).length;
      if (!(drawn <= length))
        throw new AutoMovieArchetypeRefusal({
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
        const sample: AutoMovieArchetypeRide.ISample<Id, D> = at(seconds);
        return AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }
}
