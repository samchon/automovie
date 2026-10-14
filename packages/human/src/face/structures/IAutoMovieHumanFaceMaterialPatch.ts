import type { IAutoMovieHumanFaceAttachmentPoint } from "./IAutoMovieHumanFaceAttachmentPoint";

/**
 * Source-owned clipped cells retained as material points on the original skin.
 * The compiler shares native edge intersections by identity, not coordinates.
 * Current host corners supply geometry under deformation; this record adds no
 * personal vertex control or clinical tissue boundary measurement.
 *
 * @evidence contracts/common.md#principled-implementation Source-native clipped cells use original host-facet seats and shared material identities; evaluateHumanFaceMaterialPatch interpolates actual live corners and retains oriented cells, boundary cycles and connector endpoints.
 * @evidence contracts/common.md#clear-and-simple-design One generation/surface owns point coefficients, cell topology and anatomical support witnesses; authoredConvention explicitly qualifies the source region.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The evaluator checks generation, resident layouts, coefficients, native claims, finite positions and endpoint incidence; a material patch is not observed histology, a personal vertex edit or a clinical tissue-boundary measurement.
 * @evidence contracts/common.md#meaningful-documentation Native versus material-cut points, holes, ordered plica and actual posterior-margin endpoints preserve source meanings under deformation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no clipping or performed interpolation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared point identity is source provenance, not a query cache implemented here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Point/index/cycle arrays remain caller-owned; no skin host or query is acquired by the interface.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMaterialPatch {
  /** Generation that owns the host triangle ordinals. */
  generation: string;

  /** Host skin surface whose live corners supply positions and normals. */
  surface: string;

  /** Shared material points; weights address original host triangle corners. */
  points: IAutoMovieHumanFaceAttachmentPoint[];

  /** Original host vertex only for an exact native point; null marks a material cut. */
  nativeVertices: (number | null)[];

  /** Oriented triangles in the material-point table. */
  indices: number[];

  /** Every boundary cycle; holes and separate cycles are retained explicitly. */
  boundaries: number[][];

  /** Ordered lower-to-upper material support path on the authored connector. */
  plica: number[];

  /** Exact material-point index of the medial canthal endpoint. */
  medialEndpoint: number;

  /** Actual upper posterior-margin endpoint of the authored bed. */
  upperEndpoint: number;

  /** Actual lower posterior-margin endpoint of the authored bed. */
  lowerEndpoint: number;

  /** The source-authored material-region definition is not observed histology. */
  qualification: "authoredConvention";
}
