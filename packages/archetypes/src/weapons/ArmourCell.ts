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
   * The least centre-to-face distance of one complete authored outer course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Takes actual planar outer faces and their shared model-metre centre; returns their least positive support or refuses an empty/degenerate course.
   * @evidence contracts/development/implementation.md#principled-implementation Plane normals from each actual face give its centre distance d. A shared inner factor 1-wall/min(d) then keeps all adjoining corners identical and every face's normal gauge at least wall.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reduce the already prepared course's positive plane distances once; callers retain their outer faces for cell construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the actual authored course rather than an ellipse radius proxy, sampled hull, guessed gauge or relaxed contact tolerance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the bounded course's face count with constant arithmetic per face and constant auxiliary storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Helmet and limb courses share this support law and the same plane-distance primitive used by radial walls; each caller evaluates its distinct canonical faces once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar without retaining input faces, profiles, hulls or external resources.
   */
  export function minimumDistance(
    faces: Iterable<readonly IAutoMovieVector3[]>,
    centre: IAutoMovieVector3,
  ): number {
    let minimum: number = Infinity;
    for (const face of faces) {
      const support: number = distance(face, centre);
      if (!(Number.isFinite(support) && support > 0))
        throw new RangeError("Armour outer course requires positive face support");
      minimum = Math.min(minimum, support);
    }
    if (!Number.isFinite(minimum))
      throw new RangeError("Armour outer course requires at least one face");
    return minimum;
  }

  /**
   * A radial wall between one planar outer face and a parallel inner face.
   *
   * @param cavity A fitted spherical/circular cavity's exact minimum plane distance; absent for an inward plate offset.
   * @param course Radial faces may scale all coordinates; axial faces preserve Y endpoints. A lattice is already placed at cavity+wall and shares one global inner ratio.
   * @param minimum The entire unfitted course's least positive face support; its shared homothety makes wall a minimum authored normal gauge, not a uniform specimen measurement.
   * @evidence contracts/development/common.md#meaningful-documentation States outer face/cell identity, model-metre centre, positive wall, optional exact cavity support and refusal of degenerate or incompatible walls.
   * @evidence contracts/development/implementation.md#principled-implementation The outer face's normal gives its distance d from the centre. Axial fitted walls place their planes at cavity+wall and cavity. A globally aligned fitted lattice scales its inner course by cavity/(cavity+wall), preserving shared edges and exact normal gauge. An unfitted course uses 1-wall/minimum for every face, retaining shared inner edges and at least the authored gauge; a standalone face defaults to its own support.
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
    course: "radial" | "axis" | "lattice" = "radial",
    minimum?: number,
  ): ArmourProfile.ICell {
    const support: number = distance(outer, centre);
    const outward: number =
      cavity === undefined || course === "lattice"
        ? 1
        : (cavity + wall) / support;
    const factor: number =
      cavity === undefined
        ? 1 - wall / (minimum ?? support)
        : course === "lattice"
          ? cavity / (cavity + wall)
          : cavity / (support * outward);
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
      return course === "axis" ? { ...moved, y: point.y } : moved;
    }
  }

  /** The actual planar face's positive distance from the course's common centre. */
  function distance(
    face: readonly IAutoMovieVector3[],
    centre: IAutoMovieVector3,
  ): number {
    const normal: IAutoMovieVector3 = Vector3.cross(
      Vector3.subtract(face[1]!, face[0]!),
      Vector3.subtract(face[2]!, face[0]!),
    );
    return (
      Math.abs(Vector3.dot(normal, Vector3.subtract(face[0]!, centre))) /
      Math.hypot(normal.x, normal.y, normal.z)
    );
  }
}
