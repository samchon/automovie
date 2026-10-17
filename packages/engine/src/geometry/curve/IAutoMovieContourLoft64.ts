import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieCurve64 } from "./IAutoMovieCurve64";

/**
 * Oriented cubic section curves and explicit contour incidence in one physical chart.
 * Coordinates and terminals are millimetres; the generated mesh uses metres.
 * Events name section-loop relationships, never source mesh addresses.
 * Sections must have increasing coordinates and use one consistent cutting-plane orientation.
 * Ordinary intervals use nearest geometric continuation; declared events own every topology change.
 * This representation neither identifies anatomical equations nor certifies a surface without folds.
 *
 * @evidence contracts/common.md#principled-implementation Complete cubic coefficients and signed event incidence define a contour loft independently of any source mesh.
 * @evidence contracts/common.md#clear-and-simple-design Sections, event relationships and a physical chord tolerance are the input; output mesh and actual sampled construction remain separate records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No original surface vertices, triangle indices, normals or anatomical defaults are admitted by this contract.
 * @evidence contracts/common.md#meaningful-documentation States chart units, ordering, orientation, topology ownership and the absence of a fold guarantee.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A structural contract performs no sampling or correspondence computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no admission cache or evaluated surface.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Runtime arrays belong to the caller and the tessellator's returned result.
 * @author Samchon
 */
export interface IAutoMovieContourLoft64 {
  /** Ordered physical section coordinates and their oriented closed curves. */
  sections: readonly IAutoMovieContourLoft64.ISection[];

  /** Explicit topology relationships with incident loops on both sides of each critical level. */
  events: readonly IAutoMovieContourLoft64.IEvent[];

  /** Positive chord-error tolerance for cubic tessellation, millimetres; not a surface-error bound. */
  chordToleranceMm: number;
}

export namespace IAutoMovieContourLoft64 {
  /**
   * One cut's independently defined cubic boundaries; outer and cavity senses use the same plane frame.
   *
   * @evidence contracts/common.md#principled-implementation A physical coordinate groups the complete generating curves of one cut.
   * @evidence contracts/common.md#clear-and-simple-design The coordinate and ordered loop list carry the section without a second sampled definition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A loop index is local to this section and is not a source mesh vertex address.
   * @evidence contracts/common.md#meaningful-documentation States coordinate units, orientation meaning and curve ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A section record performs no evaluation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Sampling reuse belongs to the tessellator.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A section owns no runtime cache or handle.
   * @author Samchon
   */
  export interface ISection {
    /** Physical coordinate along the common cutting direction, millimetres. */
    coordinateMm: number;

    /** Curves with source-independent orientation labels; negative winding denotes a cavity boundary. */
    loops: readonly { curve: IAutoMovieCurve64.Cubic; winding: 1 | -1 }[];
  }

  /**
   * A named critical level's incident contours and optional isolated extremum terminal.
   * The before/after coordinates select saved sections; their local loop numbers encode adjacency.
   * A terminal is used only for a declared regular minimum or maximum, never to cap a finite unmatched loop.
   *
   * @evidence contracts/common.md#principled-implementation Explicit incident-contour relationships preserve split, merge and cavity events even when loop counts do not change.
   * @evidence contracts/common.md#clear-and-simple-design One event publishes both sides and its extremum or saddle kind.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Proximity alone does not invent a topology event, and a missing continuation is not permission to close a cavity.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes local contour indices, physical event coordinates, regularity and terminal use.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Event relationships perform no graph traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work An event record schedules no repeated evaluation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record owns no source mesh or retained runtime process.
   * @author Samchon
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

    /** A minimum or maximum can terminate at its named terminal; a saddle joins incident curves. */
    kind: "minimum" | "maximum" | "saddle";

    /** Whether the declaration establishes an isolated regular local event. */
    regular: boolean;

    /** Generating terminal in world millimetres for a minimum or maximum; null for a saddle. */
    terminal: IAutoMovieCurve64.Vector | null;
  }

  /**
   * Newly generated mesh and the evaluated section samples that actually supplied its boundaries.
   * Unresolved boundaries remain visible and are reported instead of receiving an invented cap.
   *
   * @evidence contracts/common.md#principled-implementation The result separates emitted geometry, generating construction and unresolved topology.
   * @evidence contracts/common.md#clear-and-simple-design One result lets rendering and provenance consume the same generation without reevaluation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Normals derive from the new mesh and no missing surface is replaced by another mesh.
   * @evidence contracts/common.md#meaningful-documentation States metre output, construction meaning and unresolved-boundary behavior.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A result record performs no arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The tessellator transfers one completed result to its caller.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns mesh buffers, construction samples and diagnostics; no global owner retains them.
   * @author Samchon
   */
  export interface IResult {
    /** Engine-generated indexed geometry in metres, with its own unit vertex normals. */
    mesh: IAutoMovieMesh;

    /** Actual evaluated section curves, in metres, retaining their own sheet identities. */
    construction: {
      id: string;
      closed: true;
      points: [number, number, number][];
    }[];

    /** Boundaries for which the declared event relationships did not establish a valid closure. */
    unresolved: {
      beforeMm: number;
      afterMm: number;
      incoming: number;
      outgoing: number;
    }[];
  }
}
