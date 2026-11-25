import type {
  IAutoMovieAffordance,
  IAutoMovieBody,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeBody } from "./ArchetypeBody";
import { ArchetypeShapes } from "./ArchetypeShapes";
import { AutoMovieArchetypeArticulation } from "./AutoMovieArchetypeArticulation";
import type { AutoMovieArchetypeConvexCell } from "./AutoMovieArchetypeConvexCell";
import type { AutoMovieArchetypeDrawSession } from "./AutoMovieArchetypeDrawSession";
import { AutoMovieArchetypeFracture } from "./AutoMovieArchetypeFracture";
import { AutoMovieArchetypeFrame } from "./AutoMovieArchetypeFrame";
import { AutoMovieArchetypeFriction } from "./AutoMovieArchetypeFriction";
import { AutoMovieArchetypeMass } from "./AutoMovieArchetypeMass";
import type { AutoMovieArchetypeMaterial } from "./AutoMovieArchetypeMaterial";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";
import { AutoMovieArchetypeSite } from "./AutoMovieArchetypeSite";
import { AutoMovieArchetypeSpan } from "./AutoMovieArchetypeSpan";
import type { IAutoMovieArchetypeProps } from "./IAutoMovieArchetypeProps";
import { archetypeAffordance } from "./archetypeAffordance";
import { poseArchetype } from "./poseArchetype";
import { reposeArchetype } from "./reposeArchetype";

/**
 * What a producer returns: a model of one thing people hold, use, sit on, ride
 * or fight with, with typed access to what a person's act reads from it.
 *
 * An archetype is an `IAutoMovieModel`: its own enumerable members are exactly
 * a rigid generated model's (`id`, `name`, `origin`, `parts`, `skeleton`,
 * `body`, `affordances`, `materials`, `asset`), so it goes wherever a model
 * goes, serialises as one, and two archetypes from the same parameters and seed
 * serialise to the same text. Everything else is reached through accessors that
 * a copy or a serialisation leaves behind:
 *
 * - `affordance(id)` and `site(id, u, v)` give a contact and a place on it, with
 *   `id` checked against the producer's closed id type at compile time and
 *   refused at run time with the ids that exist;
 * - `articulate(state)` gives the archetype with its articulations at the stated
 *   travels, parts and carried affordances moved with them, followers set by
 *   their leaders and spans laid again between their ends; `travel(id)` gives
 *   any articulation's travel, a follower's included, and `span(id)` a span's
 *   ends and slack. The travels live on the instance only: a serialised posed
 *   archetype is a picture of that pose and carries no state, so articulate
 *   from the archetype a producer returned, never from a copy read back;
 * - `dimensions` gives each free dimension and `provenance` its source. Physical
 *   models carry mass, centre and inertia in `properties`. For visual models
 *   both `properties` and `body` are null.
 * - `shapes()` gives colliders for a hand to close on, and `placed(id,
 *   placement)` a contact's frame in the world;
 * - `surface(part)` gives what a part's surface is made of and `friction(part,
 *   against)` its measured friction against another material, while `body`
 *   carries the static and kinetic friction of what the model rests on against
 *   its ground ({@link AutoMovieArchetypeFriction}). Lengths are metres, masses
 *   kilograms and angles degrees. The model's space has `+Y` up and `+Z` to the
 *   front of a thing that has one; an archetype that stands on the floor has
 *   its origin on the floor.
 *
 * @template Id The archetype's affordance ids, a closed union the producer
 *   declares.
 * @template Dimension The archetype's free dimensions, a closed union the
 *   producer declares.
 * @template Physical Mass properties or null for a visual-only model.
 */
export class AutoMovieArchetype<
  Id extends string = string,
  Dimension extends string = string,
  Physical extends AutoMovieArchetypeMass.IProperties | null =
    AutoMovieArchetypeMass.IProperties,
> implements IAutoMovieModel {
  /** Model id, unique in a scene; the producer's `id` parameter or its own name. */
  public readonly id: string;

  /** Readable name of the thing, such as `dining chair`. */
  public readonly name: string | null;

  /** Always generated: the geometry is fully described by `parts`. */
  public readonly origin: "generated" = "generated" as const;

  /** The primitive or convex-cell parts at the current articulation state. */
  public readonly parts: IAutoMovieModelPart[];

  /**
   * Always null: an archetype is a rigid or articulated object, never a
   * humanoid rig.
   */
  public readonly skeleton: null = null;

  /**
   * Rest mass, centre and contact coefficients, or null for a visual-only
   * model.
   */
  public readonly body: Physical extends null ? null : IAutoMovieBody;

  /** The contacts at the current articulation state. */
  public readonly affordances: IAutoMovieAffordance[];

  /** The few flat materials the parts cite. */
  public readonly materials: IAutoMovieMaterial[];

  /** Always null: no binary payload backs an archetype. */
  public readonly asset: null = null;

  /** What the producer built, at rest. */
  readonly #rest: AutoMovieArchetype.IProps<Id, Dimension, Physical>;

  /** The travel of each articulation that is away from rest. */
  readonly #state: Partial<Record<Id, number>>;

  /** Every articulation's travel at this state, set or followed. */
  readonly #travels: ReadonlyMap<string, number>;

  /**
   * An archetype from what a producer built, at an articulation state.
   *
   * @param props The archetype at rest; the records are kept, not copied, so a
   *   producer hands over ownership.
   * @param state The travel of each articulation; at rest when absent.
   * @throws {AutoMovieArchetypeRefusal} Through the articulation and
   *   {@link AutoMovieArchetypeSpan.pose} owners for unsupported travels,
   *   invalid line geometry or incompatible held contacts.
   */
  public constructor(
    props: AutoMovieArchetype.IProps<Id, Dimension, Physical>,
    state: Partial<Record<Id, number>> = {},
  ) {
    const posed: AutoMovieArchetypeArticulation.IResult = poseArchetype(
      props,
      AutoMovieArchetypeArticulation.travels(state),
    );
    this.id = props.id;
    this.name = props.name;
    this.parts = posed.parts;
    this.#travels = posed.travels;
    this.body = ArchetypeBody<Physical>(props);
    this.affordances = posed.affordances;
    this.materials = props.materials;
    this.#rest = props;
    this.#state = { ...state };
  }

  /** The producer's name, such as `chair`, which refusals carry. */
  public get archetype(): string {
    return this.#rest.archetype;
  }

  /**
   * The value of each free dimension this variant has, in the unit of its band:
   * drawn from the seed, or fixed by a parameter. A dimension the variant
   * lacks, as a stool lacks a back height, is absent.
   */
  public get dimensions(): Readonly<Partial<Record<Dimension, number>>> {
    return this.#rest.dimensions;
  }

  /**
   * Where the dimensions came from: the band each drawn dimension was drawn in,
   * and the model picked on each axis, by axis. A figure a model gives has no
   * band; its model's name is the record.
   */
  public get provenance(): AutoMovieArchetypeDrawSession.IProvenance<Dimension> {
    return this.#rest.provenance;
  }

  /** Rest mass, centre of mass and inertia, or null for a visual-only model. */
  public get properties(): Physical {
    return this.#rest.properties;
  }

  /** Producer-owned convex wall cells, shared with placed assemblies. */
  public get convexCells(): AutoMovieArchetypeConvexCell.Table {
    return this.#rest.cells ?? new Map();
  }

  /**
   * The physical reference material declared by the producer; null for a mixed
   * assembly, independently of optical colours or per-part friction surfaces.
   */
  public get physicalMaterial(): AutoMovieArchetypeMaterial.Kind | null {
    return this.#rest.material;
  }

  /**
   * The travel of each articulation that was set, by id; a follower's is read
   * through `travel`.
   */
  public get state(): Partial<Record<Id, number>> {
    return this.#state;
  }

  /** Whether the resolved model declares any articulation, including at rest. */
  public get hasArticulations(): boolean {
    return this.#travels.size > 0;
  }

  /** The spans this archetype lays between moving frames, at rest. */
  public get spans(): readonly AutoMovieArchetypeSpan.ISpan[] {
    return this.#rest.spans;
  }

  /**
   * An articulation's travel at this state: the travel set for a leader, 0 for
   * one not set, and the travel its leader gives a follower.
   *
   * @param id The articulation's id.
   * @returns The travel, degrees for the turning kinds and metres for the
   *   others.
   * @throws {AutoMovieArchetypeRefusal} When the id is no articulation of the
   *   archetype, listing those it has.
   */
  public travel(id: Id): number {
    const travel: number | undefined = this.#travels.get(id);
    if (travel !== undefined) return travel;
    throw new AutoMovieArchetypeRefusal({
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
   * One of the archetype's spans at the current articulation state: where its
   * ends are and whether it is slack.
   *
   * @param id The span's part id.
   * @returns Its state, in the model's space.
   * @throws {AutoMovieArchetypeRefusal} When the archetype has no such span,
   *   listing those it has.
   */
  public span(id: string): AutoMovieArchetypeSpan.IState {
    const found: AutoMovieArchetypeSpan.ISpan | undefined =
      this.#rest.spans.find(
        (s: AutoMovieArchetypeSpan.ISpan): boolean => s.id === id,
      );
    if (found === undefined)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: this.#rest.archetype,
        axis: "span",
        value: id,
        feasible: {
          kind: "alternatives",
          values: this.#rest.spans.map(
            (s: AutoMovieArchetypeSpan.ISpan): string => s.id,
          ),
        },
        reason: `${this.name ?? this.id} has no span "${id}"`,
        fix: "name one of the spans this archetype declares",
      });
    return AutoMovieArchetypeSpan.state(
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
   * @throws {AutoMovieArchetypeRefusal} When the archetype declares no such
   *   affordance, listing the ids it declares; a producer's variant may lack an
   *   id its type allows, as a glass lacks a mug's handle.
   */
  public affordance(id: Id): IAutoMovieAffordance {
    return archetypeAffordance(this, id, this.#rest.archetype);
  }

  /**
   * A contact site on an affordance, by coordinates over its extent as
   * {@link AutoMovieArchetypeSite} defines them.
   *
   * @param id The affordance id.
   * @param u The first coordinate, 0 to 1; the middle when absent.
   * @param v The second coordinate, 0 to 1; the middle when absent.
   * @returns The site's frame in the model's space.
   * @throws {AutoMovieArchetypeRefusal} For an unknown id, or a coordinate
   *   outside 0 to 1.
   */
  public site(id: Id, u?: number, v?: number): IAutoMovieTransform {
    return AutoMovieArchetypeSite.at(
      this.#rest.archetype,
      this.affordance(id),
      u,
      v,
    );
  }

  /**
   * A contact's frame in the world, with the archetype placed.
   *
   * @param id The affordance id.
   * @param placement The archetype's placement in the world, with unit scale:
   *   the frame a scene or a moving support gives its root.
   * @returns The affordance's frame in the world.
   * @throws {AutoMovieArchetypeRefusal} For an unknown id.
   */
  public placed(id: Id, placement: IAutoMovieTransform): IAutoMovieTransform {
    return AutoMovieArchetypeFrame.compose(
      placement,
      this.affordance(id).frame,
    );
  }

  /**
   * This archetype with its articulations at stated travels.
   *
   * @param state One input per coupled degree of freedom, by its leader or an
   *   explicitly reversible follower, degrees for turning kinds and metres for
   *   translating kinds. An independent articulation not listed is at rest,
   *   whatever this archetype's own state.
   * @returns A new archetype; this one is unchanged.
   * @throws {AutoMovieArchetypeRefusal} For an unknown articulation, a travel
   *   outside its range or its reversible coupling's image, an unmarked
   *   follower, or duplicate inputs for one coupled degree of freedom.
   */
  public articulate(
    state: Partial<Record<Id, number>>,
  ): AutoMovieArchetype<Id, Dimension, Physical> {
    return new AutoMovieArchetype<Id, Dimension, Physical>(this.#rest, state);
  }

  /**
   * Prepare selected contact frames for ordinary rigid archetypes; subclasses
   * and flexible spans need the complete pose.
   */
  public static projection(
    model: AutoMovieArchetype<
      string,
      string,
      AutoMovieArchetypeMass.IProperties | null
    >,
  ): ReturnType<typeof AutoMovieArchetypeArticulation.prepare> | undefined {
    if (!(#rest in model)) return undefined;
    if (Object.getPrototypeOf(model) !== AutoMovieArchetype.prototype)
      return undefined;
    if (Object.hasOwn(model, "articulate")) return undefined;
    if (model.#rest.spans.length) return undefined;
    return AutoMovieArchetypeArticulation.prepare(
      model.#rest.archetype,
      model.#rest,
    );
  }
  /**
   * This archetype with its rest parts replaced, keeping identity, materials,
   * dimensions and rest mass properties. A rig may supply current contact
   * frames; omitted frames retain rest contact origins. Declared spans are
   * rebuilt and explicitly held line axes follow their current geometry.
   *
   * @param parts The parts in the new pose, in the model's space; the same ids
   *   as this archetype's.
   * @param frames Complete carrier contact frames, or omitted to retain rest
   *   origins; explicit held-span tangents are derived afterward.
   * @returns A new archetype at rest in that pose; this one is unchanged.
   */
  public reposed(
    parts: IAutoMovieModelPart[],
    frames?: ReadonlyMap<string, IAutoMovieTransform>,
  ): AutoMovieArchetype<Id, Dimension, Physical> {
    return new AutoMovieArchetype<Id, Dimension, Physical>(
      reposeArchetype(this.#rest, parts, frames),
    );
  }

  /**
   * What a part's surface is made of.
   *
   * @param part The part's id.
   * @returns The material its producer declared, or null when it declared none.
   */
  public surface(part: string): AutoMovieArchetypeFriction.Material | null {
    return this.#rest.surfaces[part] ?? null;
  }

  /**
   * The friction between a part and a material, as a measured pair gives it.
   *
   * @param part The part's id.
   * @param against The other surface's material: a hand's, a floor's, another
   *   part's.
   * @returns The pair's static and kinetic coefficients and their source.
   * @throws {AutoMovieArchetypeRefusal} When the part declares no surface,
   *   listing the parts that do, or no source measured the pair.
   */
  public friction(
    part: string,
    against: AutoMovieArchetypeFriction.Material,
  ): AutoMovieArchetypeFriction.ICoefficients {
    const material: AutoMovieArchetypeFriction.Material | null =
      this.surface(part);
    if (material === null)
      throw AutoMovieArchetypeFriction.undeclared(
        this.#rest.archetype,
        this.name ?? this.id,
        part,
        this.#rest.surfaces,
      );
    return AutoMovieArchetypeFriction.pair(
      material,
      against,
      this.#rest.archetype,
    );
  }

  /**
   * The archetype's colliders at the current articulation state, in the model's
   * space.
   *
   * @returns The admitted part solids, or an empty list for a visual-only
   *   model.
   */
  public shapes(): IAutoMoviePhysicalShape[] {
    return this.#rest.properties === null
      ? []
      : ArchetypeShapes.of(this.parts, this.#rest.cells);
  }

  /**
   * The moment of inertia about a line through a point, at rest: what a swing
   * about the hands or a tilt about an edge works against.
   *
   * @param through A point of the line in the model's space, metres.
   * @param direction The line's direction; any length.
   * @returns The moment, kg m squared.
   * @throws {AutoMovieArchetypeRefusal} When the model is visual only.
   */
  public moment(
    through: IAutoMovieVector3,
    direction: IAutoMovieVector3,
  ): number {
    const properties: AutoMovieArchetypeMass.IProperties | null =
      this.#rest.properties;
    if (properties === null)
      throw AutoMovieArchetypeMass.visualOnly(this.archetype);
    return AutoMovieArchetypeMass.about(properties, through, direction);
  }

  /**
   * What a hit leaves of this archetype at rest: its remainder and its
   * fragments, each an archetype, or null when it does not break.
   *
   * @param hit The hit's energy and momentum.
   * @returns The remainder, null when every part breaks off, and each fragment
   *   with its velocity; null when no fracture sets or no calibrated
   *   `contact.fracture` threshold are declared, or the hit is below that
   *   threshold.
   */
  public broken(
    hit: AutoMovieArchetypeFracture.IHit,
  ): AutoMovieArchetypeFracture.IPieces<Id, Dimension> | null {
    if (this.#rest.properties === null) return null;
    const split: AutoMovieArchetypeFracture.IBroken<Id, Dimension> | null =
      AutoMovieArchetypeFracture.split(this.#rest, hit);
    if (split === null) return null;
    return {
      remainder:
        split.remainder === null
          ? null
          : new AutoMovieArchetype<Id, Dimension>(split.remainder),
      fragments: split.fragments.map(
        (
          f: AutoMovieArchetypeFracture.IFragment<Dimension, Id>,
        ): AutoMovieArchetypeFracture.IPiece<Dimension, Id> => ({
          id: f.id,
          archetype: new AutoMovieArchetype<Id, Dimension>(f.props),
          velocity: f.velocity,
        }),
      ),
    };
  }
}

/** Companion types of {@link AutoMovieArchetype}. */
export namespace AutoMovieArchetype {
  /**
   * What a producer built: the archetype at rest, as
   * {@link IAutoMovieArchetypeProps} records it.
   */
  export type IProps<
    Id extends string,
    Dimension extends string,
    Physical extends AutoMovieArchetypeMass.IProperties | null =
      AutoMovieArchetypeMass.IProperties,
  > = IAutoMovieArchetypeProps<Id, Dimension, Physical>;
}
