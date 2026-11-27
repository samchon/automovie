import { Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieBodyContact,
  IAutoMovieBodyDrag,
  IAutoMovieGeometry,
  IAutoMovieMesh,
  IAutoMovieModelPart,
  IAutoMoviePrimitiveShape,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeBuilderParts } from "./internal/ArchetypeBuilderParts";
import type { ArchetypeBuilderTypes } from "./internal/ArchetypeBuilderTypes";
import type { AutoMovieArchetype } from "./AutoMovieArchetype";
import { AutoMovieArchetypeConvexCell } from "./AutoMovieArchetypeConvexCell";
import type { AutoMovieArchetypeFracture } from "./AutoMovieArchetypeFracture";
import { AutoMovieArchetypeFriction } from "./AutoMovieArchetypeFriction";
import { AutoMovieArchetypeMass } from "./AutoMovieArchetypeMass";
import { AutoMovieArchetypeMaterial } from "./AutoMovieArchetypeMaterial";
import { AutoMovieArchetypeSpan } from "./AutoMovieArchetypeSpan";
import { archetypeSpanAnchor } from "./internal/archetypeSpanAnchor";
import { buildNativeArchetype } from "./internal/buildNativeArchetype";

/**
 * What every producer assembles an archetype with: dimensioned primitives,
 * convex cells or visual meshes, the affordances an act reads, and the total
 * mass.
 *
 * A producer states named dimensions and formulas: a box by its size and
 * centre, a rod by its radius and ends, a ball by its radius and centre, or a
 * convex wall by its generating corners. Hollow forms assemble separate wall
 * cells so rendering, mass and collision preserve their empty space. The
 * repository keeps every model as coarse as identification allows. Parts carry
 * unit scale, flat colours and no texture.
 *
 * `build` computes the centre of mass and inertia from the parts under the
 * stated total mass ({@link AutoMovieArchetypeMass}) and returns the
 * {@link AutoMovieArchetype}.
 *
 * @template Id The archetype's affordance ids.
 * @template Dimension The archetype's free dimensions.
 */
export class AutoMovieArchetypeBuilder<
  Id extends string,
  Dimension extends string,
> {
  /** Parts and their common material/mass/cell ownership. */
  readonly #inventory: ArchetypeBuilderParts;

  /** The affordances so far, at rest. */
  readonly #affordances: (IAutoMovieAffordance & { id: Id })[] = [];

  /** The spans so far. */
  readonly #spans: AutoMovieArchetypeSpan.ISpan[] = [];

  /** The fragment sets declared so far. */
  readonly #fractures: AutoMovieArchetypeFracture.ISet[] = [];

  /** The producer's identity and its draws. */
  readonly #props: AutoMovieArchetypeBuilder.IProps<Dimension>;

  /**
   * An empty archetype under construction.
   *
   * @param props The model's id and name, and the producer's draws, which name
   *   the producer.
   */
  public constructor(props: AutoMovieArchetypeBuilder.IProps<Dimension>) {
    this.#props = props;
    this.#inventory = new ArchetypeBuilderParts(props.draw.archetype);
  }

  /**
   * A box.
   *
   * @param id Part id, unique in the archetype.
   * @param size Full sizes along the part's X, Y and Z, metres.
   * @param at The box's centre in the model's space, metres.
   * @param options Colour, relative density and rotation.
   * @returns This builder.
   * @throws {Error} When the id repeats one already used, a producer's defect.
   */
  public box(
    id: string,
    size: IAutoMovieVector3,
    at: IAutoMovieVector3,
    options?: AutoMovieArchetypeBuilder.IOptions,
  ): this {
    return this.#add(
      id,
      { type: "box", width: size.x, height: size.y, depth: size.z },
      at,
      options?.rotation,
      options,
    );
  }

  /**
   * A straight round bar between two points: a leg, a rail, a shaft, a wheel
   * seen as a short thick bar.
   *
   * @param id Part id, unique in the archetype.
   * @param radius The bar's radius, metres.
   * @param from The centre of one end, metres.
   * @param to The centre of the other end, metres.
   * @param options Colour and relative density; `round` gives the bar
   *   hemispherical ends beyond the two points; a rotation is ignored, because
   *   the two ends fix it.
   * @returns This builder.
   * @throws {Error} When the id repeats one already used, a producer's defect.
   */
  public rod(
    id: string,
    radius: number,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    options?: AutoMovieArchetypeBuilder.IOptions & { round?: boolean },
  ): this {
    const span: IAutoMovieVector3 = Vector3.subtract(to, from);
    return this.#add(
      id,
      {
        type: options?.round === true ? "capsule" : "cylinder",
        radius,
        height: Vector3.length(span),
      },
      Vector3.scale(Vector3.add(from, to), 0.5),
      AutoMovieEngineMath.rotationBetween({ x: 0, y: 1, z: 0 }, span),
      options,
    );
  }

  /**
   * A ball.
   *
   * @param id Part id, unique in the archetype.
   * @param radius The ball's radius, metres.
   * @param at Its centre, metres.
   * @param options Colour and relative density.
   * @returns This builder.
   * @throws {Error} When the id repeats one already used, a producer's defect.
   */
  public ball(
    id: string,
    radius: number,
    at: IAutoMovieVector3,
    options?: AutoMovieArchetypeBuilder.IOptions,
  ): this {
    return this.#add(id, { type: "sphere", radius }, at, undefined, options);
  }

  /**
   * Add one convex wall cell, sharing its visible and physical boundary.
   *
   * @param id Unique part id.
   * @param points Cell-local finite corners in metres, or an immutable admitted
   *   cell prepared by AutoMovieArchetypeConvexCell.of for repeated rigid
   *   instances.
   * @param at Local origin in model metres; zero when absent.
   * @param options Existing colour, rigid rotation, mass weight and surface
   *   options.
   * @returns This builder.
   * @throws {Error} For a repeated id or inadmissible convex cell.
   */
  public convex(
    id: string,
    points: readonly IAutoMovieVector3[] | AutoMovieArchetypeConvexCell.ICell,
    at: IAutoMovieVector3 = { x: 0, y: 0, z: 0 },
    options?: AutoMovieArchetypeBuilder.IOptions,
  ): this {
    const cell: AutoMovieArchetypeConvexCell.ICell =
      "geometry" in points ? points : AutoMovieArchetypeConvexCell.of(points);
    this.#inventory.add(id, cell.geometry, at, options?.rotation, options);
    this.#inventory.cells.set(id, cell);
    return this;
  }

  /**
   * Place a visual mesh in model metres with an optional flat colour and
   * rotation. The builder takes the mesh buffers as supplied.
   */
  public visualMesh(
    id: string,
    mesh: IAutoMovieMesh,
    at: IAutoMovieVector3,
    options?: Pick<AutoMovieArchetypeBuilder.IOptions, "color" | "rotation">,
  ): this {
    const geometry: IAutoMovieGeometry = { type: "mesh", mesh };
    this.#inventory.add(id, geometry, at, options?.rotation, options);
    return this;
  }

  /**
   * A span: a taut line between two frames of the model, laid again between
   * them after every pose (`AutoMovieArchetypeSpan`), such as a bowstring
   * between its limbs' tips.
   *
   * @param id Part id of the line, unique in the archetype.
   * @param from One end: a part already recorded with a point in its own
   *   coordinates, or an affordance already recorded.
   * @param to The other end, likewise.
   * @param radius The line's radius, metres.
   * @param options Colour and relative density; a rotation is ignored, because
   *   the two ends fix it.
   * @param length The line's rest length, metres, when it has one: the span
   *   reports itself slack whenever its ends are closer.
   * @returns This builder.
   * @throws {Error} When the id repeats one already used, a producer's defect.
   * @throws {AutoMovieArchetypeRefusal} When an end names a part or affordance
   *   not yet recorded, or the two ends meet at rest.
   */
  public span(
    id: string,
    from: AutoMovieArchetypeSpan.IEnd,
    to: AutoMovieArchetypeSpan.IEnd,
    radius: number,
    options?: AutoMovieArchetypeBuilder.IOptions,
    length?: number,
  ): this {
    const span: AutoMovieArchetypeSpan.ISpan = {
      id,
      from,
      to,
      radius,
      length: length ?? null,
    };
    const endpoints: AutoMovieArchetypeSpan.IState =
      AutoMovieArchetypeSpan.state(
        this.#props.draw.archetype,
        span,
        this.#inventory.parts,
        this.#affordances,
      );
    this.rod(id, radius, endpoints.from, endpoints.to, {
      ...options,
      round: false,
    });
    this.#spans.push(span);
    return this;
  }

  /** Bind a construction point to a real part already laid by this builder. */
  public anchor(
    id: string,
    point: IAutoMovieVector3,
  ): AutoMovieArchetypeSpan.IPartEnd {
    return archetypeSpanAnchor(
      this.#props.draw.archetype,
      this.#inventory.parts,
      id,
      point,
    );
  }

  /**
   * An affordance.
   *
   * @param affordance The contact at rest, its frame in the model's space;
   *   `extent` is null for every kind but `stack-top`.
   * @returns This builder.
   */
  public affordance(affordance: IAutoMovieAffordance & { id: Id }): this {
    this.#affordances.push(affordance);
    return this;
  }

  /**
   * Declare the sets of parts a hit breaks off, each a fragment; the threshold
   * is the body's `contact.fracture`, given to `build` as `outcome`.
   *
   * @param sets The fragment sets, each an id, the parts it carries away and
   *   the contacts on them that move none; declared after those contacts.
   * @returns This builder.
   * @throws {Error} When a set's id is declared twice, a set carries no part, a
   *   set names a part not yet recorded or one a set already names (its own
   *   included), or a contact not yet declared or one a set already carries, a
   *   producer's defect.
   */
  public fracture(sets: readonly AutoMovieArchetypeFracture.ISet[]): this {
    const named: Set<string> = new Set(
      this.#fractures.flatMap(
        (s: AutoMovieArchetypeFracture.ISet): readonly string[] => s.parts,
      ),
    );
    const ids: Set<string> = new Set(
      this.#fractures.map((s: AutoMovieArchetypeFracture.ISet): string => s.id),
    );
    const carried: Set<string> = new Set(
      this.#fractures.flatMap(
        (s: AutoMovieArchetypeFracture.ISet): readonly string[] =>
          s.affordances ?? [],
      ),
    );
    for (const set of sets) {
      if (ids.has(set.id))
        throw new Error(`fracture set ${set.id} is declared twice`);
      if (set.parts.length === 0)
        throw new Error(`fracture set ${set.id} carries no part`);
      ids.add(set.id);
      for (const part of set.parts) {
        if (
          !this.#inventory.parts.some(
            (p: IAutoMovieModelPart): boolean => p.id === part,
          )
        )
          throw new Error(
            `fracture set ${set.id} names the unrecorded part ${part}`,
          );
        if (named.has(part))
          throw new Error(
            `fracture set ${set.id} names ${part}, which a set already carries`,
          );
        named.add(part);
      }
      for (const contact of set.affordances ?? []) {
        if (
          !this.#affordances.some(
            (a: IAutoMovieAffordance): boolean => a.id === contact,
          )
        )
          throw new Error(
            `fracture set ${set.id} carries the undeclared affordance ${contact}`,
          );
        if (carried.has(contact))
          throw new Error(
            `fracture set ${set.id} carries ${contact}, which a set already carries`,
          );
        carried.add(contact);
      }
    }
    this.#fractures.push(...sets);
    return this;
  }

  /**
   * The finished archetype.
   *
   * @param mass The total mass, kilograms, from the producer's cited band.
   * @param contact Resting and ground materials select their cited friction
   *   pair. An explicit restitution is admitted from 0 to 1; otherwise
   *   restitution remains unknown; a material reference never supplies a
   *   universal scalar. Drag and outcome are the launched body's optional
   *   flight data. The constructor's physical material declaration is required
   *   independently of optical colours and resting surfaces.
   * @returns The archetype at rest.
   * @throws {Error} As `AutoMovieArchetypeMass.of` does when no part has mass.
   * @throws {AutoMovieArchetypeRefusal} When the physical material is missing
   *   or unknown, an explicit restitution is invalid, or no source measured a
   *   declared resting pair.
   */
  public build(
    mass: number,
    contact?: {
      rests?: AutoMovieArchetypeFriction.Material;
      ground?: AutoMovieArchetypeFriction.Material;
      restitution?: number;
      drag?: IAutoMovieBodyDrag;
      outcome?: IAutoMovieBodyContact;
    },
  ): AutoMovieArchetype<Id, Dimension> {
    const material: AutoMovieArchetypeMaterial.Kind =
      AutoMovieArchetypeMaterial.admit(
        this.#props.material,
        this.#props.draw.archetype,
      );
    const restitution: number | null = AutoMovieArchetypeMaterial.restitution(
      material,
      contact?.restitution,
      this.#props.draw.archetype,
    );
    const pair: AutoMovieArchetypeFriction.ICoefficients | null =
      contact?.rests === undefined
        ? null
        : AutoMovieArchetypeFriction.pair(
            contact.rests,
            contact.ground ?? AutoMovieArchetypeFriction.GROUND,
            this.#props.draw.archetype,
          );
    return buildNativeArchetype<Id, Dimension>({
      archetype: this.#props.draw.archetype,
      id: this.#props.id ?? this.#props.draw.archetype,
      name: this.#props.name,
      parts: this.#inventory.parts,
      cells: this.#inventory.cells,
      affordances: this.#affordances,
      materials: [...this.#inventory.materials.values()],
      properties: AutoMovieArchetypeMass.of(
        this.#inventory.parts,
        mass,
        this.#inventory.density,
        this.#inventory.shares,
        this.#inventory.cells,
      ),
      friction:
        pair === null ? null : AutoMovieArchetypeFriction.value(pair.static),
      kineticFriction:
        pair === null || pair.kinetic === null
          ? null
          : AutoMovieArchetypeFriction.value(pair.kinetic),
      surfaces: this.#inventory.surfaces,
      material,
      restitution,
      drag: contact?.drag ?? null,
      contact: contact?.outcome ?? null,
      fractures: this.#fractures,
      masses: AutoMovieArchetypeMass.parts(
        this.#inventory.parts,
        mass,
        this.#inventory.density,
        this.#inventory.shares,
        this.#inventory.cells,
      ),
      dimensions: this.#props.draw.values,
      provenance: this.#props.draw.provenance,
      spans: this.#spans,
    });
  }

  /** Record one primitive through the shared part/material owner. */
  #add(
    id: string,
    shape: IAutoMoviePrimitiveShape,
    at: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion | undefined,
    options: AutoMovieArchetypeBuilder.IOptions | undefined,
  ): this {
    const geometry: IAutoMovieGeometry = { type: "primitive", shape };
    this.#inventory.add(id, geometry, at, rotation, options);
    return this;
  }
}

/** Companion types of {@link AutoMovieArchetypeBuilder}. */
export namespace AutoMovieArchetypeBuilder {
  /** The colour of a part that states none: a mid grey. */
  export const NEUTRAL: string = ArchetypeBuilderParts.NEUTRAL;

  /** The producer identity and draw record, with an explicit physical material. */
  export type IProps<Dimension extends string> =
    ArchetypeBuilderTypes.IProps<Dimension>;

  /** The primitive-part options, preserving the existing public builder name. */
  export type IOptions = ArchetypeBuilderTypes.IOptions;
}
