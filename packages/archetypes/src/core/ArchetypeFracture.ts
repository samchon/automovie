import type {
  IAutoMovieAffordance,
  IAutoMovieBodyContact,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { Archetype } from "./Archetype";
import { ArchetypeFractureEnergy } from "./ArchetypeFractureEnergy";
import type { ArchetypeFriction } from "./ArchetypeFriction";
import { ArchetypeMass } from "./ArchetypeMass";
import { ArchetypeMassArithmetic } from "./ArchetypeMassArithmetic";
import { ArchetypeRefusal } from "./ArchetypeRefusal";
import type { ArchetypeSpan } from "./ArchetypeSpan";

/**
 * How an archetype breaks: the sets of its parts a hit breaks off as fragments, and what is left.
 *
 * A producer declares its fragment sets (`ArchetypeBuilder.fracture`), each a group of its own parts that leaves as one fragment, and a calibrated `contact.fracture` energy. At or above it, each set becomes an archetype carrying its parts' masses, declared static contacts, wholly departing articulations and their riding contacts. The remainder keeps the other parts and contacts; a partly surviving articulation binds only its surviving parts. References to a carrier or driver in another piece are detached. Pieces use authored neutral coordinates, not the current displayed pose: removing a coupling can reset its nonzero default travel. No piece breaks again. Fragments share momentum with common velocity p/M, the minimum-energy allocation at fixed momentum, without an invented spread. This is not a complete collision or fracture-work model. The same archetype and hit always break the same way.
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

    /** Static contacts on these parts, such as a bottle's body grip. Articulations whose complete bound-part list belongs to the set, and zero-part contacts riding them (or following them without a carrier), transfer automatically. A declared contact cannot bind parts outside this set; cross-piece rides/follows are detached in authored neutral coordinates. Absent, no additional static contacts. */
    affordances?: readonly string[];
  }

  /**
   * A hit on an archetype.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit.
   * @evidence contracts/development/design.md#principled-representation The hit's finite nonnegative kinetic energy in joules, compared with the threshold, and finite-component momentum in kilogram metres per second, shared over the fragments. split admits the numeric restrictions that number alone cannot express.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `split`; written by a flight or a melee stop (#3480).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IHit {
    /** The hit's finite nonnegative energy, joules. */
    energy: number;

    /** The hit's finite-component momentum, kilogram metres per second, in the archetype's space. */
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
    fragments: readonly IFragment<Dimension, Id>[];
  }

  /**
   * One fragment's rest record and the velocity it leaves with.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The set's id, its rest record and its velocity in metres per second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Listed by `IBroken`; `Archetype.broken` makes it a piece.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IFragment<
    Dimension extends string,
    Id extends string = never,
  > {
    /** The set's id. */
    id: string;

    /** Its parts, mass and transferred contacts, in authored neutral coordinates. */
    props: Archetype.IProps<Id, Dimension>;

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
    fragments: IPiece<Dimension, Id>[];
  }

  /**
   * One fragment as an archetype, and the velocity it leaves with.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The set's id, the archetype at rest and its velocity in metres per second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Listed by `IPieces`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPiece<Dimension extends string, Id extends string = never> {
    /** The set's id. */
    id: string;

    /** The fragment with transferred contacts; detached couplings reset to authored neutral coordinates. */
    archetype: Archetype<Id, Dimension>;

    /** The velocity it leaves with, metres per second, in the archetype's space. */
    velocity: IAutoMovieVector3;
  }

  /**
   * Split an archetype's rest record by a hit.
   *
   * @param rest The archetype's rest record.
   * @param hit The hit.
   * @returns The remainder and fragments with independently owned velocity records, or null when no sets or no calibrated threshold are declared, or the hit is below that threshold.
   * @throws {ArchetypeRefusal} When hit or threshold data are invalid, departing mass or velocity is not finite and positive where required, or the supplied energy cannot carry the fragment momentum.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States hit units and finite-data admission, null cases, kinetic-energy feasibility, numerical overflow refusal and independent returned velocities.
   * @evidence contracts/development/implementation.md#principled-implementation Admits finite nonnegative energy and finite momentum before comparing the threshold. Each set carries only its parts, their declared surfaces, internal spans, mass and eligible contacts; a partial remainder articulation filters its bindings, and each piece drops external ride/follow references and the fracture threshold. Coordinates remain authored neutral inputs, not a baked displayed pose. Common velocity p/M gives minimum kinetic energy ||p||²/(2M) and the supplied momentum subject to binary64 division rounding. The shared mass arithmetic owns both complete piece and departing mass sums, including overflow-boundary admission. ArchetypeFractureEnergy checks the exact input-value necessary budget and supplies an admissible lower bound. Fracture work, striker and remainder dynamics are not modelled.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the hit, then one record per set and one for the remainder.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A set that names a part twice or a part of another set is a producer's defect the builder refuses; no spread is drawn. Negative or non-finite hit data are refused on breakable and unbreakable objects without clamping or substituting a zero hit.
   * @evidence contracts/development/implementation.md#efficient-algorithms With F sets, P parts, S spans, C contacts and B bound-part references, records and mass reductions cost O((F+1)(P+S)); fragment contact selection costs O(F(B+C squared+F)), and remainder contact selection O(B+C). Output retains O(P+S+C+F) references, mass records and independent velocities; static geometry stays borrowed. The fixed-size exact energy guard has no scene-size dependence.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each hit makes new records.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function split<Id extends string, Dimension extends string>(
    rest: Archetype.IProps<Id, Dimension>,
    hit: IHit,
  ): IBroken<Id, Dimension> | null {
    if (!(Number.isFinite(hit.energy) && hit.energy >= 0))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: rest.archetype,
        axis: "energy",
        value: hit.energy,
        feasible: { kind: "range", minimum: 0, maximum: null, unit: "J" },
        reason: "a hit needs finite nonnegative kinetic energy",
        fix: "give a finite energy at least zero",
      });
    if (!finiteVector(hit.momentum))
      throw momentumRefusal(
        rest.archetype,
        hit.momentum,
        "a hit needs finite momentum components",
      );

    const threshold: number | undefined = rest.contact?.fracture;
    if (rest.fractures.length === 0 || threshold === undefined) return null;

    if (!(Number.isFinite(threshold) && threshold > 0))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: rest.archetype,
        axis: "fracture",
        value: threshold,
        feasible: null,
        reason: "a fracture threshold needs finite positive energy",
        fix: "give the object's fracture threshold a finite value above zero joules",
      });
    if (hit.energy < threshold) return null;

    // A piece declares no fracture set, so it carries no threshold either.
    const contact: IAutoMovieBodyContact = { ...(rest.contact ?? {}) };
    delete contact.fracture;
    const record: <I extends string>(
      id: string,
      keep: ReadonlySet<string>,
      affordances: (IAutoMovieAffordance & { id: I })[],
    ) => Archetype.IProps<I, Dimension> = <I extends string>(
      id: string,
      keep: ReadonlySet<string>,
      affordances: (IAutoMovieAffordance & { id: I })[],
    ): Archetype.IProps<I, Dimension> => {
      const parts: IAutoMovieModelPart[] = rest.parts.filter(
        (p: IAutoMovieModelPart): boolean => keep.has(p.id),
      );
      const masses: number[] = parts.map(
        (p: IAutoMovieModelPart): number => {
          const value: number | undefined = rest.masses[p.id];
          if (!(value !== undefined && Number.isFinite(value) && value >= 0))
            throw massRefusal(
              rest.archetype,
              value,
              `part ${p.id} needs its own finite nonnegative mass`,
            );
          return value;
        },
      );
      const mass: number = ArchetypeMassArithmetic.sum(masses);
      if (!(Number.isFinite(mass) && mass > 0))
        throw massRefusal(
          rest.archetype,
          mass,
          `piece ${id} needs finite positive mass before its mass properties are computed`,
        );
      return {
        ...rest,
        id,
        parts,
        affordances,
        properties: ArchetypeMass.of(parts, mass, {}, rest.masses),
        surfaces: Object.fromEntries(
          parts.filter((p: IAutoMovieModelPart): boolean => rest.surfaces[p.id] !== undefined)
            .map((p: IAutoMovieModelPart): [string, ArchetypeFriction.Material] => [p.id, rest.surfaces[p.id]!]),
        ),
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
            rest.masses[p.id]!,
          ]),
        ),
      };
    };
    const broken: Set<string> = new Set(
      rest.fractures.flatMap((s: ISet): readonly string[] => s.parts),
    );
    /** One declared fragment's identity and independently built rest record. */
    type FragmentRecord = {
      id: string;
      props: Archetype.IProps<Id, Dimension>;
    };
    const fragments: FragmentRecord[] = rest.fractures.map(
      (s: ISet): FragmentRecord => ({
        id: s.id,
        props: record<Id>(
          `${rest.id}/${s.id}`,
          new Set(s.parts),
          carried(rest, s),
        ),
      }),
    );
    const total: number = ArchetypeMassArithmetic.sum(
      fragments.map((f: FragmentRecord): number => f.props.properties.mass),
    );
    if (!(Number.isFinite(total) && total > 0))
      throw massRefusal(
        rest.archetype,
        total,
        "departing fragments need a finite positive total mass",
      );

    const velocity: IAutoMovieVector3 = {
      x: hit.momentum.x / total,
      y: hit.momentum.y / total,
      z: hit.momentum.z / total,
    };
    if (!finiteVector(velocity))
      throw momentumRefusal(
        rest.archetype,
        hit.momentum,
        "the hit's momentum over the fragments' mass produces a non-finite velocity",
      );

    const energy: ReturnType<typeof ArchetypeFractureEnergy> =
      ArchetypeFractureEnergy(hit.energy, total, hit.momentum);
    if (!energy.sufficient)
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: rest.archetype,
        axis: "energy",
        value: hit.energy,
        feasible:
          energy.minimum === null
            ? null
            : {
                kind: "range",
                minimum: energy.minimum,
                maximum: null,
                unit: "J",
              },
        reason:
          "the fragment momentum needs more kinetic energy than the hit supplies",
        fix: "give a physically consistent energy and momentum for the departing mass",
      });

    const kept: Set<string> = new Set(
      rest.parts
        .map((p: IAutoMovieModelPart): string => p.id)
        .filter((id: string): boolean => !broken.has(id)),
    );
    const departed: Set<string> = new Set(
      fragments.flatMap((f: FragmentRecord): Id[] =>
        f.props.affordances.map(
          (a: IAutoMovieAffordance & { id: Id }): Id => a.id,
        ),
      ),
    );
    return {
      remainder:
        kept.size === 0
          ? null
          : record<Id>(rest.id, kept, remaining(rest, kept, departed)),
      fragments: fragments.map(
        (f: FragmentRecord): IFragment<Dimension, Id> => ({
          ...f,
          velocity: { ...velocity },
        }),
      ),
    };
  }

  /** Admit each physical vector component without a magnitude cutoff. */
  function finiteVector(value: IAutoMovieVector3): boolean {
    return (
      Number.isFinite(value.x) &&
      Number.isFinite(value.y) &&
      Number.isFinite(value.z)
    );
  }

  /** Keep invalid momentum and unrepresentable output in the author's refusal contract. */
  function momentumRefusal(
    archetype: string,
    value: IAutoMovieVector3,
    reason: string,
  ): ArchetypeRefusal {
    return new ArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "momentum",
      value,
      reason,
      feasible: null,
      fix: "give finite momentum components whose fragment velocity is finite",
    });
  }

  /** Refuse unsupported mass before the shared mass-property arithmetic sees it. */
  function massRefusal(
    archetype: string,
    value: number | undefined,
    reason: string,
  ): ArchetypeRefusal {
    return new ArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "fractureMass",
      value,
      feasible: null,
      reason,
      fix: "supply each part's finite nonnegative mass and finite positive piece totals",
    });
  }

  /**
   * Contacts not transferred to fragments, retaining only surviving part bindings
   * and detaching ride/follow references outside the remainder.
   *
   * @param rest The archetype's rest record.
   * @param kept The remainder's parts.
   * @param departed The contacts already owned by a fragment.
   * @returns The kept contacts, in the rest record's order.
   */
  function remaining<Id extends string, Dimension extends string>(
    rest: Archetype.IProps<Id, Dimension>,
    kept: ReadonlySet<string>,
    departed: ReadonlySet<string>,
  ): (IAutoMovieAffordance & { id: Id })[] {
    const ids: Set<string> = new Set(
      rest.affordances
        .filter(
          (a: IAutoMovieAffordance): boolean =>
            !departed.has(a.id) &&
            (a.parts === undefined ||
              a.parts.length === 0 ||
              a.parts.some((p: string): boolean => kept.has(p))),
        )
        .map((a: IAutoMovieAffordance): string => a.id),
    );
    return rest.affordances
      .filter((a: IAutoMovieAffordance & { id: Id }): boolean => ids.has(a.id))
      .map(
        (
          a: IAutoMovieAffordance & { id: Id },
        ): IAutoMovieAffordance & { id: Id } => {
          const detached: IAutoMovieAffordance & { id: Id } = { ...a };
          if (a.parts !== undefined)
            detached.parts = a.parts.filter((p: string): boolean =>
              kept.has(p),
            );
          if (a.rides !== undefined && !ids.has(a.rides)) delete detached.rides;
          if (a.follows !== undefined && !ids.has(a.follows.id))
            delete detached.follows;
          return detached;
        },
      );
  }

  /** Keep declared static contacts and wholly departing articulations, then their riding contacts. */
  function carried<Id extends string, Dimension extends string>(
    rest: Archetype.IProps<Id, Dimension>,
    set: ISet,
  ): (IAutoMovieAffordance & { id: Id })[] {
    const parts: Set<string> = new Set(set.parts);
    const ids: Set<string> = new Set(set.affordances ?? []);
    const elsewhere: Set<string> = new Set(
      rest.fractures.flatMap((other: ISet): readonly string[] =>
        other === set ? [] : (other.affordances ?? []),
      ),
    );
    for (const a of rest.affordances) {
      const bound: readonly string[] = a.parts ?? [];
      if (ids.has(a.id) && !bound.every((p: string): boolean => parts.has(p)))
        throw new Error(
          `fracture set ${set.id} carries contact ${a.id} bound outside its parts`,
        );
      if (
        !elsewhere.has(a.id) &&
        bound.length > 0 &&
        bound.every((p: string): boolean => parts.has(p))
      )
        ids.add(a.id);
    }
    for (let changed: boolean = true; changed; ) {
      changed = false;
      for (const a of rest.affordances) {
        const parent: string | undefined = a.rides ?? a.follows?.id;
        if (
          !ids.has(a.id) &&
          !elsewhere.has(a.id) &&
          (a.parts?.length ?? 0) === 0 &&
          parent !== undefined &&
          ids.has(parent)
        ) {
          ids.add(a.id);
          changed = true;
        }
      }
    }
    return rest.affordances
      .filter((a: IAutoMovieAffordance & { id: Id }): boolean => ids.has(a.id))
      .map(
        (
          a: IAutoMovieAffordance & { id: Id },
        ): IAutoMovieAffordance & { id: Id } => {
          const detached: IAutoMovieAffordance & { id: Id } = { ...a };
          if (a.rides !== undefined && !ids.has(a.rides)) delete detached.rides;
          if (a.follows !== undefined && !ids.has(a.follows.id))
            delete detached.follows;
          return detached;
        },
      );
  }
}
