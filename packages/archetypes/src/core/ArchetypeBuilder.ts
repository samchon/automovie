import {
  Vector3,
  rotationBetween,
  srgbHexToLinearColor,
} from "@automovie/engine";
import type {
  AutoMoviePrimitiveShape,
  IAutoMovieAffordance,
  IAutoMovieBodyContact,
  IAutoMovieBodyDrag,
  IAutoMovieMaterial,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Archetype } from "./Archetype";
import type { ArchetypeDrawSession } from "./ArchetypeDrawSession";
import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeFriction } from "./ArchetypeFriction";
import { ArchetypeMass } from "./ArchetypeMass";
import { ArchetypeRefusal } from "./ArchetypeRefusal";
import { ArchetypeSpan } from "./ArchetypeSpan";

/**
 * What every producer assembles an archetype with: primitive parts stated by their dimensions and place, the affordances an act reads, and the total mass.
 *
 * A producer is a short list of calls, one per part, each from named dimensions: a box by its size and centre, a rod by its radius and two ends, a ball by its radius and centre. The repository keeps every model as coarse as identification allows, so there is nothing here to round an edge or shape a profile; a part exists because the thing would not be recognised, or could not be touched in the right place, without it. Parts carry unit scale, flat colours and no texture.
 *
 * `build` computes the centre of mass and inertia from the parts under the stated total mass ({@link ArchetypeMass}) and returns the {@link Archetype}.
 *
 * @template Id The archetype's affordance ids.
 * @template Dimension The archetype's free dimensions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a producer writes with it, the coarseness rule it serves and what `build` derives.
 * @evidence contracts/development/design.md#principled-representation Code CAD over dimensioned primitives, the representation the 3D modeling skill names for furniture, tools and machines; every placement is a named dimension of the producer, none a vertex.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three part calls (`box`, `rod`, `ball`), a line between moving frames (`span`), one affordance call and `build`, each used by producers of this package or, for `span`, by the bow and harness producers #3475 unblocks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No call knows a kind of object; a repeated part id is a producer's defect and throws at once.
 */
export class ArchetypeBuilder<Id extends string, Dimension extends string> {
  /** The parts so far, at rest. */
  readonly #parts: IAutoMovieModelPart[] = [];

  /** The affordances so far, at rest. */
  readonly #affordances: (IAutoMovieAffordance & { id: Id })[] = [];

  /** The materials cited so far, by id. */
  readonly #materials: Map<string, IAutoMovieMaterial> = new Map();

  /** Relative densities stated so far, by part id. */
  readonly #density: Record<string, number> = {};

  /** Mass shares stated so far, by part id. */
  readonly #shares: Record<string, number> = {};

  /** The spans so far. */
  readonly #spans: ArchetypeSpan.ISpan[] = [];

  /** Surface materials declared so far, by part id. */
  readonly #surfaces: Record<string, ArchetypeFriction.Material> = {};

  /** The producer's identity and its draws. */
  readonly #props: ArchetypeBuilder.IProps<Dimension>;

  /**
   * An empty archetype under construction.
   *
   * @param props The model's id and name, and the producer's draws, which name the producer.
   */
  public constructor(props: ArchetypeBuilder.IProps<Dimension>) {
    this.#props = props;
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's unit and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's box primitive at the stated centre and rotation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of the shared part recorder.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A repeated id throws; nothing is renamed.
   * @evidence contracts/development/implementation.md#efficient-algorithms A scan of the parts so far for the id, tens at most.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Records one independent part or contact per call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The builder keeps what it records until `build` hands it to the archetype.
   */
  public box(
    id: string,
    size: IAutoMovieVector3,
    at: IAutoMovieVector3,
    options?: ArchetypeBuilder.IOptions,
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
   * A straight round bar between two points: a leg, a rail, a shaft, a wheel seen as a short thick bar.
   *
   * @param id Part id, unique in the archetype.
   * @param radius The bar's radius, metres.
   * @param from The centre of one end, metres.
   * @param to The centre of the other end, metres.
   * @param options Colour and relative density; `round` gives the bar hemispherical ends beyond the two points; a rotation is ignored, because the two ends fix it.
   * @returns This builder.
   * @throws {Error} When the id repeats one already used, a producer's defect.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's unit and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation A cylinder or capsule whose axis, the primitive's `+Y`, is turned onto the line between the two ends by the shortest rotation and centred between them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Span, then one call of the shared part recorder.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Two coincident ends give a bar of no length, which the model validator refuses; nothing is guessed here.
   * @evidence contracts/development/implementation.md#efficient-algorithms A scan of the parts so far for the id, tens at most.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Records one independent part or contact per call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The builder keeps what it records until `build` hands it to the archetype.
   */
  public rod(
    id: string,
    radius: number,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    options?: ArchetypeBuilder.IOptions & { round?: boolean },
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
      rotationBetween({ x: 0, y: 1, z: 0 }, span),
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's unit and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's sphere primitive at the stated centre.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of the shared part recorder.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A repeated id throws; nothing is renamed.
   * @evidence contracts/development/implementation.md#efficient-algorithms A scan of the parts so far for the id, tens at most.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Records one independent part or contact per call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The builder keeps what it records until `build` hands it to the archetype.
   */
  public ball(
    id: string,
    radius: number,
    at: IAutoMovieVector3,
    options?: ArchetypeBuilder.IOptions,
  ): this {
    return this.#add(id, { type: "sphere", radius }, at, undefined, options);
  }

  /**
   * A span: a taut line between two frames of the model, laid again between them after every pose (`ArchetypeSpan`), such as a bowstring between its limbs' tips.
   *
   * @param id Part id of the line, unique in the archetype.
   * @param from One end: a part already recorded with a point in its own coordinates, or an affordance already recorded.
   * @param to The other end, likewise.
   * @param radius The line's radius, metres.
   * @param options Colour and relative density; a rotation is ignored, because the two ends fix it.
   * @param length The line's rest length, metres, when it has one: the span reports itself slack whenever its ends are closer.
   * @returns This builder.
   * @throws {Error} When the id repeats one already used, a producer's defect.
   * @throws {ArchetypeRefusal} When an end names a part or affordance not yet recorded, or the two ends meet at rest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's unit, what an end may name and when, and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation The ends are located at rest by `ArchetypeSpan.locate` and the line recorded as a `rod` between them, a cylinder, so its mass counts at rest as every part's does; the archetype lays it again after each pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Locate, record the rod, record the span.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An end must already exist, so the rest line is the one every pose lays; coincident ends are refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms A scan of the parts and affordances so far, tens at most.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `rod` and `ArchetypeSpan.locate`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The builder keeps what it records until `build` hands it to the archetype.
   */
  public span(
    id: string,
    from: ArchetypeSpan.End,
    to: ArchetypeSpan.End,
    radius: number,
    options?: ArchetypeBuilder.IOptions,
    length?: number,
  ): this {
    const start: IAutoMovieVector3 = ArchetypeSpan.locate(
      this.#props.draw.archetype,
      from,
      this.#parts,
      this.#affordances,
    );
    const end: IAutoMovieVector3 = ArchetypeSpan.locate(
      this.#props.draw.archetype,
      to,
      this.#parts,
      this.#affordances,
    );
    if (!(Vector3.length(Vector3.subtract(end, start)) > 0))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: this.#props.draw.archetype,
        axis: id,
        value: 0,
        feasible: null,
        reason: `the span "${id}" has both ends at one point at rest`,
        fix: "end the span at two distinct places",
      });
    this.rod(id, radius, start, end, { ...options, round: false });
    this.#spans.push({ id, from, to, radius, length: length ?? null });
    return this;
  }

  /**
   * An affordance.
   *
   * @param affordance The contact at rest, its frame in the model's space; `extent` is null for every kind but `stack-top`.
   * @returns This builder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's unit and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation The record is kept as written; its id is checked against the producer's closed id type by the compiler.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One push.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is validated here: `validateModel` admits the built archetype's affordances, as the contract test runs for every producer.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Records one independent part or contact per call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The builder keeps what it records until `build` hands it to the archetype.
   */
  public affordance(affordance: IAutoMovieAffordance & { id: Id }): this {
    this.#affordances.push(affordance);
    return this;
  }

  /**
   * The finished archetype.
   *
   * @param mass The total mass, kilograms, from the producer's cited band.
   * @param contact `rests`, the material of what the model stands on, such as its tyres or its hooves, and `ground`, the material it stands on, concrete when absent: the body's static and kinetic friction are that measured pair's (`ArchetypeFriction.pair`), a range's middle where the source gives a range. `restitution`, 0 to 1, 0.2 when absent. `drag` and `outcome`, a launched body's measured drag and its flight's ending (`IAutoMovieBody.drag` and `contact`), absent when no source measured them. Without `rests` the body carries no friction, static or kinetic, until the producer declares what it rests on.
   * @returns The archetype at rest.
   * @throws {Error} As `ArchetypeMass.of` does when no part has mass.
   * @throws {ArchetypeRefusal} When no source measured the resting pair.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's unit and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation Mass properties from the recorded parts under the stated total mass, the body's friction from the measured pair of what it rests on and its ground, then one `Archetype` over the recorded lists with the declared surfaces.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The mass is the producer's cited value, never derived from the volume; an unmeasured resting pair is refused; a producer that has not declared what it rests on leaves the body's friction absent rather than given an invented coefficient.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the parts, through `ArchetypeMass.of`.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Records one independent part or contact per call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The builder keeps what it records until `build` hands it to the archetype.
   */
  public build(
    mass: number,
    contact?: {
      rests?: ArchetypeFriction.Material;
      ground?: ArchetypeFriction.Material;
      restitution?: number;
      drag?: IAutoMovieBodyDrag;
      outcome?: IAutoMovieBodyContact;
    },
  ): Archetype<Id, Dimension> {
    const pair: ArchetypeFriction.ICoefficients | null =
      contact?.rests === undefined
        ? null
        : ArchetypeFriction.pair(
            contact.rests,
            contact.ground ?? ArchetypeFriction.GROUND,
            this.#props.draw.archetype,
          );
    return new Archetype<Id, Dimension>({
      archetype: this.#props.draw.archetype,
      id: this.#props.id ?? this.#props.draw.archetype,
      name: this.#props.name,
      parts: this.#parts,
      affordances: this.#affordances,
      materials: [...this.#materials.values()],
      properties: ArchetypeMass.of(
        this.#parts,
        mass,
        this.#density,
        this.#shares,
      ),
      friction: pair === null ? null : ArchetypeFriction.value(pair.static),
      kineticFriction:
        pair === null || pair.kinetic === null
          ? null
          : ArchetypeFriction.value(pair.kinetic),
      surfaces: this.#surfaces,
      restitution: contact?.restitution ?? 0.2,
      drag: contact?.drag ?? null,
      contact: contact?.outcome ?? null,
      dimensions: this.#props.draw.values,
      provenance: this.#props.draw.provenance,
      spans: this.#spans,
    });
  }

  /** Record one primitive part with its material and density. */
  #add(
    id: string,
    shape: AutoMoviePrimitiveShape,
    at: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion | undefined,
    options: ArchetypeBuilder.IOptions | undefined,
  ): this {
    if (this.#parts.some((p: IAutoMovieModelPart): boolean => p.id === id))
      throw new Error(
        `Archetype ${this.#props.draw.archetype} already has a part "${id}"`,
      );

    // One flat material per colour, shared by every part of that colour.
    const hex: string = (
      options?.color ?? ArchetypeBuilder.NEUTRAL
    ).toLowerCase();
    const material: string = `flat-${hex.slice(1)}`;
    if (!this.#materials.has(material))
      this.#materials.set(material, {
        id: material,
        name: null,
        baseColor: srgbHexToLinearColor(hex),
        metallic: 0,
        roughness: 0.8,
        emissive: null,
        opacity: 1,
        baseColorTexture: null,
      });
    if (options?.density !== undefined) this.#density[id] = options.density;
    if (options?.share !== undefined) this.#shares[id] = options.share;
    if (options?.surface !== undefined) this.#surfaces[id] = options.surface;
    this.#parts.push({
      id,
      name: null,
      geometry: { type: "primitive", shape },
      material,
      attachedBone: null,
      transform: {
        translation: { ...at },
        rotation: rotation ?? { x: 0, y: 0, z: 0, w: 1 },
        scale: { ...ArchetypeFrame.UNIT },
      },
    });
    return this;
  }
}

/**
 * Companion types of {@link ArchetypeBuilder}.
 */
export namespace ArchetypeBuilder {
  /** The colour of a part that states none: a mid grey. */
  export const NEUTRAL: string = "#9a9a9a";

  /**
   * A model's identity and its producer's draws.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's meaning.
   * @evidence contracts/development/design.md#principled-representation The model's identity and the producer's draw session, which carries the producer's name, the values keyed by its closed union and where each came from, so the archetype's record is the session's and cannot disagree with it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the builder; every producer writes one and `build` reads every member. `id` is optional because a scene holding one such thing needs none.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No registry key: the archetype's name is text for messages only.
   */
  export interface IProps<Dimension extends string> {
    /** The model's id; the producer's name when absent. */
    id?: string;

    /** The model's readable name. */
    name: string;

    /** The producer's draws, whose values the archetype records as its dimensions and whose provenance it keeps. */
    draw: ArchetypeDrawSession<Dimension>;
  }

  /**
   * How one part differs from a grey solid of unit density at its unrotated place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation How one part departs from a grey solid of unit density: an sRGB swatch, a positive relative density or an absolute mass share, and a unit quaternion.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the builder; each member is read when a part is recorded and set by at least one producer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Density and share are two optional members, not a union: a looseness that remains, bounded by the rule on `share` that a producer stating one states it for every part.
   */
  export interface IOptions {
    /** The part's flat colour as an sRGB swatch `#rrggbb`; a mid grey when absent. */
    color?: string;

    /** The part's density relative to the other parts, positive; 1 when absent. It only shifts the centre of mass and inertia, since the total mass is stated. */
    density?: number;

    /** The part's share of the total mass, replacing its volume times density, for a body whose segment masses are measured; a producer that states one states it for every part. */
    share?: number;

    /** The part's rotation in the model's space, a unit quaternion; unrotated when absent. */
    rotation?: IAutoMovieQuaternion;

    /** What the part's surface is made of, for a part something touches: a tyre, a grip, a seat, a sole; undeclared when absent. `Archetype.friction` reads it against another material. */
    surface?: ArchetypeFriction.Material;
  }
}
