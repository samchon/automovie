import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeBuilder } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/**
 * Two coarse nostrils laid inside the head capsule's nose cap, one to each
 * side, so breathing can flare them.
 *
 * Each nostril is a sphere centred on the nose cap's lateral side, inset so
 * that it is internally tangent to the cap: at rest it lies wholly inside the
 * head and the closed silhouette and every head contact are unchanged; widening
 * its radius pushes it out of the muzzle, the flare. Its radius and how far it
 * sits back from the nose are authored coarse construction, not measured
 * anatomy, and it carries no mass of its own: a share of zero under the head's
 * source share.
 */
export namespace QuadrupedNostrils {
  /** Authored nostril construction as fractions of the head. */
  export interface IProfile {
    /** Each nostril's radius over the head capsule's, in (0, 1). */
    radius: number;

    /**
     * How far back of the nose each sits, over the head capsule's radius, in
     * [0, 1).
     */
    back: number;
  }

  /** The nostrils' neutral centres and radius in the model's space. */
  export interface IGeometry {
    /** The left nostril's centre. */
    left: IAutoMovieVector3;

    /** The right nostril's centre. */
    right: IAutoMovieVector3;

    /** Each one's radius, metres. */
    radius: number;
  }

  /**
   * The nostrils inside a head capsule.
   *
   * @param head The neutral head capsule: poll, nose and radius.
   * @param profile The authored construction.
   * @returns Their neutral geometry.
   * @throws {RangeError} For fractions outside their ranges or a degenerate
   *   head.
   */
  export function geometry(
    head: Pick<
      AutoMovieArchetypeQuadrupedBody.IRig,
      "poll" | "nose" | "headRadius"
    >,
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
    if (!(length > 0))
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
   * @param head The neutral head capsule.
   * @param profile The authored construction.
   * @param color The coat's colour.
   * @throws {RangeError} As `geometry` refuses.
   */
  export function lay<Id extends string, Dimension extends string>(
    builder: AutoMovieArchetypeBuilder<Id, Dimension>,
    head: Pick<
      AutoMovieArchetypeQuadrupedBody.IRig,
      "poll" | "nose" | "headRadius"
    >,
    profile: IProfile,
    color: string,
  ): void {
    const pair: IGeometry = geometry(head, profile);
    builder.ball("leftNostril", pair.radius, pair.left, { color, share: 0 });
    builder.ball("rightNostril", pair.radius, pair.right, { color, share: 0 });
  }
}
