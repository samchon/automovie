/**
 * A polyline sampled from a surface rig's generating construction at rest, in network-frame metres, after any girth correction.
 *
 * These are the unfiltered sweep, spine, guide, feature and tangent-constrained network curves. They explain the surface that the cage samples; the cage's cell averaging and limit fit remain distinct operations. They are snapshots and do not move when the rig is posed.
 *
 * @evidence contracts/common.md#principled-implementation Samples the actual sealed rig evaluators after their rest constraints, rather than reconstructing their input polylines.
 * @evidence contracts/common.md#clear-and-simple-design A curve kind, source name, closure flag and packed positions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Makes no claim that an unfiltered generating surface equals a cell-averaged target or a cage control polygon.
 * @evidence contracts/common.md#meaningful-documentation States the frame, units, filtering distinction and rest-only lifetime.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; the surface rig owns sampling cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A returned snapshot without mutable evaluator state.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the returned packed arrays.
 * @author Samchon
 */
export interface IAutoMovieSurfaceConstruction {
  /** The primitive being shown. */
  kind: "spine" | "station" | "guide" | "feature" | "curve";

  /** Its source sweep or network-curve name. */
  name: string;

  /** Whether the last point joins the first; a closed line omits the repeated endpoint. */
  closed: boolean;

  /** Packed XYZ positions, metres. */
  points: number[];
}

/** Sampling controls of a surface rig's construction. */
export namespace IAutoMovieSurfaceConstruction {
  /**
   * Segment counts for each construction class, with all four fields required and unknown keys refused.
   *
   * @evidence contracts/common.md#principled-implementation Counts set observation resolution independently of the cage's topology.
   * @evidence contracts/common.md#clear-and-simple-design One count for closed stations, ordinary lines, each feature segment and network curves.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts All four named counts are required and validated as positive safe integers; stations need at least three and unknown keys are refused.
   * @evidence contracts/common.md#meaningful-documentation States count meanings, minimums and strict named-key admission.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A sampling request record.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A sampling request record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A caller-owned record without resource handles.
   * @author Samchon
   */
  export interface ISamples {
    /** Segments around a closed station, at least three. */
    station: number;

    /** Segments along a spine or guide, at least one. */
    line: number;

    /** Segments per declared feature segment, at least one. */
    feature: number;

    /** Segments along a network curve, at least one. */
    curve: number;
  }
}
