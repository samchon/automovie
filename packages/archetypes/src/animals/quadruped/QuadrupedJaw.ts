import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeBuilder } from "../../core";
import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";

/**
 * A coarse mandible laid inside the head capsule and hinged at an authored
 * temporomandibular point.
 *
 * The jaw is a capsule whose axis runs parallel to the head's, offset ventrally
 * so that its underside is tangent to the head capsule's underside. At rest it
 * lies wholly inside the head, so the closed-mouth silhouette and every
 * existing head contact are unchanged; opening it about its hinge drops the
 * chin below the head. The hinge's place along the head and the jaw's radius
 * are authored coarse construction, not measured mandible anatomy. The jaw is
 * tissue already inside the head capsule's volume, so it carries no mass of its
 * own: a share of zero under the head's source share.
 */
export namespace QuadrupedJaw {
  /** Authored jaw construction as fractions of the head. */
  export interface IProfile {
    /** The jaw capsule's radius over the head capsule's, in (0, 1). */
    radius: number;

    /**
     * The hinge's distance from the poll along poll to nose over the head's
     * length, in [0, 1).
     */
    hinge: number;
  }

  /** The jaw's neutral geometry in the model's space. */
  export interface IGeometry {
    /** The temporomandibular hinge, the capsule's upper cap centre. */
    hinge: IAutoMovieVector3;

    /** The chin, the capsule's lower cap centre. */
    chin: IAutoMovieVector3;

    /** The capsule's radius, metres. */
    radius: number;

    /** The unit lateral axis the jaw opens about, pointing to the animal's left. */
    axis: IAutoMovieVector3;
  }

  /**
   * The jaw inside a head capsule.
   *
   * @param head The neutral head capsule: poll, nose and radius.
   * @param profile The authored jaw construction.
   * @returns The jaw's neutral geometry.
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
      !(profile.hinge >= 0 && profile.hinge < 1)
    )
      throw new RangeError(
        "A jaw needs 0 < radius < 1 and 0 <= hinge < 1 of its head",
      );
    const span: IAutoMovieVector3 = Vector3.subtract(head.nose, head.poll);
    const length: number = Vector3.length(span);
    if (!(length > 0))
      throw new RangeError("A jaw needs a head with a finite positive length");
    const along: IAutoMovieVector3 = Vector3.scale(span, 1 / length);

    // World down with its component along the head removed: the head's ventral direction in its sagittal plane.
    const down: IAutoMovieVector3 = Vector3.normalize(
      Vector3.addScaled({ x: 0, y: -1, z: 0 }, along, along.y),
    );
    const radius: number = profile.radius * head.headRadius;
    const offset: IAutoMovieVector3 = Vector3.scale(
      down,
      head.headRadius - radius,
    );
    return {
      hinge: Vector3.add(
        Vector3.addScaled(head.poll, along, profile.hinge * length),
        offset,
      ),
      chin: Vector3.add(head.nose, offset),
      radius,
      axis: Vector3.normalize(Vector3.cross(along, down)),
    };
  }

  /**
   * Lay the jaw capsule as the part `jaw`.
   *
   * @param builder The body under construction.
   * @param head The neutral head capsule.
   * @param profile The authored jaw construction.
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
    const jaw: IGeometry = geometry(head, profile);
    builder.rod("jaw", jaw.radius, jaw.hinge, jaw.chin, {
      color,
      round: true,
      share: 0,
    });
  }
}
