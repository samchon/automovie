import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedEquipment } from "./AutoMovieArchetypeQuadrupedEquipment";
import { QuadrupedEquipmentSolids } from "./QuadrupedEquipmentSolids";

/**
 * One admitted real primitive, kept outside the animal builder until the whole
 * assembly fits.
 */
type Part =
  | {
      kind: "rod";
      id: string;
      radius: number;
      from: IAutoMovieVector3;
      to: IAutoMovieVector3;
      color: string;
    }
  | {
      kind: "box";
      id: string;
      size: IAutoMovieVector3;
      at: IAutoMovieVector3;
      color: string;
    };

/**
 * Call-local geometry and contact plan for the two authored animal assemblies.
 *
 * Additional body spheres are copied once; each recorded solid must retain its
 * requested nonnegative clearance from those producer solids.
 */
export class QuadrupedEquipmentPlan {
  /** Already admitted primitive records in assembly order. */
  readonly #parts: Part[] = [];

  /** Contacts of the same planned U bars. */
  readonly #contacts: (IAutoMovieAffordance & {
    id: AutoMovieArchetypeQuadrupedEquipment.Affordance;
  })[] = [];

  /** Caller identity retained by every admission failure. */
  readonly #archetype: string;

  /** Additional body solids shared by support planning and primitive admission. */
  readonly #solids: QuadrupedEquipmentSolids;

  /**
   * Begin a preflight without retaining or changing an animal builder.
   *
   * @param archetype Producer identity used by equipment refusals.
   * @param spheres Emitted additional body spheres in neutral model metres;
   *   defaults to an empty list and is copied by the solid owner.
   * @throws {RangeError} If an additional sphere radius is not finite positive
   *   or its centre is nonfinite.
   */
  public constructor(
    archetype: string,
    spheres: readonly AutoMovieArchetypeQuadrupedEquipment.ISphere[] = [],
  ) {
    this.#archetype = archetype;
    this.#solids = new QuadrupedEquipmentSolids(archetype, spheres);
  }

  /**
   * Find a connected pack bridge's upper support plane from body solids.
   *
   * @param minimum Positive finite lower height from the ordinary trunk
   *   envelope, metres.
   * @param halfSpan Positive finite bridge half-length along X, metres.
   * @param z Finite fore-aft bridge plane in the neutral model, metres.
   * @param radius Positive finite bridge cylinder radius, metres.
   * @param clearance Finite nonnegative separation from additional spheres,
   *   metres.
   * @returns The admitted lower height or a conservative upper sphere support
   *   height, metres.
   * @throws {AutoMovieArchetypeRefusal} For invalid inputs or nonfinite derived
   *   support height.
   */
  public bridgeHeight(
    minimum: number,
    halfSpan: number,
    z: number,
    radius: number,
    clearance: number,
  ): number {
    this.positive("pack.bridge.height", minimum);
    this.positive("pack.bridge.halfSpan", halfSpan);
    this.positive("pack.bridge.radius", radius);
    this.nonnegative("pack.clearance", clearance);
    return this.#solids.above(minimum, halfSpan, z, radius, clearance);
  }

  /** Append the fully admitted fixed plan to the genuine animal builder. */
  public emit(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeQuadrupedEquipment.Affordance,
      AutoMovieArchetypeQuadrupedBody.Dimension
    >,
  ): void {
    for (const part of this.#parts)
      if (part.kind === "rod")
        builder.rod(part.id, part.radius, part.from, part.to, {
          color: part.color,
        });
      else builder.box(part.id, part.size, part.at, { color: part.color });
    for (const contact of this.#contacts)
      builder.affordance(structuredClone(contact));
  }

  /**
   * Record a real nonzero cylindrical bar between finite metre endpoints.
   *
   * @param id Emitted bar identity, also used by refusal facts.
   * @param radius Positive finite cylinder radius, metres.
   * @param from First finite endpoint in the neutral model frame, metres.
   * @param to Second finite endpoint, distinct from the first, metres.
   * @param color Optical display color without material-physics implications.
   * @param clearance Finite nonnegative separation from each additional body
   *   sphere, metres; defaults to zero, allowing exact contact.
   * @throws {AutoMovieArchetypeRefusal} For invalid geometry/clearance or
   *   insufficient sphere separation.
   */
  public rod(
    id: string,
    radius: number,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    color: string,
    clearance: number = 0,
  ): void {
    this.positive(`${id}.radius`, radius);
    this.positive(`${id}.length`, Vector3.length(Vector3.subtract(to, from)));
    this.nonnegative(`${id}.clearance`, clearance);
    this.#solids.rod(id, radius, from, to, clearance);
    this.#parts.push({ kind: "rod", id, radius, from, to, color });
  }

  /**
   * Record one side pad after its authored positive dimensions passed assembly
   * admission.
   *
   * @param id Emitted pad identity, also used by refusal facts.
   * @param size Full axis-aligned box lengths in metres; assembly admission
   *   supplies positive lengths.
   * @param at Finite box centre in the neutral model frame, metres.
   * @param color Optical display color without material-physics implications.
   * @param clearance Finite nonnegative additional-sphere separation, metres;
   *   defaults to zero, allowing exact contact.
   * @throws {AutoMovieArchetypeRefusal} For nonfinite geometry, invalid
   *   clearance or insufficient sphere separation.
   */
  public box(
    id: string,
    size: IAutoMovieVector3,
    at: IAutoMovieVector3,
    color: string,
    clearance: number = 0,
  ): void {
    this.nonnegative(`${id}.clearance`, clearance);
    this.#solids.box(id, size, at, clearance);
    this.#parts.push({ kind: "box", id, size, at, color });
  }

  /**
   * Plan the three real U bars and their +Y inner bearing contact from admitted
   * dimensions.
   *
   * @param name Prefix of the three emitted bar identities.
   * @param id The real bearing contact identity.
   * @param base Lower bar axis midpoint in the neutral model frame, metres.
   * @param hook Already admitted positive finite bar radius, opening and depth,
   *   metres.
   * @param color Optical display color for all three bars.
   * @param clearance Finite nonnegative additional-sphere separation for every
   *   bar, metres; defaults to zero.
   * @throws {AutoMovieArchetypeRefusal} For invalid derived bar geometry or
   *   insufficient sphere separation; no builder has been mutated.
   */
  public hook(
    name: string,
    id: AutoMovieArchetypeQuadrupedEquipment.Affordance,
    base: IAutoMovieVector3,
    hook: AutoMovieArchetypeQuadrupedEquipment.IHook,
    color: string,
    clearance: number = 0,
  ): void {
    const half: number = hook.opening / 2 + hook.radius;
    this.rod(
      `${name}-base`,
      hook.radius,
      { ...base, z: base.z - half },
      { ...base, z: base.z + half },
      color,
      clearance,
    );
    for (const end of [-1, 1] as const)
      this.rod(
        `${name}-upright-${end}`,
        hook.radius,
        { ...base, z: base.z + end * half },
        {
          ...base,
          y: base.y + hook.radius + hook.depth,
          z: base.z + end * half,
        },
        color,
        clearance,
      );
    const bearing: IAutoMovieVector3 = { ...base, y: base.y + hook.radius };
    this.#contacts.push({
      id,
      kind: "hook",
      extent: null,
      frame: AutoMovieArchetypeFrame.upright(bearing),
    });
  }

  /** Admit all three authored U dimensions before planning either assembly. */
  public admitHook(
    name: string,
    hook: AutoMovieArchetypeQuadrupedEquipment.IHook,
  ): void {
    for (const key of ["radius", "opening", "depth"] as const)
      this.positive(`${name}.${key}`, hook[key]);
  }

  /** Admit finite strictly positive metres without reporting zero as feasible. */
  public positive(axis: string, value: number): void {
    if (!(value > 0))
      this.refuse(
        axis,
        value,
        "the authored or actual length must be finite and strictly positive",
        "supply a positive finite length in metres",
      );
  }

  /** Admit finite nonnegative clearance, including exact contact at zero. */
  public nonnegative(axis: string, value: number): void {
    if (!(value >= 0))
      this.refuse(
        axis,
        value,
        "clearance must be finite and nonnegative",
        "supply zero or a positive finite clearance in metres",
      );
  }

  /** Admit an already positive occupied length at its inclusive fit limit. */
  public atMost(axis: string, value: number, maximum: number): void {
    if (!(maximum > 0 && value <= maximum))
      this.refuse(
        axis,
        value,
        `the complete occupied length must not exceed ${maximum} m`,
        "reduce the equipment dimensions to fit the actual rig",
      );
  }

  /** Preserve one physical request as an actionable producer refusal. */
  public refuse(
    axis: string,
    value: unknown,
    reason: string,
    fix: string,
  ): never {
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: this.#archetype,
      axis,
      value,
      feasible: null,
      reason,
      fix,
    });
  }
}
