import type {
  IAutoMovieAffordance,
  IAutoMovieBody,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMoviePhysicalProfile,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeArticulation } from "./ArchetypeArticulation";
import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeMass } from "./ArchetypeMass";
import { ArchetypeRefusal } from "./ArchetypeRefusal";
import { ArchetypeShapes } from "./ArchetypeShapes";
import { ArchetypeSite } from "./ArchetypeSite";
import { ArchetypeSpan } from "./ArchetypeSpan";

/**
 * What a producer returns: a model of one thing people hold, use, sit on, ride or fight with, with typed access to what a person's act reads from it.
 *
 * An archetype is an `IAutoMovieModel`: its own enumerable members are exactly a rigid generated model's (`id`, `name`, `origin`, `parts`, `skeleton`, `body`, `affordances`, `materials`, `asset`), so it goes wherever a model goes, serialises as one, and two archetypes from the same parameters and seed serialise to the same text. Everything else is reached through accessors that a copy or a serialisation leaves behind:
 *
 * - `affordance(id)` and `site(id, u, v)` give a contact and a place on it, with `id` checked against the producer's closed id type at compile time and refused at run time with the ids that exist;
 * - `articulate(state)` gives the archetype with its articulations at the stated travels, parts and carried affordances moved with them, followers set by their leaders and spans laid again between their ends; `travel(id)` gives any articulation's travel, a follower's included, and `span(id)` a span's ends and slack. The travels live on the instance only: a serialised posed archetype is a picture of that pose and carries no state, so articulate from the archetype a producer returned, never from a copy read back;
 * - `dimensions` gives the value drawn for each free dimension, and `properties` the mass, centre of mass and inertia;
 * - `shapes()` gives colliders for a hand to close on, and `placed(id, placement)` a contact's frame in the world.
 *
 * Lengths are metres, masses kilograms and angles degrees. The model's space has `+Y` up and `+Z` to the front of a thing that has one; an archetype that stands on the floor has its origin on the floor.
 *
 * @template Id The archetype's affordance ids, a closed union the producer declares.
 * @template Dimension The archetype's free dimensions, a closed union the producer declares.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States that the instance is a model, which members serialise, each accessor's purpose, the units and the model's axes.
 * @evidence contracts/development/design.md#principled-representation A model plus read-only derived views of it; the state that distinguishes an articulated copy lives in private fields, so the serialised model stays the single truth of what is drawn and what is touched.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The accessors are those the motion grammar's prop axis reads (#3358): contacts, sites, articulation, mass properties and colliders. The type parameters carry each producer's closed ids, the agent surface #3368 asks for.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No registry and no string-keyed parameter: an archetype is made only by its typed producer, and an unknown id is a refusal, never undefined.
 */
export class Archetype<
  Id extends string = string,
  Dimension extends string = string,
> implements IAutoMovieModel {
  /** Model id, unique in a scene; the producer's `id` parameter or its own name. */
  public readonly id: string;

  /** Readable name of the thing, such as `dining chair`. */
  public readonly name: string | null;

  /** Always generated: the geometry is fully described by `parts`. */
  public readonly origin: "generated" = "generated" as const;

  /** The primitive parts at the current articulation state. */
  public readonly parts: IAutoMovieModelPart[];

  /** Always null: an archetype is a rigid or articulated object, never a humanoid rig. */
  public readonly skeleton: null = null;

  /** Mass, centre of mass and contact coefficients; the centre is at rest and does not follow articulation. */
  public readonly body: IAutoMovieBody;

  /** The contacts at the current articulation state. */
  public readonly affordances: IAutoMovieAffordance[];

  /** The few flat materials the parts cite. */
  public readonly materials: IAutoMovieMaterial[];

  /** Always null: no binary payload backs an archetype. */
  public readonly asset: null = null;

  /** What the producer built, at rest. */
  readonly #rest: Archetype.IProps<Id, Dimension>;

  /** The travel of each articulation that is away from rest. */
  readonly #state: Partial<Record<Id, number>>;

  /** Every articulation's travel at this state, set or followed. */
  readonly #travels: ReadonlyMap<string, number>;

  /**
   * An archetype from what a producer built, at an articulation state.
   *
   * @param props The archetype at rest; the records are kept, not copied, so a producer hands over ownership.
   * @param state The travel of each articulation; at rest when absent.
   * @throws {ArchetypeRefusal} As {@link ArchetypeArticulation.pose} does for a state the model does not admit, and as {@link ArchetypeSpan.lay} does for a span whose ends meet.
   */
  public constructor(
    props: Archetype.IProps<Id, Dimension>,
    state: Partial<Record<Id, number>> = {},
  ) {
    // The travels that were set, as the pose reads them.
    const travels: Map<string, number> = new Map();
    for (const id of Object.keys(state) as Id[]) {
      const travel: number | undefined = state[id];
      if (travel !== undefined) travels.set(id, travel);
    }

    const posed: ArchetypeArticulation.IResult = ArchetypeArticulation.pose(
      props.archetype,
      { parts: props.parts, affordances: props.affordances },
      travels,
    );
    this.id = props.id;
    this.name = props.name;
    this.parts = ArchetypeSpan.lay(
      props.archetype,
      props.spans,
      posed.parts,
      posed.affordances,
    );
    this.#travels = posed.travels;
    this.body = {
      mass: props.properties.mass,
      centerOfMass: { ...props.properties.centerOfMass },
      friction: props.friction,
      restitution: props.restitution,
    };
    this.affordances = posed.affordances;
    this.materials = props.materials;
    this.#rest = props;
    this.#state = { ...state };
  }

  /** The producer's name, such as `chair`, which refusals carry. */
  public get archetype(): string {
    return this.#rest.archetype;
  }

  /** The value of each free dimension this variant has, in the unit of its band: drawn from the seed, or fixed by a parameter. A dimension the variant lacks, as a stool lacks a back height, is absent. */
  public get dimensions(): Readonly<Partial<Record<Dimension, number>>> {
    return this.#rest.dimensions;
  }

  /** Mass, centre of mass and inertia about it, at rest. */
  public get properties(): ArchetypeMass.IProperties {
    return this.#rest.properties;
  }

  /** The travel of each articulation that was set, by id; a follower's is read through `travel`. */
  public get state(): Partial<Record<Id, number>> {
    return this.#state;
  }

  /** The spans this archetype lays between moving frames, at rest. */
  public get spans(): readonly ArchetypeSpan.ISpan[] {
    return this.#rest.spans;
  }

  /**
   * An articulation's travel at this state: the travel set for a leader, 0 for one not set, and the travel its leader gives a follower.
   *
   * @param id The articulation's id.
   * @returns The travel, degrees for the turning kinds and metres for the others.
   * @throws {ArchetypeRefusal} When the id is no articulation of the archetype, listing those it has.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units, what a follower reads and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A lookup in the travels the pose resolved.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find, or refuse with the alternatives.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An id that is no articulation is refused, never read as 0.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the travels the constructor's pose resolved.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  public travel(id: Id): number {
    const travel: number | undefined = this.#travels.get(id);
    if (travel !== undefined) return travel;
    throw new ArchetypeRefusal({
      kind: "articulation",
      archetype: this.#rest.archetype,
      axis: "articulation",
      value: id,
      feasible: { kind: "alternatives", values: [...this.#travels.keys()] },
      reason: `"${id}" is not an articulation of this model`,
      fix: "name one of the model's articulations",
    });
  }

  /**
   * One of the archetype's spans at the current articulation state: where its ends are and whether it is slack.
   *
   * @param id The span's part id.
   * @returns Its state, in the model's space.
   * @throws {ArchetypeRefusal} When the archetype has no such span, listing those it has.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the space and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation `ArchetypeSpan.state` over the posed parts and affordances, the same ends the parts were laid between.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find, then one call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown span is refused, never undefined.
   * @evidence contracts/development/implementation.md#efficient-algorithms A scan of the spans and of the parts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `ArchetypeSpan.state`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  public span(id: string): ArchetypeSpan.IState {
    const found: ArchetypeSpan.ISpan | undefined = this.#rest.spans.find(
      (s: ArchetypeSpan.ISpan): boolean => s.id === id,
    );
    if (found === undefined)
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: this.#rest.archetype,
        axis: "span",
        value: id,
        feasible: {
          kind: "alternatives",
          values: this.#rest.spans.map((s: ArchetypeSpan.ISpan): string => s.id),
        },
        reason: `${this.name ?? this.id} has no span "${id}"`,
        fix: "name one of the spans this archetype declares",
      });
    return ArchetypeSpan.state(
      this.#rest.archetype,
      found,
      this.parts,
      this.affordances,
    );
  }

  /**
   * One of the archetype's contacts, at the current articulation state.
   *
   * @param id The affordance id.
   * @returns The affordance, its frame in the model's space.
   * @throws {ArchetypeRefusal} When the archetype declares no such affordance, listing the ids it declares; a producer's variant may lack an id its type allows, as a glass lacks a mug's handle.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame's space and why a typed id can still be refused.
   * @evidence contracts/development/implementation.md#principled-implementation A lookup by id over the model's own affordance list, the same list a serialised copy carries.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find, or refuse with the alternatives.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing id never yields a default contact.
   * @evidence contracts/development/implementation.md#efficient-algorithms A scan of at most tens of affordances.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A lookup with nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  public affordance(id: Id): IAutoMovieAffordance {
    const found: IAutoMovieAffordance | undefined = this.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    );
    if (found !== undefined) return found;
    throw new ArchetypeRefusal({
      kind: "affordance",
      archetype: this.#rest.archetype,
      axis: "affordance",
      value: id,
      feasible: {
        kind: "alternatives",
        values: this.affordances.map((a: IAutoMovieAffordance): string => a.id),
      },
      reason: `${this.name ?? this.id} has no affordance "${id}"`,
      fix: "name one of the affordances this archetype declares",
    });
  }

  /**
   * A contact site on an affordance, by coordinates over its extent as {@link ArchetypeSite} defines them.
   *
   * @param id The affordance id.
   * @param u The first coordinate, 0 to 1; the middle when absent.
   * @param v The second coordinate, 0 to 1; the middle when absent.
   * @returns The site's frame in the model's space.
   * @throws {ArchetypeRefusal} For an unknown id, or a coordinate outside 0 to 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the coordinates, the space and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to the site rule of the affordance's kind.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup, one call.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the two owners it calls.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work after the lookup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `affordance` and `ArchetypeSite.at`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  public site(id: Id, u?: number, v?: number): IAutoMovieTransform {
    return ArchetypeSite.at(this.#rest.archetype, this.affordance(id), u, v);
  }

  /**
   * A contact's frame in the world, with the archetype placed.
   *
   * @param id The affordance id.
   * @param placement The archetype's placement in the world, with unit scale: the frame a scene or a moving support gives its root.
   * @returns The affordance's frame in the world.
   * @throws {ArchetypeRefusal} For an unknown id.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the placement's premise and the result's space.
   * @evidence contracts/development/implementation.md#principled-implementation The model-local frame composed under the placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup, one composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A scaled placement is not supported, as `ArchetypeFrame.compose` states.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work after the lookup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `ArchetypeFrame.compose`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  public placed(id: Id, placement: IAutoMovieTransform): IAutoMovieTransform {
    return ArchetypeFrame.compose(placement, this.affordance(id).frame);
  }

  /**
   * This archetype with its articulations at stated travels.
   *
   * @param state The travel of each articulation by id, degrees for a `hinge`, `knob`, `crank` and `wheel` and metres for a `slider`, `button`, `pedal` and `trigger`; an articulation not listed is at rest, whatever this archetype's own state.
   * @returns A new archetype; this one is unchanged.
   * @throws {ArchetypeRefusal} When an id is no articulation of the archetype, or a travel lies outside its range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units, that the state is absolute and that the receiver is unchanged.
   * @evidence contracts/development/implementation.md#principled-implementation Poses the rest model again at the new state, so travel never accumulates error over successive calls.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One construction from the rest data.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A travel outside its range is refused by the pose, never clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in parts and affordances per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The rest data, materials and mass properties are shared with the new archetype, never copied.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each archetype holds one reference to the shared rest data and its own posed lists.
   */
  public articulate(
    state: Partial<Record<Id, number>>,
  ): Archetype<Id, Dimension> {
    return new Archetype<Id, Dimension>(this.#rest, state);
  }

  /**
   * This archetype with its rest parts replaced, keeping its identity, affordances, materials, dimensions and mass properties: how a rig that is not an articulation, such as an animal's skeleton, poses it.
   *
   * @param parts The parts in the new pose, in the model's space; the same ids as this archetype's.
   * @returns A new archetype at rest in that pose; this one is unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is kept, what is replaced and who calls it.
   * @evidence contracts/development/implementation.md#principled-implementation A copy of the rest record with the part list swapped; the affordances stay where the rest model has them, and mass properties stay the rest pose's, as `body` documents.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The caller owns the pose's correctness; ids are not re-checked here because `validateModel` admits the result like any model.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work beyond the constructor's pass.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Materials and mass properties are shared with the new archetype.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The new archetype holds its own rest record; nothing else is retained.
   */
  public reposed(parts: IAutoMovieModelPart[]): Archetype<Id, Dimension> {
    return new Archetype<Id, Dimension>({ ...this.#rest, parts });
  }

  /**
   * The archetype's colliders at the current articulation state, in the model's space.
   *
   * @returns One solid per part, as {@link ArchetypeShapes} maps them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the state and the space.
   * @evidence contracts/development/implementation.md#principled-implementation The parts' own solids, so the contact matches the picture.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the owner it calls.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in parts; computed on request because most archetypes are never grasped.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Not cached; a caller that needs them repeatedly keeps the result.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  public shapes(): IAutoMoviePhysicalProfile.IShape[] {
    return ArchetypeShapes.of(this.parts);
  }

  /**
   * The moment of inertia about a line through a point, at rest: what a swing about the hands or a tilt about an edge works against.
   *
   * @param through A point of the line in the model's space, metres.
   * @param direction The line's direction; any length.
   * @returns The moment, kg m squared.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and the use.
   * @evidence contracts/development/implementation.md#principled-implementation The parallel-axis theorem over the archetype's own mass properties.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the owner it calls.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `ArchetypeMass.about`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  public moment(
    through: IAutoMovieVector3,
    direction: IAutoMovieVector3,
  ): number {
    return ArchetypeMass.about(this.#rest.properties, through, direction);
  }
}

/**
 * Companion types of {@link Archetype}.
 */
export namespace Archetype {
  /**
   * What a producer built: the archetype at rest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation The rest model with its derived facts as one record: parts and affordances in the model's space in metres, mass properties in kilograms and kg m squared, coefficients from 0 to 1. Ids are narrowed to the producer's union by the type; their uniqueness is left to `validateModel`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by `Archetype`; written by `ArchetypeBuilder.build` and read by the constructor, with no member either does not use.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The dimension record is keyed by the producer's closed union, not by free strings, and no member is optional.
   */
  export interface IProps<Id extends string, Dimension extends string> {
    /** The producer's name, such as `chair`. */
    archetype: string;

    /** Model id. */
    id: string;

    /** Readable name. */
    name: string;

    /** The parts at rest, with unit scale. */
    parts: IAutoMovieModelPart[];

    /** The affordances at rest, each id one of `Id`. */
    affordances: (IAutoMovieAffordance & { id: Id })[];

    /** The materials the parts cite. */
    materials: IAutoMovieMaterial[];

    /** Mass, centre of mass and inertia. */
    properties: ArchetypeMass.IProperties;

    /** Coulomb friction coefficient, 0 to 1. */
    friction: number;

    /** Coefficient of restitution, 0 to 1. */
    restitution: number;

    /** The value of each free dimension the variant has. */
    dimensions: Readonly<Partial<Record<Dimension, number>>>;

    /** The spans laid between moving frames after every pose; empty for most archetypes. */
    spans: readonly ArchetypeSpan.ISpan[];
  }
}
