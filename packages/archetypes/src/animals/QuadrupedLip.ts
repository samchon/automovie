import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeBuilder } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/**
 * A coarse upper lip laid inside the actual head capsule at the muzzle and hinged at its root, so it can curl up.
 *
 * The lip is a capsule whose axis runs parallel to the head's over its muzzle end, offset dorsally so that its upper side is tangent to the head capsule's upper side. At rest it lies wholly inside the head, so the closed-mouth silhouette and every existing head contact are unchanged; turning it dorsally about its root lifts its free end above the muzzle, the flehmen's lip curl (EquiFACS AU10, upper lip raiser). The root's place along the head and the lip's radius are authored coarse construction, not measured anatomy. Its tissue is the head capsule's own, so it carries no mass of its own: a share of zero under the head's source share.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the actual head frame, the dorsal offset, the tangency that keeps the rest silhouette, the authored root and radius and the zero share.
 * @evidence contracts/development/design.md#principled-representation Two fractions of the actual head determine the lip: its radius over the head's and its root's distance along poll to nose over the head's length.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Optional body data, one geometry reader and one lay operation serve the head assembler and the expression layer that curls the lip.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No species case or measured-looking constant: both fractions are authored and stated as such by the producer that supplies them.
 */
export namespace QuadrupedLip {
  /**
   * Authored lip construction as fractions of the actual head.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both members are dimensionless fractions with their admitted ranges.
   * @evidence contracts/development/design.md#principled-representation Fractions of the head keep the lip proportional to whatever head a species lays.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two values the geometry reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No absolute size: the lip cannot outgrow the head it is laid in.
   */
  export interface IProfile {
    /** The lip capsule's radius over the head capsule's, in (0, 1). */
    radius: number;

    /** The root's distance from the poll along poll to nose over the head's length, in [0, 1). */
    root: number;
  }

  /**
   * The lip's actual neutral geometry in the model's space.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Metres in model space: the root, the free end and the radius.
   * @evidence contracts/development/design.md#principled-representation The capsule's two cap centres and radius.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the lay operation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IGeometry {
    /** The root the lip curls about, the capsule's first cap centre. */
    root: IAutoMovieVector3;

    /** The free end at the muzzle, the capsule's second cap centre. */
    tip: IAutoMovieVector3;

    /** The capsule's radius, metres. */
    radius: number;
  }

  /**
   * The lip inside an actual head capsule.
   *
   * @param head The actual neutral head capsule: poll, nose and radius.
   * @param profile The authored lip construction.
   * @returns The lip's neutral geometry.
   * @throws {RangeError} For fractions outside their ranges or a degenerate head.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the output frame and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The dorsal unit vector is world up with its component along the head axis removed. Offsetting the axis by R minus r along it makes the lip capsule internally tangent to the head capsule's upper side, so it lies inside the head at rest.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, build the head's axis and dorsal direction, offset both cap centres.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Out-of-range fractions refuse; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant vector arithmetic.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by `lay`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh points and retains nothing.
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
    if (!(Number.isFinite(length) && length > 0))
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
   * @param head The actual neutral head capsule.
   * @param profile The authored lip construction.
   * @param color The coat's colour.
   * @throws {RangeError} As `geometry` refuses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the part laid, its geometry owner and its zero share.
   * @evidence contracts/development/implementation.md#principled-implementation One capsule from root to tip; its share is zero because its volume is the head capsule's own, already weighed by the head's source share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One geometry read and one rod.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No second weighing of the head's tissue and no change to the head capsule.
   * @evidence contracts/development/implementation.md#efficient-algorithms One part.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `geometry`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The builder owns the part.
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
