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

/** One admitted real primitive, kept outside the animal builder until the whole assembly fits. */
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
 * Additional body spheres are copied once; each recorded solid must retain
 * its requested nonnegative clearance from those actual producer solids.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines neutral-model metres, copied additional spheres, preflight lifetime, primitive/contact ownership and the explicit append boundary.
 * @evidence contracts/development/design.md#principled-representation Rod and box records carry actual SI geometry; typed contacts refer to the same bearing bars. The shared solid owner holds independent body-sphere copies and admits actual cylinder/box separation before recording.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only AutoMovieArchetypeQuadrupedEquipment uses this internal plan. It owns shared length admission, primitive recording, three-bar U hooks and final append, while assembly fit and public inputs remain with AutoMovieArchetypeQuadrupedEquipment.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No species dimensions, mass shares, material coefficients, maker defaults or contact-only substitutes enter this plan; a failed preflight has no builder to mutate.
 */
export class QuadrupedEquipmentPlan {
  /** Already admitted primitive records in assembly order. */
  readonly #parts: Part[] = [];

  /** Contacts of the same actual planned U bars. */
  readonly #contacts: (IAutoMovieAffordance & {
    id: AutoMovieArchetypeQuadrupedEquipment.Affordance;
  })[] = [];

  /** Actual caller identity retained by every admission failure. */
  readonly #archetype: string;

  /** Actual additional body solids shared by support planning and primitive admission. */
  readonly #solids: QuadrupedEquipmentSolids;

  /**
   * Begin a preflight without retaining or changing an animal builder.
   *
   * @param archetype Actual producer identity used by equipment refusals.
   * @param spheres Actual emitted additional body spheres in neutral model metres; defaults to an empty list and is copied by the solid owner.
   * @throws {RangeError} If an additional sphere radius is not finite positive or its centre is nonfinite.
   */
  public constructor(
    archetype: string,
    spheres: readonly AutoMovieArchetypeQuadrupedEquipment.ISphere[] = [],
  ) {
    this.#archetype = archetype;
    this.#solids = new QuadrupedEquipmentSolids(archetype, spheres);
  }

  /**
   * Find a connected pack bridge's upper support plane from actual body solids.
   *
   * @param minimum Positive finite lower height from the ordinary trunk envelope, metres.
   * @param halfSpan Positive finite bridge half-length along X, metres.
   * @param z Finite fore-aft bridge plane in the neutral model, metres.
   * @param radius Positive finite bridge cylinder radius, metres.
   * @param clearance Finite nonnegative separation from actual additional spheres, metres.
   * @returns The admitted lower height or a conservative upper sphere support height, metres.
   * @throws {AutoMovieArchetypeRefusal} For invalid inputs or nonfinite derived support height.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the admitted trunk height, real X span/Z plane, bar radius and authored minimum clearance in metres.
   * @evidence contracts/development/implementation.md#principled-implementation Delegate the additional-sphere upper envelope and outward rounding to the same solid owner that admits every final primitive.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate finite inputs and positive sizes before one shared support call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No species offset, fixture exception, hidden tolerance or unconnected elevated marker changes physical fit.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S) for S actual additional body spheres, with constant auxiliary storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both actual bridge planes use the same body solid records and support routine.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains no bridge request, builder or external handle.
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
    this.point("pack.bridge.plane", { x: 0, y: minimum, z });
    return this.#solids.above(minimum, halfSpan, z, radius, clearance);
  }

  /**
   * Append the fully admitted fixed plan to the genuine animal builder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the emission boundary, independent returned contact records and ordinary duplicate-part producer errors.
   * @evidence contracts/development/implementation.md#principled-implementation Emit the admitted actual rod/box records and then their contacts using the same public builder primitives as every producer.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One primitive loop followed by one contact loop after all assembly planning succeeded.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No append occurs during admission and no duplicate id is renamed or swallowed; duplicate producer defects keep the builder's ordinary error behavior.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed assembly sizes bound plan storage; emitting each fixed primitive includes the builder's existing O(P) id scan over P previously built parts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses recorded geometry and copied contact frames instead of recomputing or fitting another assembly; the same admitted plan may emit independent models.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each builder owns independent emitted records. The caller may retain fixed equipment records and O(S) copied body spheres until the plan's final emission; the plan retains no builder or external handle.
   */
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
   * @param id Actual emitted bar identity, also used by refusal facts.
   * @param radius Positive finite cylinder radius, metres.
   * @param from First finite endpoint in the neutral model frame, metres.
   * @param to Second finite endpoint, distinct from the first, metres.
   * @param color Optical display color without material-physics implications.
   * @param clearance Finite nonnegative separation from each additional body sphere, metres; defaults to zero, allowing exact contact.
   * @throws {AutoMovieArchetypeRefusal} For invalid geometry/clearance or insufficient actual sphere separation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names actual cylinder geometry, display color, the zero default clearance and physical additional-sphere refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Admit radius, endpoints, positive span and clearance, then check the actual flat-capped cylinder against every additional sphere before recording it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Scalar, point and span admission precede one shared solid check and one local append.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No zero-length bar, nonfinite endpoint, guessed radius or builder mutation stands in for geometry.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S) arithmetic for S additional spheres, constant auxiliary storage and one fixed equipment entry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both assemblies and every U bar use this single primitive recorder and the engine vector owner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the emitted bar inputs remain in this call-local plan, with no process or foreign handle.
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
    this.point(`${id}.from`, from);
    this.point(`${id}.to`, to);
    this.positive(`${id}.length`, Vector3.length(Vector3.subtract(to, from)));
    this.nonnegative(`${id}.clearance`, clearance);
    this.#solids.rod(id, radius, from, to, clearance);
    this.#parts.push({ kind: "rod", id, radius, from, to, color });
  }

  /**
   * Record one side pad after its authored positive dimensions passed assembly admission.
   *
   * @param id Actual emitted pad identity, also used by refusal facts.
   * @param size Full axis-aligned box lengths in metres; assembly admission supplies positive lengths.
   * @param at Finite box centre in the neutral model frame, metres.
   * @param color Optical display color without material-physics implications.
   * @param clearance Finite nonnegative additional-sphere separation, metres; defaults to zero, allowing exact contact.
   * @throws {AutoMovieArchetypeRefusal} For nonfinite geometry, invalid clearance or insufficient actual sphere separation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines full-size metre geometry, prior positive-size admission, the zero clearance default and actual-solid refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Admit finite size/placement and nonnegative clearance, then delegate actual sphere-to-box separation before recording the unchanged pad.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two point admissions and clearance admission precede the shared solid check and local record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No replacement shape, implicit dimension or builder mutation is introduced; assembly admission still owns positive authored width, thickness and length.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S) arithmetic for S additional spheres, constant auxiliary storage and one pad entry per side.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the common finite-point admission and the same emitted box record rather than rebuilding its coordinates.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps only this pad's scalar geometry and optical color until the call-local plan is released.
   */
  public box(
    id: string,
    size: IAutoMovieVector3,
    at: IAutoMovieVector3,
    color: string,
    clearance: number = 0,
  ): void {
    this.point(`${id}.position`, at);
    this.point(`${id}.size`, size);
    this.nonnegative(`${id}.clearance`, clearance);
    this.#solids.box(id, size, at, clearance);
    this.#parts.push({ kind: "box", id, size, at, color });
  }

  /**
   * Plan the three real U bars and their +Y inner bearing contact from admitted dimensions.
   *
   * @param name Prefix of the actual three emitted bar identities.
   * @param id The real bearing contact identity.
   * @param base Lower bar axis midpoint in the neutral model frame, metres.
   * @param hook Already admitted positive finite bar radius, opening and depth, metres.
   * @param color Optical display color for all three bars.
   * @param clearance Finite nonnegative additional-sphere separation for every bar, metres; defaults to zero.
   * @throws {AutoMovieArchetypeRefusal} For invalid derived bar geometry or insufficient actual sphere separation; no builder has been mutated.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the lower bar midpoint, clear fore-aft opening, clear vertical depth, bar radius and the outward bearing normal.
   * @evidence contracts/development/implementation.md#principled-implementation Offset upright axes by opening/2 plus radius, raise each upright by radius plus clear depth and put the contact exactly one radius above the actual lower bar axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lower bar, two upright bars, then one finite bearing frame on the same geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The hook is three admitted physical cylinders and its actual bearing site, never a floating contact or an inferred rated commercial fitting.
   * @evidence contracts/development/implementation.md#efficient-algorithms Exactly three bar plans require O(S) additional-sphere checks in total; one contact record and constant auxiliary storage complete the hook.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Hitch and both side loads use one U construction and the shared rod recorder; the bearing point is computed once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Bar and contact records remain bounded in the call-local plan and retain no animal builder or external resource.
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
    this.point(`${name}.bearing`, bearing);
    this.#contacts.push({
      id,
      kind: "hook",
      extent: null,
      frame: AutoMovieArchetypeFrame.upright(bearing),
    });
  }

  /**
   * Admit all three authored U dimensions before planning either assembly.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Requires strictly positive finite metre radius, clear opening and depth on their actual authored parameter paths.
   * @evidence contracts/development/implementation.md#principled-implementation Inspect radius, opening and depth with the shared strict-positive admission before any geometry is emitted.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed three-key admission loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing, zero, negative and nonfinite physical values do not acquire defaults or clamped replacements.
   * @evidence contracts/development/implementation.md#efficient-algorithms Exactly three scalar checks and no retained auxiliary storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the single positive-length owner for both assemblies and all physical hooks.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no authored hook input and opens no process or resource.
   */
  public admitHook(
    name: string,
    hook: AutoMovieArchetypeQuadrupedEquipment.IHook,
  ): void {
    for (const key of ["radius", "opening", "depth"] as const)
      this.positive(`${name}.${key}`, hook[key]);
  }

  /**
   * Refuse nonfinite derived coordinates before recording their primitive or contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the physical axis and preserves its exact three-coordinate input in a parameter refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Every Cartesian coordinate must be finite before the same planned point reaches builder emission.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One three-coordinate predicate followed by the shared refusal when invalid.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Overflow or malformed geometry cannot become a placeholder point, clipped coordinate or partially built assembly.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three finite checks in constant space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All assembly landmarks, bars, pads and bearing contacts use this same geometric admission.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps no point on a successful check and retains only refusal facts through the caller on failure.
   */
  public point(axis: string, value: IAutoMovieVector3): void {
    if (![value.x, value.y, value.z].every(Number.isFinite))
      this.refuse(
        axis,
        value,
        "derived equipment coordinates must be finite",
        "reduce the authored dimensions or correct the rest rig",
      );
  }

  /**
   * Admit finite strictly positive metres without reporting zero as feasible.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines strict positive physical length and preserves the caller's exact axis/value in a failure.
   * @evidence contracts/development/implementation.md#principled-implementation Admit exactly Number.isFinite(value) and value greater than zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One physical predicate delegates its failure to the common refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No inclusive-zero feasible range, invented default or coercion substitutes for a positive authored length.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar work with no iteration or allocation on success.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by authored dimensions, actual rig lengths and every derived bar span.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no successful value or external handle.
   */
  public positive(axis: string, value: number): void {
    if (!(Number.isFinite(value) && value > 0))
      this.refuse(
        axis,
        value,
        "the authored or actual length must be finite and strictly positive",
        "supply a positive finite length in metres",
      );
  }

  /**
   * Admit finite nonnegative clearance, including exact contact at zero.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes clearances that may be zero from physical bar sizes that must be positive.
   * @evidence contracts/development/implementation.md#principled-implementation Admit exactly finite values greater than or equal to zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar predicate and common actionable refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Negative clearance is not silently changed to contact or an overlapping fitted assembly.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar work and no successful-path allocation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Yoke and pack use this one distinction between clearance and positive solid size.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no admitted input or external resource.
   */
  public nonnegative(axis: string, value: number): void {
    if (!(Number.isFinite(value) && value >= 0))
      this.refuse(
        axis,
        value,
        "clearance must be finite and nonnegative",
        "supply zero or a positive finite clearance in metres",
      );
  }

  /**
   * Admit an already positive occupied length at its actual inclusive fit limit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines a finite positive limit, inclusive boundary and exact original authored value in refusal facts.
   * @evidence contracts/development/implementation.md#principled-implementation Require finite value/maximum, a positive maximum and value no greater than that derived physical span.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fit predicate delegates any invalid or exceeded limit to the common refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither span overflow nor an impossible negative fit produces clipped equipment; the reported value is the caller's length rather than a transformed proxy.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar comparison with no fitting loop or retained temporary collection.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both assemblies use the same inclusive admission for neck, beam, pad, rail and hook fit.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Successful checks retain nothing; failure owns only the ordinary refusal data.
   */
  public atMost(axis: string, value: number, maximum: number): void {
    if (
      !(
        Number.isFinite(value) &&
        Number.isFinite(maximum) &&
        maximum > 0 &&
        value <= maximum
      )
    )
      this.refuse(
        axis,
        value,
        `the complete occupied length must not exceed ${maximum} m`,
        "reduce the equipment dimensions to fit the actual rig",
      );
  }

  /**
   * Preserve one actual physical request as an actionable producer refusal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the caller identity, physical axis, unchanged value and direct reason/fix supplied by the actual admission site.
   * @evidence contracts/development/implementation.md#principled-implementation Throw the existing AutoMovieArchetypeRefusal with parameter kind and the original request facts; no inclusive feasible range falsely admits zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordinary typed refusal construction with no handler or fallback.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No error is swallowed, reclassified as a successful build or converted to a guessed dimension.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant refusal construction on the failure path only.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every primitive and assembly admission uses the existing package refusal class and this one unchanged request representation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No external resource exists; the thrown error retains only its ordinary request and diagnostic facts.
   */
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
