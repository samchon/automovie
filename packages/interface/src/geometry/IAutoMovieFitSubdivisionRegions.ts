import type { IAutoMovieSubdivisionCage } from "./IAutoMovieSubdivisionCage";
import type { IAutoMovieSubdivisionLevel } from "./IAutoMovieSubdivisionLevel";

/**
 * Disjoint source-face fits composed on the joined subdivision domain.
 *
 * Source face and vertex identities survive local crop solves; positions retain
 * cage-local metres and indexed UVs refine globally. The producer checks levels
 * 2 through 6, nonempty disjoint regions and constraint membership; caller
 * checks still cover measurements, intersections and poses.
 */
export namespace IAutoMovieFitSubdivisionRegions {
  /**
   * Disjoint geometric regions to fit on their actual joined subdivision
   * domain.
   *
   * Every region receives four edge-adjacent face rings of support: two are the
   * two-step refinement support and two retain the limit one-ring. The collar's
   * controls and the exterior refined surface are anchored. Local-to-global
   * vertex identity is followed through exact edge/face subdivision identities,
   * never spatial welding. Only solved control deltas are composed into the
   * globally refined original cage, so artificial crop boundaries cannot
   * replace the joined surface. Original indexed UVs and source-face parameters
   * refine globally once and never pass through a value-based UV repacker.
   *
   * Regions must be disjoint source-face sets; shared boundaries are exterior
   * anchors for both. Constraints must lie on their region's source vertices.
   * Support creases preserve their actual refinement; active target fans with
   * interior sharp edges are refused by the domain fitter. The fit result still
   * requires the caller's physical measurement, intersection and pose checks.
   *
   * Input arrays, maps and sets are borrowed synchronously. The producer
   * validates nonempty disjoint face sets and constraint membership, applies
   * cage admission and propagates each domain fitter's refusal; it retains no
   * caller collections.
   */
  export type IProps = {
    /** Joined original controls and indexed face-varying UV topology, metres. */
    cage: IAutoMovieSubdivisionCage;

    /** Render refinements relative to the source cage, integer 2–6; omitted, 2. */
    levels?: number;

    /**
     * Borrowed nonempty disjoint source-face regions; an empty region list
     * simply returns the uniformly refined original cage with zero fitting
     * residual.
     */
    regions: ReadonlyArray<{
      /**
       * Source face identities permitted to change; regions may share only
       * boundaries.
       */
      faces: ReadonlySet<number>;

      /**
       * Initial local-metre generating samples by source vertex; omitted keys
       * use original cage positions. These samples define the frozen fitting
       * metric, not hard equality targets.
       */
      samples: ReadonlyMap<number, readonly [number, number, number]>;

      /**
       * Independent finite local-metre hard limit targets by source vertex;
       * omitted keys impose no limit equation.
       */
      limitTargets: ReadonlyMap<number, readonly [number, number, number]>;

      /**
       * Source control vertices pinned to original positions; the producer
       * additionally anchors the support collar and shared region boundaries.
       */
      anchors: ReadonlySet<number>;
    }>;
  };

  /**
   * The globally joined fitted generating level and the largest local solve
   * residual. All output level arrays are generated for this call; zero regions
   * still refine the original cage to the requested level.
   */
  export type IResult = {
    /**
     * New joined generating level at the requested refinement depth, with
     * globally refined UV identities and source-face parameters; cage-local
     * metre positions contain composed fit deltas.
     */
    level: IAutoMovieSubdivisionLevel;

    /**
     * Largest domain-fitter row violation across regions and coordinate solves,
     * in metre-valued row units; zero for no regions and not a final surface or
     * pose validation.
     */
    maximumEqualityError: number;
  };
}
