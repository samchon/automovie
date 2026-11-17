import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * A declared contour topology event prepared for adjacent-slab planning.
 *
 * prepareAutoMovieContourDocument64 copies the event's physical coordinates,
 * terminal and signed saved-loop incidence. Its link fields encode the declared
 * event kind and regularity; they are not measurements of a recovered mesh link.
 * planAutoMovieContourSlabs64 uses these same records to match groups and keeps
 * unsupported relationships as explicit local omissions. The record and copied
 * terminal/incidence arrays belong to one generation call and remain mutable
 * work data. It carries no source-mesh vertex address.
 *
 * @evidence contracts/development/design.md#principled-representation Exact saved cut coordinates and local signed loop ordinals preserve the declared event's incidence independently of positional proximity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Preparation, slab planning and terminal emission share one record rather than declaring structurally identical event views in each stage.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The 0/1 link flags are explicitly a translation of minimum/maximum and regular declarations; they do not certify mesh topology or repair unsupported incidence.
 * @evidence contracts/development/common.md#meaningful-documentation Names millimetre coordinates, local loop addresses, null terminal behavior, flag derivation, local omission and generation lifetime.
 */
export interface IAutoMoviePreparedContourEvent64 {
  /** Declared critical coordinate along the common cutting direction, millimetres. */
  y: number;

  /** Declared lower saved-section coordinate, millimetres. */
  y0: number;

  /** Declared upper saved-section coordinate, millimetres. */
  y1: number;

  /** Copied extremum terminal in world millimetres, or null for a saddle declaration. */
  point: AutoMovieVector3Tuple | null;

  /** Incident loops at y0 with winding copied from their saved section. */
  below: IAutoMoviePreparedContourEvent64.IIncident[];

  /** Incident loops at y1 with winding copied from their saved section. */
  above: IAutoMoviePreparedContourEvent64.IIncident[];

  /** Preparation writes 0 for a minimum and 1 otherwise; this is a declared-kind flag rather than a measured component count. */
  lowerLinkComponents: number;

  /** Preparation writes 0 for a maximum and 1 otherwise; terminal emission uses it to identify the vanishing side. */
  upperLinkComponents: number;

  /** Copy of the event's regular flag, not an independently established manifold-link result. */
  manifoldLink: boolean;

  /** Negation of the declared regular flag in the current preparation adapter; it does not independently inspect neighbouring vertices. */
  equalHeightNeighbour: boolean;

  /** Local event-admission refusal, when present; absence permits subsequent incidence checks but does not certify embedding. */
  unsupported?: string;
}

/** Saved-section incidence belonging to one prepared event. */
export namespace IAutoMoviePreparedContourEvent64 {
  /**
   * One local loop ordinal and its signed material-boundary orientation.
   *
   * @evidence contracts/development/design.md#principled-representation The loop address is interpreted only in the saved section named by the containing event side, and winding comes from that loop.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two scalars are the complete incidence data used by slab grouping; generating curve coefficients remain in the saved section.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A local ordinal is never treated as a source-mesh address or matched by coordinate proximity.
   * @evidence contracts/development/common.md#meaningful-documentation States ordinal scope, orientation meaning and the producing lookup.
   */
  export interface IIncident {
    /** Zero-based loop ordinal within the containing side's saved section. */
    loop: number;

    /** Saved loop orientation: admitted declarations use +1 for an outer boundary and -1 for a cavity. */
    winding: number;
  }
}
