import type { V3 } from "./V3.ts";

/**
 * Borrowed registered triangle observations in one caller-declared Cartesian frame.
 * Units are shared by all positions and cutting planes. Canonical addresses name
 * connectivity only; the caller qualifies equal-position aliases before extraction.
 * Keep every array unchanged while a prepared observation closure retains it.
 *
 * @evidence contracts/common.md#principled-implementation Positions, triangle incidence and canonical connectivity are the complete geometric inputs used by plane cuts, scalar links and material-side witnesses; no anatomical or rig fields are required.
 * @evidence contracts/common.md#clear-and-simple-design One structural mesh boundary separates generic observation algorithms from their source loader and downstream coefficient publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source asset, identity, coordinate table, registration inference or generated-surface fallback is supplied by this type.
 * @evidence contracts/common.md#meaningful-documentation States common units, registration responsibility, connectivity-only aliases and borrowed immutable lifetime.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased structural declaration chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work An erased declaration caches no source or observation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The consuming operation and caller own borrowed arrays and prepared closures.
 *
 * @author Samchon
 */
export interface IAutoMovieRecoveryIndexedMesh {
  /** Positions in the common declared Cartesian frame and physical units. */
  vertices: V3[];

  /** Oriented faces addressing the supplied positions. */
  triangles: [number, number, number][];

  /** One in-range canonical connectivity address per position. */
  canon: Int32Array;
}
