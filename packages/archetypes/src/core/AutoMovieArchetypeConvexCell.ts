import {
  buildAutoMoviePolyhedron,
  physicalHullFaces,
  physicalHullMass,
} from "@automovie/engine";
import type {
  IAutoMovieMeshGeometry,
  IAutoMoviePhysicalHullFaces,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * An explicitly authored convex volume shared by appearance, mass and contact.
 * A shell consists of separate wall cells; the empty interior is never hulled.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines cell ownership, local SI units, shared geometry and the distinction between one convex wall and a hollow assembly.
 * @evidence contracts/development/design.md#principled-representation One copied local point set supplies the engine hull, its visible closed boundary and its uniform-solid mass properties. Part TRS places all three together.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The builder produces cells; mass, collision and placed assemblies read the same records. There is no mesh inference or object-kind registry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A cell is a convex solid, never the convex envelope of an entire concave or hollow object. Input and output geometry ownership is explicit.
 */
export namespace AutoMovieArchetypeConvexCell {
  /**
   * Local cells by their visible model part ids.
   * @evidence contracts/development/common.md#meaningful-documentation Names the model-scoped keys and immutable producer ownership.
   * @evidence contracts/development/design.md#principled-representation A read-only correspondence from a real part id to its admitted local cell, independent of that part's current rigid placement.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Builder, mass, collision, repose and placed assemblies share this same record type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent entry does not infer a cell from an arbitrary mesh; geometry identity is checked by each consuming owner.
   */
  export type Table = ReadonlyMap<string, ICell>;

  /**
   * An admitted local cell, owned immutably with its model after construction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives each field's frame, units, ownership and consumer.
   * @evidence contracts/development/design.md#principled-representation The exact visible mesh and hull share one generating boundary, while volume and principal mass data come from that same hull.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Geometry identifies the corresponding part, points feed collision, and the remaining local mass data feed the existing composite-mass owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No bounding proxy, guessed density or absolute mass is stored; the producer still supplies the measured total mass.
   */
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
   * @param input Finite local corners in metres, spanning positive volume.
   * @returns Independently owned points, visible mesh and local mass data.
   * @throws {Error} For insufficient/nonfinite points, zero volume or unrepresentable local mass data.
   * @evidence contracts/development/common.md#meaningful-documentation States local units, copied inputs, positive finite domain and failure behavior.
   * @evidence contracts/development/implementation.md#principled-implementation Existing physicalHullFaces owns supporting planes and their relative conditioning tolerance. Its same outward loops feed buildAutoMoviePolyhedron, and physicalHullMass integrates that hull and supplies its principal frame. The caller declares that this convex volume is a wall cell.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Copy/admit corners, obtain shared hull and integrated properties, admit representability, then build its visible boundary.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Rejects degenerate/nonfinite cells, never adds thickness, changes points, closes a whole shell or fabricates a physical proxy. The visible model retains the source coordinates in ordinary number arrays; renderer upload precision remains its owner's unchanged responsibility.
   * @evidence contracts/development/implementation.md#efficient-algorithms One engine hull search per V-point cell, followed by linear face integration/emission. V is the producer's small wall-cell corner set; no operation tessellates a whole shell into a hull.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same owned point-array identity reuses physicalHullFaces' weak memo for mass integration; geometry, collision and mass retain this one admitted cell.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns owned point/mesh buffers and scalar records for the model lifetime. No resource, input-array reference or global registry is retained.
   */
  export function of(input: readonly IAutoMovieVector3[]): ICell {
    if (input.length < 4)
      throw new Error("A convex cell needs at least four finite corners");
    const points: IAutoMovieVector3[] = input.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 => {
        if (
          !Number.isFinite(point.x) ||
          !Number.isFinite(point.y) ||
          !Number.isFinite(point.z)
        )
          throw new Error("A convex cell needs finite local corners");
        return { ...point };
      },
    );
    const hull: IAutoMoviePhysicalHullFaces.IHull = physicalHullFaces(points);
    const mass: ReturnType<typeof physicalHullMass> = physicalHullMass(points);
    if (
      !(Number.isFinite(mass.volume) && mass.volume > 0) ||
      ![mass.centerOfMass.x, mass.centerOfMass.y, mass.centerOfMass.z].every(
        (value: number): boolean => Number.isFinite(value),
      ) ||
      ![mass.inertia.x, mass.inertia.y, mass.inertia.z].every(
        (value: number): boolean => Number.isFinite(value) && value > 0,
      )
    )
      throw new Error(
        "A convex cell needs representable positive local mass data",
      );
    return {
      points,
      geometry: {
        type: "mesh",
        mesh: buildAutoMoviePolyhedron(
          hull.faces.map(
            (
              face: IAutoMoviePhysicalHullFaces.IFace,
            ): readonly IAutoMovieVector3[] => face.loop,
          ),
        ),
      },
      volume: mass.volume,
      centroid: mass.centerOfMass,
      unit: mass.inertia,
      inertiaRotation: mass.inertiaRotation,
    };
  }
}
