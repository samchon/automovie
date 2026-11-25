import { buildAutoMovieConvexHull, physicalHullMass } from "@automovie/engine";
import type {
  IAutoMovieMeshGeometry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * An explicitly authored convex volume shared by appearance, mass and contact.
 * A shell consists of separate wall cells; the empty interior is never hulled.
 */
export namespace AutoMovieArchetypeConvexCell {
  /** Local cells by their visible model part ids. */
  export type Table = ReadonlyMap<string, ICell>;

  /** An admitted local cell, owned immutably with its model after construction. */
  export interface ICell {
    /** Owned local corners in metres; consumers do not mutate them. */
    readonly points: readonly IAutoMovieVector3[];
    /** Visible closed boundary; its identity binds this record to its part. */
    readonly geometry: IAutoMovieMeshGeometry;
    /** Uniform local volume in cubic metres. */
    readonly volume: number;
    /** Centroid in cell-local metres. */
    readonly centroid: IAutoMovieVector3;
    /** Principal central moments per unit mass in square metres. */
    readonly unit: IAutoMovieVector3;
    /** Unit rotation from principal axes to the local point frame. */
    readonly inertiaRotation: IAutoMovieQuaternion;
  }

  /**
   * Admit one real convex cell and derive all its consumers' local data once.
   *
   * @param input Finite local corners in metres, spanning positive volume.
   * @returns Independently owned points, visible mesh and local mass data.
   * @throws {Error} For insufficient/nonfinite points, zero volume or
   *   unrepresentable local mass data.
   */
  export function of(input: readonly IAutoMovieVector3[]): ICell {
    if (input.length < 4)
      throw new Error("A convex cell needs at least four finite corners");
    const points: IAutoMovieVector3[] = input.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 => {
        return { ...point };
      },
    );
    const mass: ReturnType<typeof physicalHullMass> = physicalHullMass(points);
    if (
      !(mass.volume > 0) ||
      ![mass.inertia.x, mass.inertia.y, mass.inertia.z].every(
        (value: number): boolean => value > 0,
      )
    )
      throw new Error(
        "A convex cell needs representable positive local mass data",
      );
    return {
      points,
      geometry: { type: "mesh", mesh: buildAutoMovieConvexHull(points) },
      volume: mass.volume,
      centroid: mass.centerOfMass,
      unit: mass.inertia,
      inertiaRotation: mass.inertiaRotation,
    };
  }
}
