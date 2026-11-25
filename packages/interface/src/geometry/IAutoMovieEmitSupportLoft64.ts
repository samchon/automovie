import type { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import type { IAutoMovieConstructionPolyline } from "../render/IAutoMovieConstructionPolyline";
import type { IAutoMovieSupportLoftPlan64 } from "./IAutoMovieSupportLoftPlan64";

/**
 * Mesh and construction emission from a planned cubic support loft.
 *
 * Positions and boundary disagreement are model-local metres; analytic normals
 * are unit vectors, and physical incidence is distinct from normal-fan
 * identity. The caller supplies an admitted plan, nonblank topology domain and
 * positive safe-integer vertex budget; emission refuses exhausted budgets,
 * collapsed sections, nonfinite normals and unresolved boundary disagreement.
 */
export namespace IAutoMovieEmitSupportLoft64 {
  /**
   * A planned ruled support surface and the identity/budget needed for
   * emission. A face nx X + nz Z = h(Y) has outward normal (nx,-dh/dY,nz),
   * including a vanishing edge endpoint where a tensor-chart derivative would
   * collapse. Plane-pair identity and algebraic event incidence own shared
   * positions; distinct faces retain their normal fans. Exact collapsed
   * triangles are omitted. Endpoint roundoff is checked separately from the
   * requested chord tolerance.
   */
  export type IInput = {
    /**
     * Borrowed completed plan from planAutoMovieSupportLoft64; its local metre
     * fields, incidence and strip counts must remain unchanged during
     * emission.
     */
    plan: IAutoMovieSupportLoftPlan64;

    /**
     * Nonblank physical-source namespace, admitted by the enclosing realization
     * caller and copied into each mesh source identity.
     */
    topologyDomain: string;

    /**
     * Caller-admitted positive safe-integer cap on emitted render vertices,
     * including separate normal fans; each interval checks its required
     * allocation before appending.
     */
    maxVertices: number;
  };

  /**
   * The emitted lateral mesh, generating construction and numerical boundary
   * diagnostics from one completed plan.
   *
   * The returned mesh and construction belong to the caller. Construction point
   * tuples can alias one another across shared stations, whereas mesh positions
   * are copied numbers. The mesh has open ends; successful emission is not a
   * certificate of source fit or event isolation.
   */
  export type IResult = {
    /**
     * New mutable open lateral mesh in model-local metres with analytic unit
     * normals and physical vertex correspondence; UVs and skin are null and
     * caps are absent.
     */
    mesh: IAutoMovieMesh;

    /**
     * Sampled generating boundaries and endpoint sections; lists are new, while
     * point tuples can be shared between construction curves at identical
     * physical stations.
     */
    construction: IAutoMovieConstructionPolyline.IMutable[];

    /**
     * Largest Euclidean discrepancy between repeated evaluations of one
     * canonical physical boundary vertex, metres; zero if none disagree. This
     * measures roundoff, not the chord tolerance.
     */
    maximumBoundaryDefectMeters: number;

    /**
     * Count of proposed triangles omitted because two corners name the same
     * physical source; it does not count every geometrically collinear
     * triangle.
     */
    omittedCollapsedTriangles: number;
  };
}
