import { Vector3, rotationBetween } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetypeBuilder } from "../core";
import { ArchetypeMassPrimitive } from "../core/ArchetypeMassPrimitive";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedHeadAttachment } from "./AutoMovieArchetypeQuadrupedHeadAttachment";

/**
 * Two dimensioned coarse pinna plates rooted in the head capsule.
 *
 * Published ear length/breadth are interpreted as a straight plate's complete
 * base-to-tip centreline and width. A rectangular plate, its thickness and its neutral direction are
 * explicit authored representation choices, not measured ear anatomy. Existing
 * body dimensions, skeletal controls and mass ownership are not changed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the two real plate parts, metre/height-fraction conversion, complete pinna dimensions, authored rectangular interpretation and head-root seating.
 * @evidence contracts/development/design.md#principled-representation An explicit positive length, width and plate thickness plus a finite neutral direction determine each mirrored box; a containing root disk is admitted by the existing head owner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Optional body data and one lay operation serve the equid producers without another body, skeleton, material or source-measurement table.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No species, seed, speed, picture or biological thickness/angle limit selects geometry. Missing source dimensions are not invented by this owner and an oversized root refuses rather than changing the head.
 */
export namespace AutoMovieArchetypeQuadrupedEars {
  /**
   * Measured-reference proportions and explicitly authored plate construction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Length, width and plateThickness are positive fractions of current withers height; direction is a nonzero neutral-model vector for the left plate, mirrored in X for the right.
   * @evidence contracts/development/design.md#principled-representation Keeps two independently sourced dimensions separate from authored plate thickness and pose; no statistical band or biological orientation is encoded.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The optional head profile supplies only what the two existing box primitives need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No implicit thickness, pose, radius expansion or borrowed mass coefficient fills a missing member.
   */
  export interface IProfile {
    /** Complete base-to-tip length divided by reference withers height. */
    length: number;
    /** Complete pinna breadth divided by the same reference withers height. */
    width: number;
    /** Authored rectangular plate thickness divided by current withers height. */
    plateThickness: number;
    /** Authored left-ear direction in neutral model space; right mirrors X. */
    direction: IAutoMovieVector3;
  }

  /**
   * Two admitted plates and their total solid volume, cubic metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Volume is the sum of both rectangular solids; emit consumes an optional weight budget for the pair, not a biological density or ear-mass estimate.
   * @evidence contracts/development/design.md#principled-representation One admitted immutable-dimension plan connects physical volume and emission so the whole-head source share can be divided without a second geometry calculation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The head assembler reads volume and calls emit; the existing lay seam uses the same plan for standalone callers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No unrepresented tissue, inferred density, changed head dimensions or duplicate planning supplies the weight allocation.
   */
  export interface IPrepared {
    /** Two-box volume, cubic metres. */
    readonly volume: number;
    /**
     * Append both admitted metre-space boxes to the builder in the supplied colour.
     * A supplied pair weight is split equally; absent, the builder allocates by
     * volume. Invalid weights refuse before emission; part identity and
     * material admission remain the builder's responsibility.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States builder mutation, model-metre geometry, optical colour, optional complete-pair weight and admission ownership.
     * @evidence contracts/development/implementation.md#principled-implementation The prepared equal-volume boxes retain their admitted rigid frames and split a finite representably positive pair weight equally; absent weight preserves the builder's volume allocation.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate the optional weight, then append the two prepared boxes through the existing builder.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No biological ear density, massless proxy or dimension change is introduced; invalid pair weights refuse before either append.
     * @evidence contracts/development/implementation.md#efficient-algorithms Exactly two box appends and constant scalar checks use O(1) time and new storage per emission, without repeating root admission.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Each emission reuses the same admitted dimensions and root frames that supplied pair volume, while copying transforms and shapes for the independent builder.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The prepared plan retains two bounded frames and scalar dimensions; emitted parts transfer to the builder and no builder, emitted model or external handle is retained.
     */
    emit<Id extends string, Dimension extends string>(
      builder: AutoMovieArchetypeBuilder<Id, Dimension>,
      color: string,
      totalShare?: number,
    ): void;
  }

  /**
   * Add the two plates after admitting all dimensions and both complete roots.
   *
   * @param builder The body builder.
   * @param head Neutral head capsule controls, metres.
   * @param withers Current withers height, metres.
   * @param profile Explicit dimension ratios and authored plate construction.
   * @param color The body's optical colour.
   * @param totalShare Optional complete two-plate weight budget; absent for existing volume allocation.
   * @throws {RangeError} For invalid or unrepresentable dimensions/direction or a complete root that cannot fit the head.
   * @throws {Error} When the shared primitive mass owner cannot represent the positive solid.
   * @evidence contracts/development/common.md#meaningful-documentation States model frame, normalized input and SI construction, complete base-to-tip/breadth definitions, head seating and existing mass ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Prepare the two-plate geometry and emit that same admitted plan with the supplied pair weight or volume default.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One prepare call and one emission call share the complete-root and volume premises.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A plate never stretches to join the skull or changes sourced body values. Unknown biology remains authored geometry. Dimension/root refusal happens before either ear is appended; builder identity/material admission remains the builder's responsibility.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed scalar/vector work and two capsule root queries take O(1) time and storage during construction, with no render, search history or per-frame solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The prepared owner supplies the same dimensions, volume and roots as the full-head assembler; no standalone layout duplicates its geometry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Two call-local plans hold fresh scalar points/quaternions; no caller profile, source model, completed result cache or external resource is retained.
   */
  export function lay<Id extends string, Dimension extends string>(
    builder: AutoMovieArchetypeBuilder<Id, Dimension>,
    head: Pick<
      AutoMovieArchetypeQuadrupedBody.IRig,
      "poll" | "nose" | "headRadius"
    >,
    withers: number,
    profile: IProfile,
    color: string,
    totalShare?: number,
  ): void {
    prepare(head, withers, profile).emit(builder, color, totalShare);
  }

  /**
   * Admit complete roots once and retain the dimensions used for emission.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Inputs are neutral head geometry, positive current height and explicit ear profile; output carries pair volume and independent emission into real builders.
   * @evidence contracts/development/implementation.md#principled-implementation Convert normalized dimensions, admit their exact box mass-volume domain, seat each root rectangle's enclosing disk inside the head capsule and snapshot both rigid frames. Equal boxes divide a supplied pair weight equally.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit dimensions/volume, prepare the two roots and return one volume/emission closure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unsupported dimensions, unrepresentable volume and impossible roots refuse before emission. A caller's profile is not retained, nor is a biological density, thickness or angular bound inferred.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two constant-size root queries and fixed primitive arithmetic are paid once; each emission creates exactly two independent box parts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The existing primitive mass owner gives volume and the shared head attachment owner supplies complete-root seating. The head's allocation and this emitter read the same prepared dimensions.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only three scalar dimensions, pair volume and two bounded frame records; every emitted transform/shape is independently copied and no model, caller profile, process or result cache is retained.
   */
  export function prepare(
    head: Pick<
      AutoMovieArchetypeQuadrupedBody.IRig,
      "poll" | "nose" | "headRadius"
    >,
    withers: number,
    profile: IProfile,
  ): IPrepared {
    const length: number = profile.length * withers;
    const width: number = profile.width * withers;
    const thickness: number = profile.plateThickness * withers;
    const norm: number = Math.hypot(
      profile.direction.x,
      profile.direction.y,
      profile.direction.z,
    );
    if (
      ![withers, length, width, thickness, norm].every(
        (value: number): boolean => Number.isFinite(value) && value > 0,
      )
    )
      throw new RangeError(
        "Ear plates require positive finite dimensions and a finite nonzero authored direction",
      );
    const solid: ReturnType<typeof ArchetypeMassPrimitive> =
      ArchetypeMassPrimitive({
        type: "box",
        width,
        height: length,
        depth: thickness,
      });
    if (
      solid === null ||
      !(Number.isFinite(2 * solid.volume) && 2 * solid.volume > 0)
    )
      throw new RangeError(
        "The complete ear pair must have representable positive solid volume",
      );
    const volume: number = 2 * solid.volume;
    const rootRadius: number = Math.hypot(width, thickness) / 2;
    const plans: IPlan[] = [];
    for (const [id, sign] of [
      ["leftEar", 1],
      ["rightEar", -1],
    ] as const) {
      const direction: IAutoMovieVector3 = {
        x: (sign * profile.direction.x) / norm,
        y: profile.direction.y / norm,
        z: profile.direction.z / norm,
      };
      const root: IAutoMovieVector3 = AutoMovieArchetypeQuadrupedHeadAttachment(
        head,
        {
          x: head.poll.x + sign * head.headRadius,
          y: head.poll.y + head.headRadius,
          z: head.poll.z,
        },
        rootRadius,
      );
      const centre: IAutoMovieVector3 = Vector3.add(
        root,
        Vector3.scale(direction, length / 2),
      );
      if (![centre.x, centre.y, centre.z].every(Number.isFinite))
        throw new RangeError(
          "Ear plate geometry must be finitely representable",
        );
      plans.push({
        id,
        centre,
        rotation: rotationBetween({ x: 0, y: 1, z: 0 }, direction),
      });
    }
    return {
      volume,
      emit<Id extends string, Dimension extends string>(
        builder: AutoMovieArchetypeBuilder<Id, Dimension>,
        color: string,
        totalShare?: number,
      ): void {
        if (
          totalShare !== undefined &&
          !(Number.isFinite(totalShare) && totalShare > 0 && totalShare / 2 > 0)
        )
          throw new RangeError(
            "Actual ear weights must be representably positive",
          );
        for (const plan of plans)
          builder.box(
            plan.id,
            { x: width, y: length, z: thickness },
            { ...plan.centre },
            {
              color,
              share: totalShare === undefined ? undefined : totalShare / 2,
              rotation: { ...plan.rotation },
            },
          );
      },
    };
  }

  /** One fully admitted real plate before either is appended to the body. */
  interface IPlan {
    /** Stable head-carried part identity. */
    id: "leftEar" | "rightEar";
    /** Model-space primitive centre. */
    centre: IAutoMovieVector3;
    /** Unit rigid orientation, local Y along the complete ear length. */
    rotation: IAutoMovieQuaternion;
  }
}
