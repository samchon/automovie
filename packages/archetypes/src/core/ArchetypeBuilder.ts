import {
  Vector3,
  rotationBetween,
} from "@automovie/engine";
import type {
  AutoMoviePrimitiveShape,
  IAutoMovieAffordance,
  IAutoMovieBodyContact,
  IAutoMovieBodyDrag,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Archetype } from "./Archetype";
import { ArchetypeBuilderParts } from "./ArchetypeBuilderParts";
import type { ArchetypeBuilderTypes } from "./ArchetypeBuilderTypes";
import { ArchetypeConvexCell } from "./ArchetypeConvexCell";
import type { ArchetypeFracture } from "./ArchetypeFracture";
import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeFriction } from "./ArchetypeFriction";
import { ArchetypeMass } from "./ArchetypeMass";
import { ArchetypeMaterial } from "./ArchetypeMaterial";
import { ArchetypeSpan } from "./ArchetypeSpan";
import { archetypeSpanAnchor } from "./archetypeSpanAnchor";

/**
 * What every producer assembles an archetype with: dimensioned primitive or actual convex-cell parts, the affordances an act reads, and the total mass.
 *
 * A producer states named dimensions and formulas: a box by its size and centre, a rod by its radius and ends, a ball by its radius and centre, or an actual convex wall by its generating corners. Hollow forms assemble separate wall cells so rendering, mass and collision preserve their empty space. The repository keeps every model as coarse as identification allows. Parts carry unit scale, flat colours and no texture.
 *
 * `build` computes the centre of mass and inertia from the parts under the stated total mass ({@link ArchetypeMass}) and returns the {@link Archetype}.
 *
 * @template Id The archetype's affordance ids.
 * @template Dimension The archetype's free dimensions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a producer writes with it, the coarseness rule it serves and what `build` derives.
 * @evidence contracts/development/design.md#principled-representation Code CAD over named dimensions and formula-defined primitives or actual convex cells. One recorded cell supplies visible and physical boundaries; producer-authored corner formulas own the wall profile.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Existing primitive, span, contact and build calls remain unchanged. Armour uses convex to express actual hollow walls that filled primitives cannot represent; recording/material ownership is shared with existing parts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No call knows a kind of object; a repeated part id is a producer's defect and throws at once.
 */
export class ArchetypeBuilder<Id extends string, Dimension extends string> {
  /** Actual parts and their common material/mass/cell ownership. */
  readonly #inventory: ArchetypeBuilderParts;

  /** The affordances so far, at rest. */
  readonly #affordances: (IAutoMovieAffordance & { id: Id })[] = [];

  /** The spans so far. */
  readonly #spans: ArchetypeSpan.ISpan[] = [];

  /** The fragment sets declared so far. */
  readonly #fractures: ArchetypeFracture.ISet[] = [];

  /** The producer's identity and its draws. */
  readonly #props: ArchetypeBuilder.IProps<Dimension>;

  /**
   * An empty archetype under construction.
   *
   * @param props The model's id and name, and the producer's draws, which name the producer.
   */
  public constructor(props: ArchetypeBuilder.IProps<Dimension>) {
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
   * Add one actual convex wall cell, sharing its visible and physical boundary.
   * @param id Unique part id.
   * @param points Cell-local finite corners in metres, or an immutable admitted cell prepared by ArchetypeConvexCell.of for repeated rigid instances.
   * @param at Local origin in model metres; zero when absent.
   * @param options Existing colour, rigid rotation, mass weight and surface options.
   * @returns This builder.
   * @throws {Error} For a repeated id or inadmissible convex cell.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the copied local point set, rigid placement and actual-cell premise.
   * @evidence contracts/development/implementation.md#principled-implementation ArchetypeConvexCell derives the visible polyhedron, hull collider and local integrated mass from one explicit actual convex volume. An already admitted immutable cell can be reused for exactly rigid-equivalent instances, with each part's own transform. Hollow forms use separate wall cells.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Use a prepared cell or derive it from copied corners, record its exact mesh through the common part owner, then retain its physical correspondence by id.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No whole-shell hull or hidden solid fills a cavity, and no arbitrary mesh is guessed convex.
   * @evidence contracts/development/implementation.md#efficient-algorithms Raw corners require one small V-corner hull preparation. A prepared cell reuses all geometry and integration in constant time; every added part still scans P existing ids. Both build reductions reuse the prepared mass record.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One admitted cell serves rendering, mass, collision and subsequent rigid poses; optical material recording is shared with primitives.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Raw corners are copied into owned cell buffers; a supplied immutable prepared cell is explicitly shared. The builder retains cells until build hands them to the archetype. No caller raw-point array or external resource is retained.
   */
  public convex(
    id: string,
    points: readonly IAutoMovieVector3[] | ArchetypeConvexCell.ICell,
    at: IAutoMovieVector3 = { x: 0, y: 0, z: 0 },
    options?: ArchetypeBuilder.IOptions,
  ): this {
    const cell: ArchetypeConvexCell.ICell =
      "geometry" in points ? points : ArchetypeConvexCell.of(points);
    this.#inventory.add(id, cell.geometry, at, options?.rotation, options);
    this.#inventory.cells.set(id, cell);
    return this;
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
   * @evidence contracts/development/implementation.md#principled-implementation Shared span state resolves both rest anchors and any held extension before recording the actual cylinder, so rest mass uses its full drawn length. The archetype resolves the same declaration after each pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Locate, record the rod, record the span.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An end must already exist, so the rest line is the one every pose lays; coincident ends are refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms A scan of the parts and affordances so far, tens at most.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses rod construction and the same state operation used by posed lines and grip frames.
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
    const span: ArchetypeSpan.ISpan = {
      id,
      from,
      to,
      radius,
      length: length ?? null,
    };
    const endpoints: ArchetypeSpan.IState = ArchetypeSpan.state(
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

  /**
   * Bind a construction point to a real part already laid by this builder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Converts model metres to the actual named carrier's local span coordinates.
   * @evidence contracts/development/implementation.md#principled-implementation Delegate actual rigid-frame inversion to the shared span-anchor owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call, without recording an extra part or contact.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No reconstructed carrier frame or hidden world anchor is substituted.
   * @evidence contracts/development/implementation.md#efficient-algorithms The owner performs one O(P) part lookup and constant rigid arithmetic.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the actual already-built frame and the common anchor conversion.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new local endpoint without retaining a query or external handle.
   */
  public anchor(id: string, point: IAutoMovieVector3): ArchetypeSpan.End {
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
   * Declare the sets of parts a hit breaks off, each a fragment; the threshold is the body's `contact.fracture`, given to `build` as `outcome`.
   *
   * @param sets The fragment sets, each an id, the parts it carries away and the contacts on them that move none; declared after those contacts.
   * @returns This builder.
   * @throws {Error} When a set's id is declared twice, a set carries no part, a set names a part not yet recorded or one a set already names (its own included), or a contact not yet declared or one a set already carries, a producer's defect.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a set is, where the threshold goes and the failures.
   * @evidence contracts/development/implementation.md#principled-implementation Each set's id is unique and its parts exist, at least one, each named once across the sets, so every part is in at most one fragment and the remainder is the rest; each contact a set carries is declared and carried by one set only.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One check per part, then the record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A repeated id, an empty set, or an unknown or shared part or contact throws rather than being dropped.
   * @evidence contracts/development/implementation.md#efficient-algorithms A scan of the parts per named part, tens at most.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Records once per producer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The builder keeps the sets until `build` hands them to the archetype.
   */
  public fracture(sets: readonly ArchetypeFracture.ISet[]): this {
    const named: Set<string> = new Set(
      this.#fractures.flatMap(
        (s: ArchetypeFracture.ISet): readonly string[] => s.parts,
      ),
    );
    const ids: Set<string> = new Set(
      this.#fractures.map((s: ArchetypeFracture.ISet): string => s.id),
    );
    const carried: Set<string> = new Set(
      this.#fractures.flatMap(
        (s: ArchetypeFracture.ISet): readonly string[] => s.affordances ?? [],
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
          !this.#inventory.parts.some((p: IAutoMovieModelPart): boolean => p.id === part)
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
   * @param contact Resting and ground materials select their cited friction pair. An explicit restitution is admitted from 0 to 1; otherwise restitution remains unknown; a material reference never supplies a universal scalar. Drag and outcome are the launched body's optional flight data. The constructor's physical material declaration is required independently of optical colours and resting surfaces.
   * @returns The archetype at rest.
   * @throws {Error} As `ArchetypeMass.of` does when no part has mass.
   * @throws {ArchetypeRefusal} When the physical material is missing or unknown, an explicit restitution is invalid, or no source measured a declared resting pair.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's unit and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation Admits the producer's physical material and only an explicit authored restitution through ArchetypeMaterial, selects cited resting-pair friction, and computes mass properties from the recorded parts under the stated mass. Published restitution measurements retain pair, speed and specimen conditions separately.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Material and contact admission precede one construction from the builder's recorded geometry and mass properties.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing material is refused. Unmeasured restitution and undeclared resting friction remain absent; neither becomes zero or a universal coefficient. The mass remains the producer's cited value rather than a guessed density-derived total.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the parts, through `ArchetypeMass.of`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Aggregate and per-part mass reductions share admitted actual-cell integration records and the same local-solid/weight owners; geometry and material records pass directly to the built archetype.
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
    const material: ArchetypeMaterial.Kind = ArchetypeMaterial.admit(
      this.#props.material,
      this.#props.draw.archetype,
    );
    const restitution: number | null = ArchetypeMaterial.restitution(
      material,
      contact?.restitution,
      this.#props.draw.archetype,
    );
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
      parts: this.#inventory.parts,
      cells: this.#inventory.cells,
      affordances: this.#affordances,
      materials: [...this.#inventory.materials.values()],
      properties: ArchetypeMass.of(
        this.#inventory.parts,
        mass,
        this.#inventory.density,
        this.#inventory.shares,
        this.#inventory.cells,
      ),
      friction: pair === null ? null : ArchetypeFriction.value(pair.static),
      kineticFriction:
        pair === null || pair.kinetic === null
          ? null
          : ArchetypeFriction.value(pair.kinetic),
      surfaces: this.#inventory.surfaces,
      material,
      restitution,
      drag: contact?.drag ?? null,
      contact: contact?.outcome ?? null,
      fractures: this.#fractures,
      masses: ArchetypeMass.parts(
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

  /** Record one primitive through the shared actual-part/material owner. */
  #add(
    id: string,
    shape: AutoMoviePrimitiveShape,
    at: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion | undefined,
    options: ArchetypeBuilder.IOptions | undefined,
  ): this {
    this.#inventory.add(id, { type: "primitive", shape }, at, rotation, options);
    return this;
  }
}

/**
 * Companion types of {@link ArchetypeBuilder}.
 */
export namespace ArchetypeBuilder {
  /** The colour of a part that states none: a mid grey. */
  export const NEUTRAL: string = ArchetypeBuilderParts.NEUTRAL;

  /**
   * The producer identity and draw record, with an explicit physical material.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Preserves the public builder-input name and delegates fields and units to the shared type owner.
   * @evidence contracts/development/design.md#principled-representation Aliases the unchanged producer identity, typed dimension provenance and physical reference material record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Existing constructors and producer helpers keep their established import and generic dimension parameter.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Introduces no parallel fields or broader name/coefficient representation.
   */
  export type IProps<Dimension extends string> =
    ArchetypeBuilderTypes.IProps<Dimension>;

  /**
   * The primitive-part options, preserving the existing public builder name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Delegates optical colour, mass, rigid placement and physical surface meanings to the shared type owner.
   * @evidence contracts/development/design.md#principled-representation Aliases the same part-option record and existing geometry/material types.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Existing box, rod and ball callers retain their current option type while its fields have one owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Adds no producer-specific option or duplicate physical coefficient.
   */
  export type IOptions = ArchetypeBuilderTypes.IOptions;
}
