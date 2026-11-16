import type {
  IAutoMovieAffordance,
  IAutoMovieBodyContact,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { Archetype } from "./Archetype";
import { ArchetypeMass } from "./ArchetypeMass";
import type { ArchetypeSpan } from "./ArchetypeSpan";

/**
 * How an archetype breaks: the sets of its parts a hit breaks off as fragments, and what is left.
 *
 * A producer declares its fragment sets (`ArchetypeBuilder.fracture`), each a group of its own parts that leaves as one fragment, and the energy above which a hit breaks it, which its model body carries as `contact.fracture` so a flight's or a melee hit's one outcome rule reads it. A hit at or above that energy breaks every set off: each set becomes an archetype of its own, carrying its parts' own masses, and the parts no set names stay as the remainder, keeping the affordances whose moving parts all remain, that no set carries away (a set names the contacts on its parts that move none of them) and whose `rides` and `follows` still name a kept contact; no piece breaks again. The fragments leave together with the hit's momentum shared over their masses, as a perfectly inelastic collision gives; how they spread about that direction no source read gives, so they do not spread. The same archetype and hit always break the same way.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a set is, where the threshold lives, what breaking leaves, how fragments leave and what is not modelled.
 * @evidence contracts/development/design.md#principled-representation A set is an id and the producer's own part ids; a hit is its energy and momentum; the result is the remainder and fragments as archetypes, each with a velocity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `split` for `Archetype.broken`, the set, the hit and the broken result #3499 asks for, and the fragment and piece records the result and `Archetype.broken` pass.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No seeded spread or shard pattern is invented: a fragment is a declared set whole, and its velocity is momentum over mass.
 */
export namespace ArchetypeFracture {
  /**
   * One fragment set: the parts that break off together.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's meaning.
   * @evidence contracts/development/design.md#principled-representation An id, the producer's part ids and the contacts on them that move none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Declared by producers through `ArchetypeBuilder.fracture`, read by `split`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISet {
    /** The fragment's id, unique among the archetype's sets. */
    id: string;

    /** The parts it carries away, by part id. */
    parts: readonly string[];

    /** The contacts that lie on its parts but move none of them, such as a grip round a bottle's body, which leave with it; a contact that moves a part of the set, or rides or follows one that leaves, goes without being named. Absent, none. */
    affordances?: readonly string[];
  }

  /**
   * A hit on an archetype.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit.
   * @evidence contracts/development/design.md#principled-representation The hit's kinetic energy in joules, compared with the threshold, and its momentum in kilogram metres per second, shared over the fragments.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `split`; written by a flight or a melee stop (#3480).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IHit {
    /** The hit's energy, joules. */
    energy: number;

    /** The hit's momentum, kilogram metres per second, in the archetype's space. */
    momentum: IAutoMovieVector3;
  }

  /**
   * What a hit leaves of an archetype.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's meaning.
   * @evidence contracts/development/design.md#principled-representation The remainder, absent when every part breaks off, and each fragment with its velocity.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `Archetype.broken`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IBroken<Id extends string, Dimension extends string> {
    /** What stays, its parts and the affordances on them; null when every part broke off. */
    remainder: Archetype.IProps<Id, Dimension> | null;

    /** Each fragment, its parts and mass, and the velocity it leaves with. */
    fragments: readonly IFragment<Dimension>[];
  }

  /**
   * One fragment's rest record and the velocity it leaves with.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The set's id, its rest record and its velocity in metres per second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Listed by `IBroken`; `Archetype.broken` makes it a piece.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IFragment<Dimension extends string> {
    /** The set's id. */
    id: string;

    /** Its parts and mass, at rest. */
    props: Archetype.IProps<never, Dimension>;

    /** The velocity it leaves with, metres per second, in the archetype's space. */
    velocity: IAutoMovieVector3;
  }

  /**
   * What a hit leaves of an archetype, as archetypes: what `Archetype.broken` returns.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's meaning.
   * @evidence contracts/development/design.md#principled-representation `IBroken` with each record made an archetype at rest.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `Archetype.broken`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPieces<Id extends string, Dimension extends string> {
    /** What stays; null when every part broke off. */
    remainder: Archetype<Id, Dimension> | null;

    /** Each fragment as an archetype, with its velocity. */
    fragments: IPiece<Dimension>[];
  }

  /**
   * One fragment as an archetype, and the velocity it leaves with.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The set's id, the archetype at rest and its velocity in metres per second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Listed by `IPieces`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPiece<Dimension extends string> {
    /** The set's id. */
    id: string;

    /** The fragment, an archetype at rest. */
    archetype: Archetype<never, Dimension>;

    /** The velocity it leaves with, metres per second, in the archetype's space. */
    velocity: IAutoMovieVector3;
  }

  /**
   * Split an archetype's rest record by a hit.
   *
   * @param rest The archetype's rest record.
   * @param hit The hit.
   * @returns The remainder and fragments, or null when the archetype declares no fracture or the hit is below its threshold.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and when nothing breaks.
   * @evidence contracts/development/implementation.md#principled-implementation Each set's record carries its parts, their spans with both ends on them, and their own masses' mass properties (`ArchetypeMass.of` with those masses as shares); the remainder the rest, keeping each affordance whose moving parts all remain, that no set carries away and whose `rides` and `follows` chain stays whole, so the remainder is a model the engine admits; every piece the rest's contact without its threshold, since it declares no fracture set; every fragment's velocity the hit's momentum over the fragments' summed mass.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the hit, then one record per set and one for the remainder.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A set that names a part twice or a part of another set is a producer's defect the builder refuses; no spread is drawn.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the parts and the spans; the contacts' chain check repeats until none drops, at most once per contact, so it is quadratic in the contacts, tens at most.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each hit makes new records.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function split<Id extends string, Dimension extends string>(
    rest: Archetype.IProps<Id, Dimension>,
    hit: IHit,
  ): IBroken<Id, Dimension> | null {
    const threshold: number | undefined = rest.contact?.fracture;
    if (
      rest.fractures.length === 0 ||
      threshold === undefined ||
      hit.energy < threshold
    )
      return null;
    // A piece declares no fracture set, so it carries no threshold either.
    const contact: IAutoMovieBodyContact = { ...(rest.contact ?? {}) };
    delete contact.fracture;
    const record = <I extends string>(
      id: string,
      keep: ReadonlySet<string>,
      affordances: (IAutoMovieAffordance & { id: I })[],
    ): Archetype.IProps<I, Dimension> => {
      const parts: IAutoMovieModelPart[] = rest.parts.filter(
        (p: IAutoMovieModelPart): boolean => keep.has(p.id),
      );
      const mass: number = parts.reduce(
        (sum: number, p: IAutoMovieModelPart): number =>
          sum + (rest.masses[p.id] ?? 0),
        0,
      );
      return {
        ...rest,
        id,
        parts,
        affordances,
        properties: ArchetypeMass.of(parts, mass, {}, rest.masses),
        contact,
        spans: rest.spans.filter(
          (s: ArchetypeSpan.ISpan): boolean =>
            keep.has(s.id) &&
            (s.from.part === undefined || keep.has(s.from.part)) &&
            (s.to.part === undefined || keep.has(s.to.part)),
        ),
        fractures: [],
        masses: Object.fromEntries(
          parts.map((p: IAutoMovieModelPart): [string, number] => [
            p.id,
            rest.masses[p.id] ?? 0,
          ]),
        ),
      };
    };
    const broken: Set<string> = new Set(
      rest.fractures.flatMap((s: ISet): readonly string[] => s.parts),
    );
    const fragments: {
      id: string;
      props: Archetype.IProps<never, Dimension>;
    }[] = rest.fractures.map((s: ISet) => ({
      id: s.id,
      props: record<never>(`${rest.id}/${s.id}`, new Set(s.parts), []),
    }));
    const total: number = fragments.reduce(
      (sum: number, f: { props: Archetype.IProps<never, Dimension> }): number =>
        sum + f.props.properties.mass,
      0,
    );
    const velocity: IAutoMovieVector3 = {
      x: hit.momentum.x / total,
      y: hit.momentum.y / total,
      z: hit.momentum.z / total,
    };
    const kept: Set<string> = new Set(
      rest.parts
        .map((p: IAutoMovieModelPart): string => p.id)
        .filter((id: string): boolean => !broken.has(id)),
    );
    return {
      remainder:
        kept.size === 0
          ? null
          : record<Id>(rest.id, kept, remaining(rest, kept)),
      fragments: fragments.map((f) => ({ ...f, velocity })),
    };
  }

  /**
   * The contacts the remainder keeps: each whose moving parts all remain and that no set carries away, then, until none drops, each whose `rides` and `follows` name a contact still kept.
   *
   * @param rest The archetype's rest record.
   * @param kept The remainder's parts.
   * @returns The kept contacts, in the rest record's order.
   */
  function remaining<Id extends string, Dimension extends string>(
    rest: Archetype.IProps<Id, Dimension>,
    kept: ReadonlySet<string>,
  ): (IAutoMovieAffordance & { id: Id })[] {
    const carried: Set<string> = new Set(
      rest.fractures.flatMap(
        (s: ISet): readonly string[] => s.affordances ?? [],
      ),
    );
    const ids: Set<string> = new Set(
      rest.affordances
        .filter(
          (a: IAutoMovieAffordance): boolean =>
            !carried.has(a.id) &&
            (a.parts ?? []).every((p: string): boolean => kept.has(p)),
        )
        .map((a: IAutoMovieAffordance): string => a.id),
    );
    // A contact riding or following one that left goes with it; a chain drops link by link.
    for (let dropped: boolean = true; dropped; ) {
      dropped = false;
      for (const a of rest.affordances)
        if (
          ids.has(a.id) &&
          ((a.rides !== undefined && !ids.has(a.rides)) ||
            (a.follows !== undefined && !ids.has(a.follows.id)))
        ) {
          ids.delete(a.id);
          dropped = true;
        }
    }
    return rest.affordances.filter(
      (a: IAutoMovieAffordance & { id: Id }): boolean => ids.has(a.id),
    );
  }
}
