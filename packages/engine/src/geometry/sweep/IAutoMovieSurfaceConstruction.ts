/**
 * A polyline sampled from a surface rig's generating construction at rest, in network-frame metres, after any girth correction.
 *
 * Spine, station, guide and feature observations use raw zero-cell sweep writers. Network-curve observations use the actual regenerated tangent-constrained curve: its sweep endpoints and tangent planes share the registry-resolved geometric sampling cells, or zero cells at observation-only nodes. These distinct stages explain the geometry before subdivision fitting; none is a pin-overwritten control polygon. They are snapshots and do not move when the rig is posed.
 *
 * @evidence contracts/development/design.md#principled-representation Samples the actual sealed rig evaluators after their rest constraints, rather than reconstructing their input polylines.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A curve kind, source name, closure flag and packed positions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Distinguishes raw sweep observations from cell-consistent generated network curves and from fitted or pinned cage controls.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, units, filtering distinction and rest-only lifetime.
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
   * @evidence contracts/development/design.md#principled-representation Counts set observation resolution independently of the cage's topology.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One count for closed stations, ordinary lines, each feature segment and network curves.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All four named counts are required and validated as positive safe integers; stations need at least three and unknown keys are refused.
   * @evidence contracts/development/common.md#meaningful-documentation States count meanings, minimums and strict named-key admission.
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
