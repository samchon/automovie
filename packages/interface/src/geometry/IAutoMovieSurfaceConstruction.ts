/**
 * A polyline sampled from a surface rig's generating construction at rest, in
 * network-frame metres, after any girth correction.
 *
 * Spine, station, guide and feature observations use raw zero-cell sweep
 * writers. Network-curve observations use the actual regenerated
 * tangent-constrained curve: its sweep endpoints and tangent planes share the
 * registry-resolved geometric sampling cells, or zero cells at observation-only
 * nodes. These distinct stages explain the geometry before subdivision fitting;
 * none is a pin-overwritten control polygon. They are snapshots and do not move
 * when the rig is posed.
 */
export interface IAutoMovieSurfaceConstruction {
  /** The primitive being shown. */
  kind: "spine" | "station" | "guide" | "feature" | "curve";

  /** Its source sweep or network-curve name. */
  name: string;

  /**
   * Whether the last point joins the first; a closed line omits the repeated
   * endpoint.
   */
  closed: boolean;

  /** Packed XYZ positions, metres. */
  points: number[];
}

/** Data and callback contracts shared by the SurfaceConstruction operations. */
export namespace IAutoMovieSurfaceConstruction {
  /**
   * Segment counts for each construction class, with all four fields required
   * and unknown keys refused.
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
