import type { V3 } from "./V3";

/**
 * Borrowed registered triangle observations in one caller-declared Cartesian frame.
 * Units are shared by all positions and cutting planes. Canonical addresses name
 * connectivity only; the caller qualifies equal-position aliases before extraction.
 * Keep every array unchanged while a prepared observation closure retains it.
 *
 * @evidence contracts/development/design.md#principled-representation Positions, triangle incidence and canonical connectivity are the complete geometric inputs used by plane cuts, scalar links and material-side witnesses; no anatomical or rig fields are required.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural mesh boundary separates generic observation algorithms from their source loader and downstream coefficient publication.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source asset, identity, coordinate table, registration inference or generated-surface fallback is supplied by this type.
 * @evidence contracts/development/common.md#meaningful-documentation States common units, registration responsibility, connectivity-only aliases and borrowed immutable lifetime.
 */
export interface IAutoMovieRecoveryIndexedMesh {
  /** Positions in the common declared Cartesian frame and physical units. */
  vertices: V3[];

  /** Oriented faces addressing the supplied positions. */
  triangles: [number, number, number][];

  /** One in-range canonical connectivity address per position. */
  canon: Int32Array;
}
