import type {
  IAutoMovieAffordance,
  IAutoMovieMaterial,
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";

import { Archetype } from "./Archetype";
import { ArchetypeArticulation } from "./ArchetypeArticulation";
import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeMass } from "./ArchetypeMass";
import { ArchetypeRefusal } from "./ArchetypeRefusal";
import { ArchetypeSpan } from "./ArchetypeSpan";

/**
 * Several archetypes as one placed and ridden object: a chariot of a platform, wheels and a pole, a railway carriage of a floor, seats, bars and doors, a limbered gun.
 *
 * An assembly is an `Archetype` of its members, each placed in the assembly's space and named by a key. Its parts, affordances and spans are the members', their ids prefixed `<key>/`, so a seat inside it is named as `bench2/seat`; its materials are the union of theirs; its mass properties are theirs combined. It goes wherever an archetype goes: a ride moves it along a course, a prop or a seat of a performance reads its affordances, and it serialises as one model. Its `articulate` takes prefixed ids, and an articulation follows one of another member only through the assembly's own couplings (`couple`), so no member's own model is changed. `member(key)` gives a member as it is posed in the assembly, with the member's own typed accessors.
 *
 * An assembly is composed in a production's own source: it adds no dimension of its own and is not a producer, so no finished set enters the package. The same members, placements and seeds give the same assembly.
 *
 * @template M The members by key.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what an assembly is, how its ids read, what it combines, where it goes, how it articulates and couples, and why it is not a producer.
 * @evidence contracts/development/design.md#principled-representation A model that is the disjoint union of placed rigid sub-models, ids kept unique by the member keys; the members' mass properties combined by the parallel-axis theorem.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `of`, `couple` and `member`, the three #3477 asks for; everything else is the `Archetype` it extends.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The member ids are a template literal union over the members' own closed ids, so a prefixed id is checked at compile time; a key may not contain the separator.
 */
export class ArchetypeAssembly<
  M extends Readonly<Record<string, ArchetypeAssembly.IMember>>,
> extends Archetype<ArchetypeAssembly.Ids<M>, never> {
  /** The members by key, as given. */
  readonly #members: M;

  /** The assembly at rest, as its members and couplings build it. */
  readonly #props: Archetype.IProps<ArchetypeAssembly.Ids<M>, never>;

  /**
   * An assembly at an articulation state.
   *
   * @param members The members by key.
   * @param props The merged model at rest.
   * @param state The travel of each leader articulation, by prefixed id.
   * @throws {ArchetypeRefusal} As `Archetype`'s constructor does.
   */
  private constructor(
    members: M,
    props: Archetype.IProps<ArchetypeAssembly.Ids<M>, never>,
    state: Partial<Record<ArchetypeAssembly.Ids<M>, number>>,
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
   * @param members The members by key, each an archetype and its placement in the assembly's space with unit scale; a member's own articulation state is kept.
   * @returns The assembly.
   * @throws {ArchetypeRefusal} When there is no member, a key is empty or contains `/`, or a placement is not rigid with unit scale.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's role, what a member keeps and each refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Each member is read at rest, its parts' transforms and affordances' frames composed under its placement and every id and reference prefixed; mass properties by `ArchetypeMass.combine`; the members' set travels become the assembly's under their prefixes. Friction and restitution are the members' mass-weighted means, a stand-in because the model's body carries one coefficient of each for the whole.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the members, merge them, construct.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A non-rigid placement is refused rather than having its scale dropped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the members' parts, affordances and spans.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The assembly holds its members and its merged rest model for as long as its caller keeps it.
   */
  public static of<M extends Readonly<Record<string, ArchetypeAssembly.IMember>>>(
    id: string,
    name: string,
    members: M,
  ): ArchetypeAssembly<M> {
    const keys: string[] = Object.keys(members);
    const refuse = (axis: string, value: unknown, reason: string, fix: string): never => {
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: ArchetypeAssembly.ARCHETYPE,
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
    const affordances: (IAutoMovieAffordance & {
      id: ArchetypeAssembly.Ids<M>;
    })[] = [];
    const materials: Map<string, IAutoMovieMaterial> = new Map();
    const spans: ArchetypeSpan.ISpan[] = [];
    const placed: ArchetypeMass.IPlaced[] = [];
    const state: Partial<Record<ArchetypeAssembly.Ids<M>, number>> = {};
    let friction: number = 0;
    let restitution: number = 0;
    let mass: number = 0;
    for (const key of keys) {
      const member: ArchetypeAssembly.IMember = members[key]!;
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
      const rest: Archetype = member.archetype.articulate({});
      const prefix = (own: string): string => `${key}/${own}`;
      const end = (e: ArchetypeSpan.End): ArchetypeSpan.End =>
        e.affordance !== undefined
          ? { affordance: prefix(e.affordance) }
          : { part: prefix(e.part), at: e.at };
      for (const part of rest.parts)
        parts.push({
          ...part,
          id: prefix(part.id),
          transform: ArchetypeFrame.compose(
            placement,
            part.transform ?? ArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
          ),
        });
      for (const affordance of rest.affordances)
        affordances.push({
          ...affordance,
          id: prefix(affordance.id) as ArchetypeAssembly.Ids<M>,
          frame: ArchetypeFrame.compose(placement, affordance.frame),
          ...(affordance.parts === undefined
            ? {}
            : { parts: affordance.parts.map((p: string): string => prefix(p)) }),
          ...(affordance.rides === undefined
            ? {}
            : { rides: prefix(affordance.rides) }),
          ...(affordance.follows === undefined
            ? {}
            : { follows: { ...affordance.follows, id: prefix(affordance.follows.id) } }),
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
      const weight: number = rest.properties.mass;
      friction += rest.body.friction * weight;
      restitution += rest.body.restitution * weight;
      mass += weight;
      for (const [own, travel] of Object.entries(member.archetype.state))
        if (travel !== undefined)
          state[prefix(own) as ArchetypeAssembly.Ids<M>] = travel;
    }
    return new ArchetypeAssembly<M>(
      members,
      {
        archetype: ArchetypeAssembly.ARCHETYPE,
        id,
        name,
        parts,
        affordances,
        materials: [...materials.values()],
        properties: ArchetypeMass.combine(placed),
        friction: friction / mass,
        restitution: restitution / mass,
        dimensions: {},
        spans,
      },
      state,
    );
  }

  /**
   * This assembly with an articulation of one member following an articulation of another, as the members' own `follows` would within one member: a chariot's wheel turning with its pole, a gun's elevation with a limber's crank.
   *
   * @param follower The follower's prefixed id; it must not already follow, by its member's own declaration or an earlier coupling.
   * @param follows Its rule, with the leader's prefixed id.
   * @returns A new assembly at the same state; this one is unchanged.
   * @throws {ArchetypeRefusal} When the follower is no articulation of the assembly, already follows, or the coupling makes a chain of leaders return to itself or takes the follower outside its range at the current state, as the articulation pose refuses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the coupling joins, what must hold and each refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The follower's merged affordance gains the `follows` record; the members' own models are untouched, so each stays valid on its own. The engine's admission of the whole model checks the rule over the leader's full range, as it does for any model.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the follower, copy the rest model with one record replaced, construct.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A follower that already follows is refused, never overwritten.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the affordances.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The parts, materials, spans and mass properties are shared with the new assembly.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The new assembly holds its own affordance list.
   */
  public couple(
    follower: ArchetypeAssembly.Ids<M>,
    follows: IAutoMovieAffordance.Follows & { id: ArchetypeAssembly.Ids<M> },
  ): ArchetypeAssembly<M> {
    const found: IAutoMovieAffordance | undefined = this.#props.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === follower,
    );
    if (found === undefined || !ArchetypeArticulation.KINDS.has(found.kind))
      throw new ArchetypeRefusal({
        kind: "articulation",
        archetype: ArchetypeAssembly.ARCHETYPE,
        axis: "articulation",
        value: follower,
        feasible: {
          kind: "alternatives",
          values: this.#props.affordances
            .filter((a: IAutoMovieAffordance): boolean =>
              ArchetypeArticulation.KINDS.has(a.kind),
            )
            .map((a: IAutoMovieAffordance): string => a.id),
        },
        reason: `"${follower}" is not an articulation of this assembly`,
        fix: "couple one of the assembly's articulations",
      });
    if (found.follows !== undefined)
      throw new ArchetypeRefusal({
        kind: "articulation",
        archetype: ArchetypeAssembly.ARCHETYPE,
        axis: follower,
        value: follows.id,
        feasible: { kind: "alternatives", values: [found.follows.id] },
        reason: `"${follower}" already follows "${found.follows.id}"`,
        fix: "couple an articulation that is set on its own",
      });
    return new ArchetypeAssembly<M>(
      this.#members,
      {
        ...this.#props,
        affordances: this.#props.affordances.map(
          (
            a: IAutoMovieAffordance & { id: ArchetypeAssembly.Ids<M> },
          ): IAutoMovieAffordance & { id: ArchetypeAssembly.Ids<M> } =>
            a.id === follower ? { ...a, follows } : a,
        ),
      },
      this.state,
    );
  }

  /**
   * One member as it is posed in this assembly, in the member's own space, with its own typed accessors.
   *
   * @param key The member's key.
   * @returns The member archetype at the travels this assembly gives its articulations, a coupled follower's included.
   * @throws {ArchetypeRefusal} When the assembly has no such member, listing its keys.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the space, what the travels are and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The member articulated at the assembly's resolved travels of its own leader articulations; a member-declared follower takes its leader's travel again inside the member, which is the same rule, and a coupled follower is a leader within the member, so its travel is set.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find, collect the travels, articulate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown key is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the member's affordances.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the member's own `articulate`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  public member<K extends keyof M & string>(
    key: K,
  ): Archetype<
    ArchetypeAssembly.MemberId<M[K]>,
    ArchetypeAssembly.MemberDimension<M[K]>
  > {
    const member: M[K] | undefined = this.#members[key];
    if (member === undefined)
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: ArchetypeAssembly.ARCHETYPE,
        axis: "member",
        value: key,
        feasible: { kind: "alternatives", values: Object.keys(this.#members) },
        reason: `the assembly has no member "${key}"`,
        fix: "name one of the assembly's members",
      });
    const archetype: Archetype<
      ArchetypeAssembly.MemberId<M[K]>,
      ArchetypeAssembly.MemberDimension<M[K]>
    > = member.archetype as Archetype<
      ArchetypeAssembly.MemberId<M[K]>,
      ArchetypeAssembly.MemberDimension<M[K]>
    >;
    const state: Partial<Record<ArchetypeAssembly.MemberId<M[K]>, number>> = {};
    for (const affordance of archetype.affordances) {
      if (
        !ArchetypeArticulation.KINDS.has(affordance.kind) ||
        affordance.follows !== undefined
      )
        continue;
      const travel: number = this.travel(
        `${key}/${affordance.id}` as ArchetypeAssembly.Ids<M>,
      );
      if (travel !== 0)
        state[affordance.id as ArchetypeAssembly.MemberId<M[K]>] = travel;
    }
    return archetype.articulate(state);
  }

  /**
   * This assembly with its articulations at stated travels, by prefixed id, as `Archetype.articulate` documents.
   *
   * @param state The travel of each leader articulation by prefixed id.
   * @returns A new assembly; this one is unchanged.
   * @throws {ArchetypeRefusal} As `Archetype.articulate` does, listing the prefixed ids for an unknown one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the ids' form and points to the documented base.
   * @evidence contracts/development/implementation.md#principled-implementation Poses the merged rest model again, which moves each member's parts as the member's own pose would, placed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refusals are the base's, never clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in parts and affordances.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The members and the merged rest model are shared with the new assembly.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each assembly holds one reference to the shared rest model and its own posed lists.
   */
  public override articulate(
    state: Partial<Record<ArchetypeAssembly.Ids<M>, number>>,
  ): ArchetypeAssembly<M> {
    return new ArchetypeAssembly<M>(this.#members, this.#props, state);
  }
}

/**
 * Companion types and constant of {@link ArchetypeAssembly}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each type states what it derives.
 * @evidence contracts/development/design.md#principled-representation A member is an archetype and a rigid placement; the id unions are derived from the members' own closed unions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the assembly; read by its methods' signatures.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace ArchetypeAssembly {
  /** The name refusals carry for an assembly, which is no producer's. */
  export const ARCHETYPE: string = "assembly";

  /**
   * One member: an archetype and where it sits in the assembly.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning.
   * @evidence contracts/development/design.md#principled-representation An archetype and a rigid placement in metres with unit scale, which `of` refuses otherwise.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; the values of an assembly's member record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   *
   * @template I The member's affordance ids.
   * @template D The member's free dimensions.
   */
  export interface IMember<I extends string = string, D extends string = string> {
    /** The member, at the articulation state it enters the assembly with. */
    archetype: Archetype<I, D>;

    /** Its placement in the assembly's space, with unit scale. */
    placement: IAutoMovieTransform;
  }

  /**
   * A member's affordance ids, read from its archetype's type.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it derives.
   * @evidence contracts/development/design.md#principled-representation The member archetype's own closed id union, inferred, so the assembly's ids follow the producer's.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `Ids` and `member`'s return type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type MemberId<T> = T extends { archetype: Archetype<infer I, string> }
    ? I
    : never;

  /**
   * A member's free dimensions, read from its archetype's type.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it derives.
   * @evidence contracts/development/design.md#principled-representation The member archetype's own closed dimension union, inferred.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `member`'s return type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type MemberDimension<T> = T extends {
    archetype: Archetype<string, infer D>;
  }
    ? D
    : never;

  /**
   * Every id an assembly gives: each member's affordance ids under its key, as `<key>/<id>`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the form of the ids.
   * @evidence contracts/development/design.md#principled-representation A template literal union over the members' keys and closed ids, so a prefixed id is checked at compile time.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The assembly's affordance id parameter, read by `articulate`, `couple` and the inherited accessors.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Ids<M> = {
    [K in keyof M & string]: `${K}/${MemberId<M[K]>}`;
  }[keyof M & string];
}
