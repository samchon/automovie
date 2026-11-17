import type { IAutoMovieConvexSupportLoft } from "../model/IAutoMovieConvexSupportLoft";
import type { IAutoMovieEmitSupportLoft64 } from "./IAutoMovieEmitSupportLoft64";

/**
 * Data and callback contracts shared by the RealizeConvexSupportLoft operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Metre support coefficients and tolerances define an open lateral mesh with numerical event and interval counts. The fixed binary64 qualification explicitly denies certified event isolation; numeric budgets and enclosing support directions require runtime checks.
 * @evidence contracts/development/design.md#principled-representation Metre support coefficients and tolerances define an open lateral mesh with numerical event and interval counts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface realizeAutoMovieConvexSupportLoft admits the recipe and budgets, then extends the canonical support-loft emission result.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The fixed binary64 qualification explicitly denies certified event isolation; numeric budgets and enclosing support directions require runtime checks.
 */
export namespace IAutoMovieRealizeConvexSupportLoft {
  /**
   * Generate a new open lateral mesh from compact cubic support coefficients.
   * Sections intersect fixed oriented unit half-planes in XZ. Feasible algebraic
   * boundary events preserve changes in active constraints; they are not physical
   * branch or cavity observations. Native binary64 root/incidence classification
   * remains numerical, with explicit refusal for unresolved charts and budgets.
   * Normals come from the same face equations; caps and interior are not emitted.
   * The face chord bound covers interpolation within the numerical partition,
   * separately from uncertified event isolation, boundary roundoff and source fit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Metre support coefficients and tolerances define an open lateral mesh with numerical event and interval counts. The fixed binary64 qualification explicitly denies certified event isolation; numeric budgets and enclosing support directions require runtime checks.
   * @evidence contracts/development/design.md#principled-representation Metre support coefficients and tolerances define an open lateral mesh with numerical event and interval counts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface realizeAutoMovieConvexSupportLoft admits the recipe and budgets, then extends the canonical support-loft emission result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The fixed binary64 qualification explicitly denies certified event isolation; numeric budgets and enclosing support directions require runtime checks.
   */
  export type IInput = {
    /** Complete metre-valued cubic support recipe; the realizer admits unit XZ normals, enclosing directions, adjacent station spans and exact shared endpoint coefficients. */
    loft: IAutoMovieConvexSupportLoft;
    /** Nonblank physical-instance identity namespace for newly generated support-loft vertices. */
    topologyDomain: string;
    /** Finite positive requested ruled-face interpolation bound in metres, conditional on the numerically constructed event partition. */
    tolerance: number;
    /** Positive safe-integer cap on supplied support planes; at least three planes are required to enclose a section. */
    maxPlanes: number;
    /** Nonnegative safe-integer cap on feasible interior numerical event stations; zero permits no added interior event station. */
    maxEvents: number;
    /** Positive safe-integer bound on planned ruled-face strips across all spans; exhaustion throws before mesh allocation. */
    maxCells: number;
    /** Positive safe-integer cap on emitted render vertices; exhaustion refuses the generation rather than publishing a partial successful mesh. */
    maxVertices: number;
    /** Finite dimensionless threshold strictly between 0 and 1 for usable pairwise normal determinants; near-parallel support directions below it cannot define a curve. */
    minimumDirectionSine: number;
  };

  /**
   * Generate a new open lateral mesh from compact cubic support coefficients.
   * Sections intersect fixed oriented unit half-planes in XZ. Feasible algebraic
   * boundary events preserve changes in active constraints; they are not physical
   * branch or cavity observations. Native binary64 root/incidence classification
   * remains numerical, with explicit refusal for unresolved charts and budgets.
   * Normals come from the same face equations; caps and interior are not emitted.
   * The face chord bound covers interpolation within the numerical partition,
   * separately from uncertified event isolation, boundary roundoff and source fit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Support-loft emission adds numerical event/interval counts, a metre face-chord bound and a literal numerical qualification. The fixed qualification denies certified event isolation even when face interpolation meets its conditional bound.
   * @evidence contracts/development/design.md#principled-representation Support-loft emission adds numerical event/interval counts, a metre face-chord bound and a literal numerical qualification.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The realizer extends IAutoMovieEmitSupportLoft64.IResult rather than copying its geometry fields.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The fixed qualification denies certified event isolation even when face interpolation meets its conditional bound.
   */
  export type IResult = IAutoMovieEmitSupportLoft64.IResult & {
    /** Number of retained feasible interior event stations in the algebraic plan, excluding span endpoints. */
    events: number;
    /** Total adjacent event-station intervals across all polynomial spans. */
    intervals: number;
    /** Requested tolerance in metres used to plan ruled-face interpolation; it excludes event-isolation error, boundary roundoff and source-fit error. */
    faceChordBoundMeters: number;
    /** Explicitly marks event roots and incidence as binary64 numerical construction, with no certified isolation claim. */
    eventQualification: "binary64-numerical-not-certified";
  };
}
