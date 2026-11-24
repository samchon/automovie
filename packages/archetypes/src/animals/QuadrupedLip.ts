import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeBuilder } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/**
 * A coarse upper lip laid inside the head capsule at the muzzle and hinged at
 * its root, so it can curl up.
 *
 * The lip is a capsule whose axis runs parallel to the head's over its muzzle
 * end, offset dorsally so that its upper side is tangent to the head capsule's
 * upper side. At rest it lies wholly inside the head, so the closed-mouth
 * silhouette and every existing head contact are unchanged; turning it dorsally
 * about its root lifts its free end above the muzzle, the flehmen's lip curl
 * (EquiFACS AU10, upper lip raiser). The root's place along the head and the
 * lip's radius are authored coarse construction, not measured anatomy. Its
 * tissue is the head capsule's own, so it carries no mass of its own: a share
 * of zero under the head's source share.
 */
export namespace QuadrupedLip {
  /** Authored lip construction as fractions of the head. */
  export interface IProfile {
    /** The lip capsule's radius over the head capsule's, in (0, 1). */
    radius: number;

    /**
     * The root's distance from the poll along poll to nose over the head's
     * length, in [0, 1).
     */
    root: number;
  }

  /** The lip's neutral geometry in the model's space. */
  export interface IGeometry {
    /** The root the lip curls about, the capsule's first cap centre. */
    root: IAutoMovieVector3;

    /** The free end at the muzzle, the capsule's second cap centre. */
    tip: IAutoMovieVector3;

    /** The capsule's radius, metres. */
    radius: number;
  }

  /**
   * The lip inside a head capsule.
   *
   * @param head The neutral head capsule: poll, nose and radius.
   * @param profile The authored lip construction.
   * @returns The lip's neutral geometry.
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
      !(profile.root >= 0 && profile.root < 1)
    )
      throw new RangeError(
        "A lip needs 0 < radius < 1 and 0 <= root < 1 of its head",
      );
    const span: IAutoMovieVector3 = Vector3.subtract(head.nose, head.poll);
    const length: number = Vector3.length(span);
    if (!(length > 0))
      throw new RangeError("A lip needs a head with a finite positive length");
    const along: IAutoMovieVector3 = Vector3.scale(span, 1 / length);

    // World up with its component along the head removed: the head's dorsal direction in its sagittal plane.
    const up: IAutoMovieVector3 = Vector3.normalize(
      Vector3.addScaled({ x: 0, y: 1, z: 0 }, along, -along.y),
    );
    const radius: number = profile.radius * head.headRadius;
    const offset: IAutoMovieVector3 = Vector3.scale(
      up,
      head.headRadius - radius,
    );
    return {
      root: Vector3.add(
        Vector3.addScaled(head.poll, along, profile.root * length),
        offset,
      ),
      tip: Vector3.add(head.nose, offset),
      radius,
    };
  }

  /**
   * Lay the lip capsule as the part `lip`.
   *
   * @param builder The body under construction.
   * @param head The neutral head capsule.
   * @param profile The authored lip construction.
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
    const lip: IGeometry = geometry(head, profile);
    builder.rod("lip", lip.radius, lip.root, lip.tip, {
      color,
      round: true,
      share: 0,
    });
  }
}
