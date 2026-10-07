import type { IAutoMovieHumanFaceAttachmentPoint } from "./IAutoMovieHumanFaceAttachmentPoint";

/**
 * Source-owned clipped cells retained as material points on the original skin.
 * The compiler shares native edge intersections by identity, not coordinates.
 * Current host corners supply geometry under deformation; this record adds no
 * personal vertex control or clinical tissue boundary measurement.
 *
 * @evidence contracts/common.md#principled-implementation Actual host triangles and barycentric points retain material lineage through source-region clipping.
 * @evidence contracts/common.md#clear-and-simple-design One point table and oriented incidence carry the patch and every boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reference XYZ or coordinate weld substitutes for native material identity.
 * @evidence contracts/common.md#meaningful-documentation States generation, incidence, endpoint and boundary ownership.
 * @evidence contracts/modeling.md#spatial-conventions Host triangle ordinals and dimensionless weights are evaluated in the current host frame.
 * @evidence contracts/modeling.md#shared-boundaries Boundary and plica indices address the same shared material point table as emitted cells.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Source metadata locates existing tissue parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no personal authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The consuming tissue builder owns emission.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming tissue builder observes its output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Material correspondence supplies no clinical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source and tissue owners admit their own domains.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Offline shared-source metadata, not personal sculpting input.
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
