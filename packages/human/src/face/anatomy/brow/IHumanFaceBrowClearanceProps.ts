import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One eyebrow's emitted shafts and the skin state they were built on, as the
 * brow clearance reader takes them.
 *
 * @evidence contracts/common.md#principled-implementation The reader measures the emitted shaft meshes against the same skin triangles that seated them, so the record carries exactly those two geometries.
 * @evidence contracts/common.md#clear-and-simple-design One record per side and state; the tolerance is the source contact tolerance the former assertion used.
 * @evidence contracts/common.md#meaningful-documentation Each member states its unit and origin.
 * @evidence contracts/modeling.md#spatial-conventions Both geometries are head-frame metres.
 *
 * @author Samchon
 */
export interface IHumanFaceBrowClearanceProps {
  /** Anatomical side of the population. */
  side: "left" | "right";

  /** Skin state the shafts were built on. */
  state: "rest" | "performed";

  /** Host skin in that state, read as an open oriented sheet. */
  skin: IAutoMovieMesh;

  /** Identity reported for the skin. */
  against: string;

  /** Emitted shaft meshes in sequence order; each is a lattice whose first row is the root and last row the tip. */
  shafts: readonly IAutoMovieMesh[];

  /** Vertices in one lattice row of a shaft: nine for a tube, two for a ribbon. */
  rowVertices: number;

  /** Source attachment tolerance in metres. */
  toleranceMetres: number;
}
