import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { ArmourProfile } from "./ArmourProfile";

/*
 * Formula-defined convex wall cells; the shared core alone realizes their
 * hulls.
 */
export namespace ArmourCell {
  /*
   * A panel whose six bounds come from the shared profile's boundaries.
   */
  export function box(
    id: string,
    low: IAutoMovieVector3,
    high: IAutoMovieVector3,
  ): ArmourProfile.ICell {
    for (const axis of ["x", "y", "z"] as const)
      if (!(low[axis] < high[axis]))
        throw new RangeError(`Armour ${id} requires a positive finite panel`);
    const points: IAutoMovieVector3[] = [];
    for (const x of [low.x, high.x])
      for (const y of [low.y, high.y])
        for (const z of [low.z, high.z]) points.push({ x, y, z });
    return { id, points };
  }

  /*
   * The least centre-to-face distance of one complete authored outer course.
   */
  export function minimumDistance(
    faces: Iterable<readonly IAutoMovieVector3[]>,
    centre: IAutoMovieVector3,
  ): number {
    let minimum: number = Infinity;
    for (const face of faces) {
      const support: number = distance(face, centre);
      if (!(support > 0))
        throw new RangeError(
          "Armour outer course requires positive face support",
        );
      minimum = Math.min(minimum, support);
    }
    if (minimum === Infinity)
      throw new RangeError("Armour outer course requires at least one face");
    return minimum;
  }

  /*
   * A radial wall between one planar outer face and a parallel inner face.
   * Parameter cavity: A fitted spherical/circular cavity's exact minimum plane
   * distance; absent for an inward plate offset.
   * Parameter course: Radial faces may scale all coordinates; axial faces preserve
   * Y endpoints. A lattice is already placed at cavity+wall and shares one
   * global inner ratio.
   * Parameter minimum: The entire unfitted course's least positive face support;
   * its shared homothety makes wall a minimum authored normal gauge, not a
   * uniform specimen measurement.
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
    if (!(factor > 0 && factor < 1 && wall > 0))
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

    /*
     * The axial course's independently measured segment length never scales.
     */
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

  /*
   * The planar face's positive distance from the course's common centre.
   */
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
