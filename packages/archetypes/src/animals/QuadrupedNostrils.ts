import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { ArchetypeBuilder } from "../core";
import type { QuadrupedBody } from "./QuadrupedBody";

/**
 * Two coarse nostrils laid inside the actual head capsule's nose cap, one to each side, so breathing can flare them.
 *
 * Each nostril is a sphere centred on the nose cap's lateral side, inset so that it is internally tangent to the cap: at rest it lies wholly inside the head and the closed silhouette and every head contact are unchanged; widening its radius pushes it out of the muzzle, the flare. Its radius and how far it sits back from the nose are authored coarse construction, not measured anatomy, and it carries no mass of its own: a share of zero under the head's source share.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the place on the nose cap, the tangency, the flare, the authored fractions and the zero share.
 * @evidence contracts/development/design.md#principled-representation Two fractions of the actual head determine the pair.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Optional body data, one geometry reader and one lay operation serve the head assembler and the breathing layer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No species case or measured-looking constant.
 */
export namespace QuadrupedNostrils {
  /**
   * Authored nostril construction as fractions of the actual head.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both members are dimensionless fractions with their admitted ranges.
   * @evidence contracts/development/design.md#principled-representation Fractions of the head keep the pair proportional to it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two values the geometry reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IProfile {
    /** Each nostril's radius over the head capsule's, in (0, 1). */
    radius: number;

    /** How far back of the nose each sits, over the head capsule's radius, in [0, 1). */
    back: number;
  }

  /**
   * The nostrils' neutral centres and radius in the model's space.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Metres in model space.
   * @evidence contracts/development/design.md#principled-representation Two centres and one radius.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `lay`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IGeometry {
    /** The left nostril's centre. */
    left: IAutoMovieVector3;

    /** The right nostril's centre. */
    right: IAutoMovieVector3;

    /** Each one's radius, metres. */
    radius: number;
  }

  /**
   * The nostrils inside an actual head capsule.
   *
   * @param head The actual neutral head capsule: poll, nose and radius.
   * @param profile The authored construction.
   * @returns Their neutral geometry.
   * @throws {RangeError} For fractions outside their ranges or a degenerate head.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the output and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation From the nose cap's centre, step back along the head by the authored fraction and out sideways so the sphere is internally tangent to the cap: the centre lies R minus r from the nose along the direction blended from the head's axis and its lateral axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, build the head's axes, place the pair.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Out-of-range fractions refuse.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by `lay`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh points and retains nothing.
   */
  export function geometry(
    head: Pick<QuadrupedBody.IRig, "poll" | "nose" | "headRadius">,
    profile: IProfile,
  ): IGeometry {
    if (
      !(profile.radius > 0 && profile.radius < 1) ||
      !(profile.back >= 0 && profile.back < 1)
    )
      throw new RangeError(
        "Nostrils need 0 < radius < 1 and 0 <= back < 1 of their head",
      );
    const span: IAutoMovieVector3 = Vector3.subtract(head.nose, head.poll);
    const length: number = Vector3.length(span);
    if (!(Number.isFinite(length) && length > 0))
      throw new RangeError(
        "Nostrils need a head with a finite positive length",
      );
    const along: IAutoMovieVector3 = Vector3.scale(span, 1 / length);
    const lateral: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross({ x: 0, y: 1, z: 0 }, along),
    );
    const radius: number = profile.radius * head.headRadius;
    const reach: number = head.headRadius - radius;
    const side = (sign: number): IAutoMovieVector3 => {
      const direction: IAutoMovieVector3 = Vector3.normalize(
        Vector3.add(
          Vector3.scale(lateral, sign),
          Vector3.scale(along, 1 - profile.back),
        ),
      );
      return Vector3.addScaled(head.nose, direction, reach);
    };
    return { left: side(1), right: side(-1), radius };
  }

  /**
   * Lay the nostrils as the parts `leftNostril` and `rightNostril`.
   *
   * @param builder The body under construction.
   * @param head The actual neutral head capsule.
   * @param profile The authored construction.
   * @param color The coat's colour.
   * @throws {RangeError} As `geometry` refuses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the parts laid and their zero share.
   * @evidence contracts/development/implementation.md#principled-implementation Two spheres at the geometry's centres; zero share since their volume is the head's own.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One geometry read, two balls.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No change to the head capsule.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two parts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `geometry`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The builder owns the parts.
   */
  export function lay<Id extends string, Dimension extends string>(
    builder: ArchetypeBuilder<Id, Dimension>,
    head: Pick<QuadrupedBody.IRig, "poll" | "nose" | "headRadius">,
    profile: IProfile,
    color: string,
  ): void {
    const pair: IGeometry = geometry(head, profile);
    builder.ball("leftNostril", pair.radius, pair.left, { color, share: 0 });
    builder.ball("rightNostril", pair.radius, pair.right, { color, share: 0 });
  }
}
