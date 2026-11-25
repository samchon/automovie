import type { IAutoMovieMesh } from "../../model/IAutoMovieMesh";
import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { IAutoMovieCubicBezierCurve64 } from "./IAutoMovieCubicBezierCurve64";

/**
 * Oriented cubic section curves and explicit contour incidence in one physical
 * chart. Coordinates and terminals are millimetres; the generated mesh uses
 * metres. Events name section-loop relationships, never source mesh addresses.
 * Sections must have increasing coordinates and use one consistent
 * cutting-plane orientation. Optional explicit intervals own ordinary
 * continuation; absent them, legacy intervals use nearest geometric
 * continuation. Declared events own every topology change. This representation
 * neither identifies anatomical equations nor certifies a surface without
 * folds.
 */
export interface IAutoMovieContourLoft64 {
  /** Ordered physical section coordinates and their oriented closed curves. */
  sections: readonly IAutoMovieContourLoft64.ISection[];

  /**
   * Explicit topology relationships with incident loops on both sides of each
   * critical level.
   */
  events: readonly IAutoMovieContourLoft64.IEvent[];

  /**
   * Optional complete adjacency partition. When supplied, every adjacent
   * saved-section pair and every loop must occur exactly once; no nearest
   * continuation fills missing relationships.
   */
  intervals?: readonly IAutoMovieContourLoft64.IInterval[];

  /**
   * Explicitly measure strip-search elapsed time; omitted or false leaves
   * elapsedMs null. Mesh and qualification arithmetic do not depend on this
   * observation.
   */
  observeWork?: boolean;

  /**
   * Positive chord-error tolerance for cubic tessellation, millimetres; not a
   * surface-error bound.
   */
  chordToleranceMm: number;
}

/** Data and callback contracts shared by the ContourLoft64 operations. */
export namespace IAutoMovieContourLoft64 {
  /**
   * Explicit source-independent continuation between adjacent physical cuts.
   * Each loop belongs to exactly one group. Unsupported groups remain local
   * gaps, including a zero-boundary unsupported group for an active hidden
   * component and open-contour or critical-cluster evidence retained by the
   * observation producer. A supported flag does not certify embedding or C1.
   */
  export interface IInterval {
    /** Exact lower saved-section coordinate in millimetres. */
    beforeMm: number;
    /** Exact next saved-section coordinate in millimetres. */
    afterMm: number;
    /** Complete, disjoint partition of both saved loop lists. */
    groups: readonly {
      /**
       * Zero-based loop ordinals in the section at beforeMm; each loop occurs
       * in exactly one group across this interval.
       */
      before: readonly number[];
      /**
       * Zero-based loop ordinals in the section at afterMm, partitioned by the
       * same incidence groups.
       */
      after: readonly number[];
      /**
       * Whether the observation producer establishes this group's continuation;
       * false preserves a local gap and never requests nearest-loop
       * replacement.
       */
      supported: boolean;
      /**
       * Producer's unsupported-incidence explanation, or null when none is
       * supplied; the flag remains the support decision.
       */
      reason: string | null;
    }[];
  }

  /**
   * One cut's independently defined cubic boundaries; outer and cavity senses
   * use the same plane frame.
   */
  export interface ISection {
    /** Physical coordinate along the common cutting direction, millimetres. */
    coordinateMm: number;

    /**
     * Curves with source-independent orientation labels; negative winding
     * denotes a cavity boundary.
     */
    loops: readonly {
      /**
       * Complete generating cubic curve in the common section chart,
       * millimetres; ownership is independent of source mesh addresses.
       */
      curve: IAutoMovieCubicBezierCurve64;
      /**
       * Positive outer-boundary or negative cavity orientation in the section's
       * declared cutting-plane frame.
       */
      winding: 1 | -1;
    }[];
  }

  /**
   * A named critical level's incident contours and optional isolated extremum
   * terminal. The before/after coordinates select saved sections; their local
   * loop numbers encode adjacency. A terminal is used only for a declared
   * regular minimum or maximum, never to cap a finite unmatched loop.
   */
  export interface IEvent {
    /** Stable event identifier within this loft. */
    name: string;

    /** Physical event coordinate, millimetres. */
    coordinateMm: number;

    /** Saved section coordinate strictly below the event, millimetres. */
    beforeMm: number;

    /** Saved section coordinate strictly above the event, millimetres. */
    afterMm: number;

    /** Incident local loop numbers at the declared before section. */
    before: readonly number[];

    /** Incident local loop numbers at the declared after section. */
    after: readonly number[];

    /**
     * A minimum or maximum can terminate at its named terminal; a saddle joins
     * incident curves.
     */
    kind: "minimum" | "maximum" | "saddle";

    /** Whether the declaration establishes an isolated regular local event. */
    regular: boolean;

    /**
     * Generating terminal in world millimetres for a minimum or maximum; null
     * for a saddle.
     */
    terminal: Readonly<AutoMovieVector3Tuple> | null;
  }

  /**
   * Newly generated mesh and the evaluated section samples that actually
   * supplied its boundaries. Unresolved boundaries remain visible and are
   * reported instead of receiving an invented cap.
   */
  export interface IResult {
    /**
     * Actual retained generated triangles, addressed by zero-based mesh
     * triangle ordinal and source-free incidence group. Omission means this
     * kernel did not publish ownership; it never authorizes inferred
     * attribution.
     */
    primitiveRanges?: {
      /**
       * Zero-based first retained triangle in mesh.indices, measured in
       * triangles rather than scalar index entries.
       */
      firstTriangle: number;
      /**
       * Number of consecutively retained triangles belonging to this
       * source-free incidence group.
       */
      triangleCount: number;
      /** Lower saved cut coordinate of the owning interval, millimetres. */
      beforeMm: number;
      /** Upper saved cut coordinate of the owning interval, millimetres. */
      afterMm: number;
      /**
       * Zero-based independently emitted incidence-group ordinal within this
       * interval.
       */
      group: number;
      /**
       * Strip joins two incident boundaries; cap belongs to an explicitly
       * declared regular extremum terminal.
       */
      kind: "strip" | "cap";
      /**
       * Declared critical-event identities attributed to these retained
       * triangles; empty means no named event attribution.
       */
      eventNames: string[];
    }[];
    /**
     * Pass-local source-leaf interaction work before shared-boundary emission.
     * Refinements count contact-driven leaf splits; chordPairs and
     * exactOrientationTests count actual visited pairs and exact determinant
     * calls. Timing is null without observeWork. Pass qualification is separate
     * from retained historical diagnostics.
     */
    interactionObservations?: {
      /** Lower saved cut coordinate for this interaction pass, millimetres. */
      beforeMm: number;
      /** Upper saved cut coordinate for this interaction pass, millimetres. */
      afterMm: number;
      /**
       * Zero-based incidence group whose source-leaf interactions were
       * inspected.
       */
      group: number;
      /**
       * Producer's pass ordinal for this group's contact-driven refinement
       * work.
       */
      pass: number;
      /**
       * Which saved section supplied the boundary leaves inspected in this
       * pass.
       */
      side: "before" | "after";
      /**
       * Whether this pass's interaction checks succeeded; older diagnostics may
       * remain even after a qualified pass.
       */
      qualified: boolean;
      /** Number of actual contact-driven source-leaf splits in this pass. */
      refinements: number;
      /**
       * Number of chord pairs actually visited by this pass, not the
       * Cartesian-product population.
       */
      chordPairs: number;
      /** Number of exact determinant calls made while qualifying this pass. */
      exactOrientationTests: number;
      /**
       * Observed wall-clock duration in milliseconds, or null when observeWork
       * was omitted or false.
       */
      elapsedMs: number | null;
      /**
       * Ordered local interaction qualifications and failure explanations;
       * empty means no diagnostics were published for the pass.
       */
      diagnostics: string[];
    }[];
    /**
     * Source-free strip qualification and work observations. A finite emitted
     * candidate remains displayable when topology/link/orientation
     * qualification fails; qualified does not certify injectivity, C1 or visual
     * quality. Timing is null unless observeWork was requested.
     */
    stripObservations?: {
      /** Lower saved cut coordinate of the strip interval, millimetres. */
      beforeMm: number;
      /** Upper saved cut coordinate of the strip interval, millimetres. */
      afterMm: number;
      /** Ordinal of the independently emitted group in this interval. */
      group: number;
      /**
       * First oriented input-walk node count after slit expansion, including
       * repeated sheet occurrences.
       */
      n: number;
      /** Second oriented input-walk node count under the same convention. */
      m: number;
      /**
       * Four-state DP solves for distinct forbidden-transition conditions,
       * including infeasible solves.
       */
      dpCalls: number;
      /**
       * Popped candidates that failed qualification and generated alternative
       * branches.
       */
      expandedConflicts: number;
      /**
       * Maximum queued feasible candidates, excluding the currently popped
       * candidate.
       */
      peakQueue: number;
      /**
       * Actual strip admission, construction, search and emission time,
       * milliseconds; null without explicit observeWork.
       */
      elapsedMs: number | null;
      /**
       * Whether the emitted candidate passed the strip topology, link and
       * orientation checks; not an injectivity or C1 certificate.
       */
      qualified: boolean;
      /**
       * Local strip-search and qualification explanations; finite emitted
       * candidates can coexist with failed qualification.
       */
      diagnostics: string[];
    }[];

    /**
     * Engine-generated indexed geometry in metres. Normals derive from its
     * emitted faces and are unit vectors when accumulation is nonzero; a
     * vanishing accumulated normal remains zero without deleting geometry.
     */
    mesh: IAutoMovieMesh;

    /**
     * Actual evaluated section curves, in metres, retaining their own sheet
     * identities.
     */
    construction: {
      /**
       * Producer-assigned identity of this evaluated section boundary,
       * independent of source mesh vertex indices.
       */
      id: string;
      /**
       * The evaluated construction is a closed section boundary; this literal
       * does not imply a closed final mesh.
       */
      closed: true;
      /**
       * Evaluated section points in world metres and boundary order, preserving
       * separate sheet occurrences.
       */
      points: [number, number, number][];
      /**
       * Original generating curve parameters aligned with points, when
       * published. Reversed winding may decrease this sequence; constant trace
       * quotients preserve phase gaps. These are not measured arc lengths.
       */
      phases?: number[];
    }[];

    /**
     * Boundaries for which the declared event relationships did not establish a
     * valid closure.
     */
    unresolved: {
      /**
       * Lower saved cut coordinate bounding the unresolved relationship,
       * millimetres.
       */
      beforeMm: number;
      /**
       * Upper saved cut coordinate bounding the unresolved relationship,
       * millimetres.
       */
      afterMm: number;
      /**
       * Number of incident contours on the lower side of the unresolved
       * relationship.
       */
      incoming: number;
      /**
       * Number of incident contours on the upper side of the unresolved
       * relationship.
       */
      outgoing: number;
      /** Explicit unsupported relationship or arithmetic reason, when available. */
      reason?: string;
    }[];
  }
}
