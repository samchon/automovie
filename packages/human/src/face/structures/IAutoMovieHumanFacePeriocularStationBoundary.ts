/**
 * The source-published native edge cycle through one coarse station row.
 * The cycle keeps every native knot; anchor offsets locate the unchanged
 * coarse columns within it. Host-view vertices and canonical source samples
 * remain separate addresses. The enclosing cage owns generation and surface.
 * A turning-border convention supplies no clinical boundary measurement.
 *
 * @evidence contracts/common.md#principled-implementation Explicit native incidence and canonical samples retain the source course instead of reconstructing a chord between coarse anchors.
 * @evidence contracts/common.md#clear-and-simple-design One boundary record belongs to its existing station and enclosing cage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate proximity or nearest path supplies identity.
 * @evidence contracts/common.md#meaningful-documentation Separates native knots, coarse columns and canonical sample addresses.
 * @evidence contracts/modeling.md#shared-boundaries The station record keeps its native cycle, coarse anchor offsets and canonical sample identities together for shared addressing.
 * @evidence contracts/modeling.md#spatial-conventions Vertices and offsets are ordinals; canonical source samples are separate identifiers, not metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Registers a boundary on an existing skin part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no personal numerical channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The consumers emit their existing parts.
 * @evidenceExclude contracts/modeling.md#rendered-observation Boundary consumers own observation on current geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source An authored turning-border course supplies no measured tissue dimension.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines source correspondence rather than a physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Contains source topology, not personal sculpt controls.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularStationBoundary {
  /** Host-view vertices of one native closed cycle, without a repeated seam. */
  vertices: number[];

  /** Actual host source-partition sample at each cycle vertex. */
  sourceSamples: number[];

  /** Cycle offset of every unchanged station column, in station column order. */
  anchorOffsets: number[];

  /** Source-authored turning-border correspondence, without a clinical claim. */
  qualification: "authoredConvention";
}
