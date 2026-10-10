import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One eyebrow's emitted shafts and the skin state they were built on, as the
 * brow clearance reader takes them.
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
