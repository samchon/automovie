import type { IAutoMovieHumanFaceAttachmentPoint } from "./IAutoMovieHumanFaceAttachmentPoint";

/**
 * Source-owned clipped cells retained as material points on the original skin.
 * The compiler shares native edge intersections by identity, not coordinates.
 * Current host corners supply geometry under deformation; this record adds no
 * personal vertex control or clinical tissue boundary measurement.
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
