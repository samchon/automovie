import type {
  IAutoMovieAffordance,
  IAutoMovieAffordanceCoupling,
  IAutoMovieMaterial,
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";

import { ArchetypeMassArithmetic } from "./internal/ArchetypeMassArithmetic";
import { AutoMovieArchetype } from "./AutoMovieArchetype";
import { AutoMovieArchetypeArticulation } from "./AutoMovieArchetypeArticulation";
import type { AutoMovieArchetypeConvexCell } from "./AutoMovieArchetypeConvexCell";
import { AutoMovieArchetypeFrame } from "./AutoMovieArchetypeFrame";
import type { AutoMovieArchetypeFriction } from "./AutoMovieArchetypeFriction";
import { AutoMovieArchetypeMass } from "./AutoMovieArchetypeMass";
import type { AutoMovieArchetypeMaterial } from "./AutoMovieArchetypeMaterial";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";
import { AutoMovieArchetypeSpan } from "./AutoMovieArchetypeSpan";
import { ownArchetypeRecordKeys } from "./internal/ownArchetypeRecordKeys";

/**
 * Several archetypes as one placed and ridden object: a chariot of a platform,
 * wheels and a pole, a railway carriage of a floor, seats, bars and doors, a
 * limbered gun.
 *
 * An assembly is an `AutoMovieArchetype` of its members, each placed in the
 * assembly's space and named by a key. Its parts, affordances and spans are the
 * members', their ids prefixed `<key>/`, so a seat inside it is named as
 * `bench2/seat`; its materials are the union of theirs; its mass properties are
 * theirs combined. It goes wherever an archetype goes: a ride moves it along a
 * course, a prop or a seat of a performance reads its affordances, and it
 * serialises as one model. Its `articulate` takes prefixed ids, and an
 * articulation follows one of another member only through the assembly's own
 * couplings (`couple`), so no member's own model is changed. `member(key)`
 * gives a member as it is posed in the assembly, with the member's own typed
 * accessors.
 *
 * An assembly is composed in a production's own source: it adds no dimension of
 * its own and is not a producer, so no finished set enters the package. The
 * same members, placements and seeds give the same assembly.
 *
 * @template M The members by key.
 */
export class AutoMovieArchetypeAssembly<
  M extends Readonly<Record<string, AutoMovieArchetypeAssembly.IMember>>,
> extends AutoMovieArchetype<AutoMovieArchetypeAssembly.Ids<M>, never> {
  /** The members by key, as given. */
  readonly #members: M;

  /** The assembly at rest, as its members and couplings build it. */
  readonly #props: AutoMovieArchetype.IProps<
    AutoMovieArchetypeAssembly.Ids<M>,
    never
  >;

  /**
   * An assembly at an articulation state.
   *
   * @param members The members by key.
   * @param props The merged model at rest.
   * @param state The travel of each leader articulation, by prefixed id.
   * @throws {AutoMovieArchetypeRefusal} As `AutoMovieArchetype`'s constructor
   *   does.
   */
  private constructor(
    members: M,
    props: AutoMovieArchetype.IProps<AutoMovieArchetypeAssembly.Ids<M>, never>,
    state: Partial<Record<AutoMovieArchetypeAssembly.Ids<M>, number>>,
  ) {
    super(props, state);
    this.#members = members;
    this.#props = props;
  }

  /**
   * An assembly of placed members.
   *
   * @param id The model's id, unique in a scene.
   * @param name Its readable name, such as `railway carriage`.
   * @param members The members by key, each an archetype and its placement in
   *   the assembly's space with unit scale; a member's own articulation state
   *   is kept.
   * @returns The assembly.
   * @throws {AutoMovieArchetypeRefusal} When there is no member, a key is empty
   *   or contains `/`, or a placement is not rigid with unit scale.
   */
  public static of<
    M extends Readonly<Record<string, AutoMovieArchetypeAssembly.IMember>>,
  >(id: string, name: string, members: M): AutoMovieArchetypeAssembly<M> {
    const keys: (keyof M & string)[] = ownArchetypeRecordKeys(members);
    const refuse = (
      axis: string,
      value: unknown,
      reason: string,
      fix: string,
    ): never => {
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: AutoMovieArchetypeAssembly.ARCHETYPE,
        axis,
        value,
        feasible: null,
        reason,
        fix,
      });
    };
    if (keys.length === 0)
      refuse("members", 0, "an assembly needs a member", "give it a member");

    const parts: IAutoMovieModelPart[] = [];
    const cells: Map<string, AutoMovieArchetypeConvexCell.ICell> = new Map();
    const affordances: (IAutoMovieAffordance & {
      id: AutoMovieArchetypeAssembly.Ids<M>;
    })[] = [];
    const materials: Map<string, IAutoMovieMaterial> = new Map();
    const spans: AutoMovieArchetypeSpan.ISpan[] = [];
    const placed: AutoMovieArchetypeMass.IPlaced[] = [];
    const state: Partial<Record<AutoMovieArchetypeAssembly.Ids<M>, number>> =
      {};
    let friction: number[] | null = [];
    let kinetic: number[] | null = [];
    let material: AutoMovieArchetypeMaterial.Kind | null | undefined;
    let restitution: number | null | undefined;
    const surfaces: Record<string, AutoMovieArchetypeFriction.Material> = {};
    // One member at a time, through its own key, so the key and its ids stay
    // correlated in `Ids<M>`.
    const absorb = <K extends keyof M & string>(key: K): void => {
      const member: M[K] = members[key];
      const placement: IAutoMovieTransform = member.placement;
      if (key.length === 0 || key.includes("/"))
        refuse(
          `members.${key}`,
          key,
          "a member's key names it before a `/` in every id it gives",
          "give the member a nonempty key without `/`",
        );
      if (
        [placement.scale.x, placement.scale.y, placement.scale.z].some(
          (s: number): boolean => s !== 1,
        )
      )
        refuse(
          `members.${key}.placement.scale`,
          placement.scale,
          "a member is placed rigidly",
          "place the member with unit scale",
        );

      // The member at rest, every id prefixed and every frame placed.
      const rest: AutoMovieArchetype = member.archetype.articulate({});
      const memberCells: AutoMovieArchetypeConvexCell.Table = rest.convexCells;
      const prefix = <Own extends string>(own: Own): `${K}/${Own}` =>
        `${key}/${own}`;
      const end = (
        e: AutoMovieArchetypeSpan.IEnd,
      ): AutoMovieArchetypeSpan.IEnd =>
        e.affordance !== undefined
          ? { type: "affordance", affordance: prefix(e.affordance) }
          : { type: "part", part: prefix(e.part), at: e.at };
      for (const part of rest.parts) {
        const cell: AutoMovieArchetypeConvexCell.ICell | undefined =
          memberCells.get(part.id);
        if (cell !== undefined) cells.set(prefix(part.id), cell);
        const surface: AutoMovieArchetypeFriction.Material | null =
          rest.surface(part.id);
        if (surface !== null) surfaces[prefix(part.id)] = surface;
        parts.push({
          ...part,
          id: prefix(part.id),
          transform: AutoMovieArchetypeFrame.compose(
            placement,
            part.transform ??
              AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
          ),
        });
      }
      for (const [at, affordance] of rest.affordances.entries())
        affordances.push({
          ...affordance,
          id: prefix(member.archetype.affordances[at]!.id),
          frame: AutoMovieArchetypeFrame.compose(placement, affordance.frame),
          ...(affordance.materialPart === undefined
            ? {}
            : { materialPart: prefix(affordance.materialPart) }),
          ...(affordance.parts === undefined
            ? {}
            : {
                parts: affordance.parts.map((p: string): string => prefix(p)),
              }),
          ...(affordance.rides === undefined
            ? {}
            : { rides: prefix(affordance.rides) }),
          ...(affordance.follows === undefined
            ? {}
            : {
                follows: {
                  ...affordance.follows,
                  id: prefix(affordance.follows.id),
                },
              }),
        });
      for (const material of rest.materials)
        if (!materials.has(material.id)) materials.set(material.id, material);
      for (const span of rest.spans)
        spans.push({
          ...span,
          id: prefix(span.id),
          from: end(span.from),
          to: end(span.to),
        });
      placed.push({ properties: rest.properties, placement });
      if (rest.body.friction === undefined) friction = null;
      else friction?.push(rest.body.friction);
      if (rest.body.kineticFriction === undefined) kinetic = null;
      else kinetic?.push(rest.body.kineticFriction);
      if (material === undefined) {
        material = rest.physicalMaterial;
        restitution = rest.body.restitution ?? null;
      } else {
        if (material !== rest.physicalMaterial) material = null;
        if (
          material === null ||
          restitution === null ||
          rest.body.restitution === undefined ||
          restitution !== rest.body.restitution
        )
          restitution = null;
      }
      // A member's state record is keyed by the archetype's own affordance id,
      // the same `Id` its `affordances` carry, so every configured entry is
      // found by walking the affordances.
      for (const named of member.archetype.affordances) {
        const travel: number | undefined = member.archetype.state[named.id];
        if (travel !== undefined) state[prefix(named.id)] = travel;
      }
    };
    for (const key of keys) absorb(key);
    const properties: AutoMovieArchetypeMass.IProperties =
      AutoMovieArchetypeMass.combine(placed);
    const weights: number[] = placed.map(
      (member: AutoMovieArchetypeMass.IPlaced): number =>
        member.properties.mass,
    );
    let frictionValue: number | null =
      friction === null
        ? null
        : ArchetypeMassArithmetic.mean(friction, weights);
    let kineticValue: number | null =
      kinetic === null ? null : ArchetypeMassArithmetic.mean(kinetic, weights);
    if (
      friction !== null &&
      kinetic !== null &&
      frictionValue !== null &&
      kineticValue !== null &&
      kineticValue > frictionValue
    ) {
      frictionValue = ArchetypeMassArithmetic.mean(friction, weights, true);
      kineticValue = ArchetypeMassArithmetic.mean(kinetic, weights, true);
    }
    return new AutoMovieArchetypeAssembly<M>(
      members,
      {
        archetype: AutoMovieArchetypeAssembly.ARCHETYPE,
        id,
        name,
        parts,
        cells,
        affordances,
        materials: [...materials.values()],
        properties,
        friction: frictionValue,
        kineticFriction: kineticValue,
        surfaces,
        material: material ?? null,
        restitution: restitution ?? null,
        // An assembly is no launched body: no member's flight data speaks for the whole.
        drag: null,
        contact: null,
        // An assembly does not break as one: a member that breaks is broken on its own.
        fractures: [],
        masses: {},
        dimensions: {},
        provenance: { bands: {}, models: {}, figures: {}, units: {} },
        spans,
      },
      state,
    );
  }

  /**
   * This assembly with an articulation of one member following an articulation
   * of another, as the members' own `follows` would within one member: a
   * chariot's wheel turning with its pole, a gun's elevation with a limber's
   * crank.
   *
   * @param follower The follower's prefixed id; it must not already follow, by
   *   its member's own declaration or an earlier coupling.
   * @param follows Its rule, with the leader's prefixed id.
   * @returns A new assembly at the same state; this one is unchanged.
   * @throws {AutoMovieArchetypeRefusal} When the follower is no articulation of
   *   the assembly, already follows, or the coupling makes a chain of leaders
   *   return to itself or takes the follower outside its range at the current
   *   state, as the articulation pose refuses.
   */
  public couple(
    follower: AutoMovieArchetypeAssembly.Ids<M>,
    follows: IAutoMovieAffordanceCoupling & {
      id: AutoMovieArchetypeAssembly.Ids<M>;
    },
  ): AutoMovieArchetypeAssembly<M> {
    const found: IAutoMovieAffordance | undefined =
      this.#props.affordances.find(
        (a: IAutoMovieAffordance): boolean => a.id === follower,
      );
    if (
      found === undefined ||
      !AutoMovieArchetypeArticulation.KINDS.has(found.kind)
    )
      throw new AutoMovieArchetypeRefusal({
        kind: "articulation",
        archetype: AutoMovieArchetypeAssembly.ARCHETYPE,
        axis: "articulation",
        value: follower,
        feasible: {
          kind: "alternatives",
          values: this.#props.affordances
            .filter((a: IAutoMovieAffordance): boolean =>
              AutoMovieArchetypeArticulation.KINDS.has(a.kind),
            )
            .map((a: IAutoMovieAffordance): string => a.id),
        },
        reason: `"${follower}" is not an articulation of this assembly`,
        fix: "couple one of the assembly's articulations",
      });
    if (found.follows !== undefined)
      throw new AutoMovieArchetypeRefusal({
        kind: "articulation",
        archetype: AutoMovieArchetypeAssembly.ARCHETYPE,
        axis: follower,
        value: follows.id,
        feasible: { kind: "alternatives", values: [found.follows.id] },
        reason: `"${follower}" already follows "${found.follows.id}"`,
        fix: "couple an articulation that is set on its own",
      });
    return new AutoMovieArchetypeAssembly<M>(
      this.#members,
      {
        ...this.#props,
        affordances: this.#props.affordances.map(
          (
            a: IAutoMovieAffordance & { id: AutoMovieArchetypeAssembly.Ids<M> },
          ): IAutoMovieAffordance & {
            id: AutoMovieArchetypeAssembly.Ids<M>;
          } => (a.id === follower ? { ...a, follows } : a),
        ),
      },
      this.state,
    );
  }

  /**
   * One member as it is posed in this assembly, in the member's own space, with
   * its own typed accessors.
   *
   * @param key The member's key.
   * @returns The member archetype at the travels this assembly gives its
   *   articulations, a coupled follower's included.
   * @throws {AutoMovieArchetypeRefusal} When the assembly has no such member,
   *   listing its keys.
   */
  public member<K extends keyof M & string>(
    key: K,
  ): AutoMovieArchetype<
    AutoMovieArchetypeAssembly.MemberId<M[K]>,
    AutoMovieArchetypeAssembly.MemberDimension<M[K]>
  > {
    const member: M[K] | undefined = this.#members[key];
    if (member === undefined)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: AutoMovieArchetypeAssembly.ARCHETYPE,
        axis: "member",
        value: key,
        feasible: { kind: "alternatives", values: Object.keys(this.#members) },
        reason: `the assembly has no member "${key}"`,
        fix: "name one of the assembly's members",
      });
    const archetype: AutoMovieArchetype<
      AutoMovieArchetypeAssembly.MemberId<M[K]>,
      AutoMovieArchetypeAssembly.MemberDimension<M[K]>
    > = member.archetype;
    const state: Partial<
      Record<AutoMovieArchetypeAssembly.MemberId<M[K]>, number>
    > = {};
    for (const affordance of archetype.affordances) {
      if (
        !AutoMovieArchetypeArticulation.KINDS.has(affordance.kind) ||
        affordance.follows !== undefined
      )
        continue;
      const travel: number = this.travel(`${key}/${affordance.id}`);
      if (travel !== 0) state[affordance.id] = travel;
    }
    return archetype.articulate(state);
  }

  /**
   * This assembly with its articulations at stated travels, by prefixed id, as
   * `AutoMovieArchetype.articulate` documents.
   *
   * @param state The travel of each leader articulation by prefixed id.
   * @returns A new assembly; this one is unchanged.
   * @throws {AutoMovieArchetypeRefusal} As `AutoMovieArchetype.articulate`
   *   does, listing the prefixed ids for an unknown one.
   */
  public override articulate(
    state: Partial<Record<AutoMovieArchetypeAssembly.Ids<M>, number>>,
  ): AutoMovieArchetypeAssembly<M> {
    return new AutoMovieArchetypeAssembly<M>(this.#members, this.#props, state);
  }
}

/**
 * Companion types and constant of {@link AutoMovieArchetypeAssembly}: a member
 * is an archetype and a rigid placement, and the id unions are derived from the
 * members' own closed unions, read by the assembly's methods' signatures; the
 * class's own claims cover them.
 */
export namespace AutoMovieArchetypeAssembly {
  /** The name refusals carry for an assembly, which is no producer's. */
  export const ARCHETYPE: string = "assembly";

  /**
   * One member: an archetype and where it sits in the assembly.
   *
   * @template I The member's affordance ids.
   * @template D The member's free dimensions.
   */
  export interface IMember<
    I extends string = string,
    D extends string = string,
  > {
    /** The member, at the articulation state it enters the assembly with. */
    archetype: AutoMovieArchetype<I, D>;

    /** Its placement in the assembly's space, with unit scale. */
    placement: IAutoMovieTransform;
  }

  /** A member's affordance ids, read from its archetype's type. */
  export type MemberId<T extends IMember> =
    T["archetype"]["affordances"][number]["id"];

  /** A member's free dimensions, read from its archetype's type. */
  export type MemberDimension<T> = T extends {
    archetype: AutoMovieArchetype<string, infer D>;
  }
    ? D
    : never;

  /**
   * Every id an assembly gives: each member's affordance ids under its key, as
   * `<key>/<id>`.
   */
  export type Ids<M extends Readonly<Record<string, IMember>>> = {
    [K in keyof M & string]: `${K}/${MemberId<M[K]>}`;
  }[keyof M & string];
}
