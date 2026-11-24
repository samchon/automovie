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
 * base-to-tip centreline and width. A rectangular plate, its thickness and its
 * neutral direction are explicit authored representation choices, not measured
 * ear anatomy. Existing body dimensions, skeletal controls and mass ownership
 * are not changed.
 */
export namespace AutoMovieArchetypeQuadrupedEars {
  /** Measured-reference proportions and explicitly authored plate construction. */
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

  /** Two admitted plates and their total solid volume, cubic metres. */
  export interface IPrepared {
    /** Two-box volume, cubic metres. */
    readonly volume: number;
    /**
     * Append both admitted metre-space boxes to the builder in the supplied
     * colour. A supplied pair weight is split equally; absent, the builder
     * allocates by volume. Invalid weights refuse before emission; part
     * identity and material admission remain the builder's responsibility.
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
   * @param totalShare Optional complete two-plate weight budget; absent for
   *   existing volume allocation.
   * @throws {RangeError} For invalid or unrepresentable dimensions/direction or
   *   a complete root that cannot fit the head.
   * @throws {Error} When the shared primitive mass owner cannot represent the
   *   positive solid.
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

  /** Admit complete roots once and retain the dimensions used for emission. */
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
        (value: number): boolean => value > 0,
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
    if (solid === null || !(2 * solid.volume > 0))
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
        if (totalShare !== undefined && !(totalShare > 0 && totalShare / 2 > 0))
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
