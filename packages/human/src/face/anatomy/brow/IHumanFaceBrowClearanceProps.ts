import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One eyebrow's emitted shafts and the skin state they were built on, as the
 * brow clearance reader takes them.
 *
 *
 * @evidence contracts/common.md#principled-implementation One side's emitted shafts are measured against the same rest/performed skin state with the source attachment tolerance.
 * @evidence contracts/common.md#clear-and-simple-design Host skin, reported identity, shaft sequence and lattice-row width supply readHumanFaceBrowClearance's three actual relations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declared nine-corner tube or two-corner ribbon row identifies actual roots and tips; the request does not manufacture a passing tolerance.
 * @evidence contracts/common.md#meaningful-documentation Members specify anatomical side, skin state, open sheet semantics, shaft order and metre tolerance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Brow clearance request schema is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Brow clearance request schema specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Brow clearance request schema acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
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
