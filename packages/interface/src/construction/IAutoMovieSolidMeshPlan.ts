import type { IAutoMovieSolidMeshConstraints } from "./IAutoMovieSolidMeshConstraints";

/** Data and callback contracts shared by the SolidMeshPlan operations. */
export namespace IAutoMovieSolidMeshPlan {
  /**
   * An oriented triangle, with its actual native-cover occurrence at each
   * corner.
   */
  export interface ITriangle {
    /** Original shared mesh indices in positive native-chart order. */
    vertices: [number, number, number];

    /** Integer phase periods added at each corner, beginning at zero. */
    lifts: [number, number, number];
  }

  /** A completed index plan and the original constraints' subdivision history. */
  export interface IPlan {
    /** Positive native-chart triangle occurrences. */ triangles: IAutoMovieSolidMeshPlan.ITriangle[];
    /** Subdivided original constraints with source-edge provenance. */ constraints: IAutoMovieSolidMeshConstraints.IEdge[];
  }
}
