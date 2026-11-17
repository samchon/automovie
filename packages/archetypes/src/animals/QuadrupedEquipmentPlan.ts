import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type ArchetypeBuilder,
  ArchetypeFrame,
  ArchetypeRefusal,
} from "../core";
import type { QuadrupedBody } from "./QuadrupedBody";
import type { QuadrupedEquipment } from "./QuadrupedEquipment";

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
 * @evidence contracts/development/common.md#meaningful-documentation Defines the preflight lifetime, primitive/contact ownership and explicit append boundary shared by yoke and pack construction.
 * @evidence contracts/development/design.md#principled-representation Rod and box records carry actual SI geometry; typed contacts refer to the same bearing bars. Planning is separate from mutating the real animal builder.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only QuadrupedEquipment uses this internal plan. It owns shared length admission, primitive recording, three-bar U hooks and final append, while assembly fit and public inputs remain with QuadrupedEquipment.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No species dimensions, mass shares, material coefficients, maker defaults or contact-only substitutes enter this plan; a failed preflight has no builder to mutate.
 */
export class QuadrupedEquipmentPlan {
  /** Already admitted primitive records in assembly order. */
  readonly #parts: Part[] = [];

  /** Contacts of the same actual planned U bars. */
  readonly #contacts: (IAutoMovieAffordance & {
    id: QuadrupedEquipment.Affordance;
  })[] = [];

  /** Actual caller identity retained by every admission failure. */
  readonly #archetype: string;

  /** Begin one bounded preflight without retaining or changing the animal builder. */
  public constructor(archetype: string) {
    this.#archetype = archetype;
  }

  /**
   * Append the fully admitted fixed plan to the genuine animal builder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the commit boundary and preserves ordinary duplicate-part producer errors.
   * @evidence contracts/development/implementation.md#principled-implementation Emit the admitted actual rod/box records and then their contacts using the same public builder primitives as every producer.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One primitive loop followed by one contact loop after all assembly planning succeeded.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No append occurs during admission and no duplicate id is renamed or swallowed; duplicate producer defects keep the builder's ordinary error behavior.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed assembly sizes bound plan storage; emitting each fixed primitive includes the builder's existing O(P) id scan over P previously built parts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses recorded geometry and contact frames directly instead of recomputing or fitting another assembly.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The builder owns emitted records; the caller releases this call-local plan after the single append and retains no builder or external handle here.
   */
  public emit(
    builder: ArchetypeBuilder<
      QuadrupedEquipment.Affordance,
      QuadrupedBody.Dimension
    >,
  ): void {
    for (const part of this.#parts)
      if (part.kind === "rod")
        builder.rod(part.id, part.radius, part.from, part.to, {
          color: part.color,
        });
      else builder.box(part.id, part.size, part.at, { color: part.color });
    for (const contact of this.#contacts) builder.affordance(contact);
  }

  /**
   * Record a real nonzero cylindrical bar between finite metre endpoints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names radius, endpoints, optical color and the nonzero finite bar requirement before recording.
   * @evidence contracts/development/implementation.md#principled-implementation Admit radius and both endpoints, compute the actual Euclidean span and only then record the cylinder inputs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Scalar admission, point admission, span admission, then one local append.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No zero-length bar, nonfinite endpoint, guessed radius or builder mutation stands in for geometry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant coordinate work and one bounded plan entry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both assemblies and every U bar use this single primitive recorder and the engine vector owner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the emitted bar inputs remain in this call-local plan, with no process or foreign handle.
   */
  public rod(
    id: string,
    radius: number,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    color: string,
  ): void {
    this.positive(`${id}.radius`, radius);
    this.point(`${id}.from`, from);
    this.point(`${id}.to`, to);
    this.positive(`${id}.length`, Vector3.length(Vector3.subtract(to, from)));
    this.#parts.push({ kind: "rod", id, radius, from, to, color });
  }

  /**
   * Record one side pad after its authored positive dimensions passed assembly admission.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines a full-size metre box, its centre and the caller's prior positive-dimension admission.
   * @evidence contracts/development/implementation.md#principled-implementation Check finite derived size and placement, then retain the exact admitted side-pad box for ordinary builder emission.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two point admissions precede one local primitive record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No replacement shape, implicit dimension or builder mutation is introduced; assembly admission still owns positive authored width, thickness and length.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant six-coordinate inspection and one plan entry per side.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the common finite-point admission and the same emitted box record rather than rebuilding its coordinates.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps only this pad's scalar geometry and optical color until the call-local plan is released.
   */
  public box(
    id: string,
    size: IAutoMovieVector3,
    at: IAutoMovieVector3,
    color: string,
  ): void {
    this.point(`${id}.position`, at);
    this.point(`${id}.size`, size);
    this.#parts.push({ kind: "box", id, size, at, color });
  }

  /**
   * Plan the three real U bars and their +Y inner bearing contact from admitted dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the lower bar midpoint, clear fore-aft opening, clear vertical depth, bar radius and the outward bearing normal.
   * @evidence contracts/development/implementation.md#principled-implementation Offset upright axes by opening/2 plus radius, raise each upright by radius plus clear depth and put the contact exactly one radius above the actual lower bar axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lower bar, two upright bars, then one finite bearing frame on the same geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The hook is three admitted physical cylinders and its actual bearing site, never a floating contact or an inferred rated commercial fitting.
   * @evidence contracts/development/implementation.md#efficient-algorithms Exactly three bar plans and one contact record per hook, with constant coordinate work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Hitch and both side loads use one U construction and the shared rod recorder; the bearing point is computed once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Bar and contact records remain bounded in the call-local plan and retain no animal builder or external resource.
   */
  public hook(
    name: string,
    id: QuadrupedEquipment.Affordance,
    base: IAutoMovieVector3,
    hook: QuadrupedEquipment.IHook,
    color: string,
  ): void {
    const half: number = hook.opening / 2 + hook.radius;
    this.rod(
      `${name}-base`,
      hook.radius,
      { ...base, z: base.z - half },
      { ...base, z: base.z + half },
      color,
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
      );
    const bearing: IAutoMovieVector3 = { ...base, y: base.y + hook.radius };
    this.point(`${name}.bearing`, bearing);
    this.#contacts.push({
      id,
      kind: "hook",
      extent: null,
      frame: ArchetypeFrame.upright(bearing),
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
  public admitHook(name: string, hook: QuadrupedEquipment.IHook): void {
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
   * @evidence contracts/development/implementation.md#principled-implementation Throw the existing ArchetypeRefusal with parameter kind and the original request facts; no inclusive feasible range falsely admits zero.
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
    throw new ArchetypeRefusal({
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
