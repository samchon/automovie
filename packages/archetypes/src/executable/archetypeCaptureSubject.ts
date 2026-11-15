import type { IAutoMovieTransform } from "@automovie/interface";

import type { Archetype, ArchetypeRide } from "../core";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";

/**
 * How the capture catalog makes a subject: a still one from named archetypes, the named archetypes of every kind of a producer, and a moving one from a ride.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three ways a subject is made and who uses them.
 * @evidence contracts/development/design.md#principled-representation A subject as `archetypeCaptureCatalog.ISubject`, members sampled by film second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `still`, `kinds` and `moving`, read by the catalog and its subject files only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A still member and a moving one share one sampler, so the page has one path.
 */
export namespace archetypeCaptureSubject {
  /**
   * A still subject: each archetype as a member under its name, the same at every second.
   *
   * @param members The archetypes by name.
   * @returns The subject.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each member's sampler returns its archetype unplaced.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the members.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per subject.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds plain data only.
   */
  export function still(
    members: Record<string, Archetype>,
  ): archetypeCaptureCatalog.ISubject {
    return {
      members: Object.entries(members).map(
        ([name, archetype]: [
          string,
          Archetype,
        ]): archetypeCaptureCatalog.IMember => ({
          name,
          at: (): { archetype: Archetype } => ({ archetype }),
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and how each is named.
   * @evidence contracts/development/implementation.md#principled-implementation One call of the producer per kind.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the kinds.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per producer.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds plain data only.
   */
  export function kinds<Kind extends string>(
    prefix: string,
    list: readonly Kind[],
    create: (kind: Kind) => Archetype,
  ): Record<string, Archetype> {
    return Object.fromEntries(
      list.map((kind: Kind): [string, Archetype] => [
        `${prefix}-${kind}`,
        create(kind),
      ]),
    );
  }

  /**
   * A moving subject: one member sampled from a ride, with the ride's running time and instants.
   *
   * @param name The member's name.
   * @param ride The ride.
   * @returns The subject.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and what the subject carries.
   * @evidence contracts/development/implementation.md#principled-implementation The member's sampler is the ride's own, its archetype and placement at each second.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per ride.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the ride for as long as the subject is kept.
   */
  export function moving<Id extends string, Dimension extends string>(
    name: string,
    ride: ArchetypeRide.IRide<Id, Dimension>,
  ): archetypeCaptureCatalog.ISubject {
    return {
      members: [
        {
          name,
          at: (
            seconds: number,
          ): {
            archetype: Archetype;
            placement: IAutoMovieTransform;
          } => ride.at(seconds),
        },
      ],
      duration: ride.duration,
      instants: ride.instants,
    };
  }
}
