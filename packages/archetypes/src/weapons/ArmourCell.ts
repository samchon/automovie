import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { ArmourProfile } from "./ArmourProfile";

/**
 * Formula-defined convex wall cells; the shared core alone realizes their hulls.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines model-metre panel bounds and radial wall faces, with positive-volume refusal and caller-owned corner records.
 * @evidence contracts/development/design.md#principled-representation Cartesian intervals and one radial outer face define actual wall volumes without a second renderer, triangulator or mass solver.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Rectangular panels serve torso openings; radial faces serve current helmet and limb walls. Both return the same current builder cell record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither operation hulls a whole hollow object, accepts a zero wall or invents a physical thickness.
 */
export namespace ArmourCell {
  /**
   * A panel whose six bounds come from the shared profile's actual boundaries.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States stable part identity, model-metre lower/upper bounds, independent corners and nonpositive-volume refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The Cartesian product of three positive intervals is the exact panel; the core's shared convex-cell owner derives its hull, mass and collision.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the intervals and emit their Cartesian corners, without local triangulation or geometric search.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Empty panels refuse instead of disappearing; actual openings are omitted by the form owner rather than filled by an invisible box.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and eight fresh points per panel.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every torso, cuff and closure panel reuses this exact interval definition; hull and physical computations stay in core.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only independent scalar corner records escape, with no retained profile, source model or cache.
   */
  export function box(
    id: string,
    low: IAutoMovieVector3,
    high: IAutoMovieVector3,
  ): ArmourProfile.ICell {
    for (const axis of ["x", "y", "z"] as const)
      if (
        !(
          Number.isFinite(low[axis]) &&
          Number.isFinite(high[axis]) &&
          low[axis] < high[axis]
        )
      )
        throw new RangeError(`Armour ${id} requires a positive finite panel`);
    const points: IAutoMovieVector3[] = [];
    for (const x of [low.x, high.x])
      for (const y of [low.y, high.y])
        for (const z of [low.z, high.z]) points.push({ x, y, z });
    return { id, points };
  }

  /**
   * A radial wall between one planar outer face and a parallel inner face.
   *
   * @param cavity A fitted spherical/circular cavity's exact minimum plane distance; absent for an inward plate offset.
   * @param course Radial faces may scale all coordinates; axial/annular faces preserve their Y endpoints. An annulus retains its independent outer rim.
   * @evidence contracts/development/common.md#meaningful-documentation States outer face/cell identity, model-metre centre, positive wall, optional exact cavity support and refusal of degenerate or incompatible walls.
   * @evidence contracts/development/implementation.md#principled-implementation The outer face's normal gives its distance d from the centre. A fitted wall places its outer plane at cavity+wall and inner plane at cavity, so actual normal gauge and padding remain exact; an annulus retains its source rim and its independent vertical gauge. Unfitted faces offset inward by wall.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Derive one plane using engine vector operations, admit its positive radial interval and return the face with its scaled inner corners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Incompatible thin walls refuse rather than crossing the body, stretching the outer envelope, changing padding or dropping a cell.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the three or four supplied corners, with constant plane arithmetic and fresh output.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Helmet and limb forms share this wall construction; engine Vector3 owns vector arithmetic and core owns the single hull realization.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Copies outer and inner corners into the returned cell, retaining no caller face, profile, completed hull or external resource.
   */
  export function radial(
    id: string,
    outer: readonly IAutoMovieVector3[],
    centre: IAutoMovieVector3,
    wall: number,
    cavity?: number,
    course: "radial" | "axis" | "annulus" = "radial",
  ): ArmourProfile.ICell {
    const a: IAutoMovieVector3 = Vector3.subtract(outer[1]!, outer[0]!);
    const b: IAutoMovieVector3 = Vector3.subtract(outer[2]!, outer[0]!);
    const cross: IAutoMovieVector3 = Vector3.cross(a, b);
    const length: number = Math.hypot(cross.x, cross.y, cross.z);
    const distance: number =
      Math.abs(Vector3.dot(cross, Vector3.subtract(outer[0]!, centre))) /
      length;
    const outward: number =
      cavity === undefined || course === "annulus"
        ? 1
        : (cavity + wall) / distance;
    const factor: number =
      cavity === undefined
        ? (distance - wall) / distance
        : cavity / (distance * outward);
    if (!(Number.isFinite(factor) && factor > 0 && factor < 1 && wall > 0))
      throw new RangeError(
        `Armour ${id} cannot retain its cavity inside the actual wall`,
      );
    return {
      id,
      points: [
        ...outer.map(
          (point: IAutoMovieVector3): IAutoMovieVector3 =>
            scale(point, outward),
        ),
        ...outer.map(
          (point: IAutoMovieVector3): IAutoMovieVector3 =>
            scale(point, outward * factor),
        ),
      ],
    };

    /** The axial course's independently measured segment length never scales. */
    function scale(
      point: IAutoMovieVector3,
      factorValue: number,
    ): IAutoMovieVector3 {
      const moved: IAutoMovieVector3 = Vector3.add(
        centre,
        Vector3.scale(Vector3.subtract(point, centre), factorValue),
      );
      return course === "radial" ? moved : { ...moved, y: point.y };
    }
  }
}
