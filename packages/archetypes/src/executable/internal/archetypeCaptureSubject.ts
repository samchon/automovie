import type { IAutoMovieTransform } from "@automovie/interface";

import type { AutoMovieArchetype, AutoMovieArchetypeRide } from "../../core";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";

/**
 * How the capture catalog makes a subject: a still one from named archetypes,
 * the named archetypes of every kind of a producer, and a moving one from a
 * ride.
 */
export namespace archetypeCaptureSubject {
  /**
   * A still subject: each archetype as a member under its name, the same at
   * every second.
   *
   * @param members The archetypes by name.
   * @returns The subject.
   */
  export function still(
    members: Record<string, AutoMovieArchetype>,
  ): archetypeCaptureCatalog.ISubject {
    return {
      members: Object.entries(members).map(
        ([name, archetype]: [
          string,
          AutoMovieArchetype,
        ]): archetypeCaptureCatalog.IMember => ({
          name,
          reference: archetype,
          at: (): { archetype: AutoMovieArchetype } => ({ archetype }),
        }),
      ),
    };
  }

  /**
   * Every kind of a producer, each named by a prefix and its kind.
   *
   * @param prefix The name's first part.
   * @param list The kinds.
   * @param create The producer for one kind.
   * @returns The archetypes by `prefix-kind`.
   */
  export function kinds<Kind extends string>(
    prefix: string,
    list: readonly Kind[],
    create: (kind: Kind) => AutoMovieArchetype,
  ): Record<string, AutoMovieArchetype> {
    return Object.fromEntries(
      list.map((kind: Kind): [string, AutoMovieArchetype] => [
        `${prefix}-${kind}`,
        create(kind),
      ]),
    );
  }

  /**
   * A moving subject: one member sampled from a ride, with the ride's running
   * time and instants.
   *
   * @param name The member's name.
   * @param ride The ride.
   * @param reference Immutable neutral model for independent quadruped rig
   *   marks; optional for unrelated rides.
   * @returns The subject.
   */
  export function moving<Id extends string, Dimension extends string>(
    name: string,
    ride: AutoMovieArchetypeRide.IRide<Id, Dimension>,
    reference?: AutoMovieArchetype,
  ): archetypeCaptureCatalog.ISubject {
    return {
      members: [
        {
          name,
          reference,
          at: (
            seconds: number,
          ): {
            archetype: AutoMovieArchetype;
            placement: IAutoMovieTransform;
          } => ride.at(seconds),
        },
      ],
      duration: ride.duration,
      instants: ride.instants,
    };
  }
}
