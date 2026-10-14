import type {
  IAutoMovieMesh,
  IAutoMovieMeshPhysicalSource,
} from "@automovie/interface";

import type { IAutoMovieHumanPersonSeam } from "./IAutoMovieHumanPersonSeam";

/**
 * Inputs for subdividing one admitted posed skin region onto captured face/body neck correspondence. Static mesh/source rows, side, seam and actual posed face positions/normals share metre Y-up/+Z-forward coordinates. Optional pre-collar positions provide failure provenance only; optional face-loop physical pairs must be actual resident identities, not coordinate-inferred IDs. The stitch owner validates supported local operations and refuses unregistered insertions; this carrier does not certify global geometry or clinical continuity.
 *
 * @evidence contracts/common.md#principled-implementation Actual region-to-source rows and canonical face-loop fields supply one shared boundary, with explicit provenance and physical identity separate from position contact.
 * @evidence contracts/common.md#clear-and-simple-design Existing mesh/seam owners supply geometry and correspondence; this carrier names side and optional scalar/provenance seams without another topology representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional physical pairs do not invent lineage for new points, and typed aligned buffers do not stand in for performed/global geometry or clinical admission.
 * @evidence contracts/common.md#meaningful-documentation Prose states posed metre axes, static/source alignment, provenance-only pre-collar fields and actual identity ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input record executes no edge subdivision or geometry validation; stitch and engine owners perform those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Sharing captured seam inputs is consumer behavior rather than a topology/cache implementation in this schema.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring borrowed buffers/callbacks acquires no mesh, worker or task; caller and stitch owners control actual lifetimes.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBoundaryStitchProps {
  /** The region's posed mesh. */
  mesh: IAutoMovieMesh;

  /** Skin source vertex per mesh vertex. */
  sources: readonly number[];

  /** Which skin the region belongs to. */
  side: "face" | "body";

  /** The face/body neck seam. */
  seam: IAutoMovieHumanPersonSeam;

  /** Posed face skin positions, metres. */
  face: readonly number[];

  /** Posed skin normals, flat triples indexed by face skin vertex; read at face-loop vertices. */
  faceNormals: readonly number[];

  /** Body source positions after rig posing, before collar alignment; failure provenance only. */
  bodyBeforeCollar?: readonly number[];

  /** Canonical physical pairs aligned with the registered face loop. */
  physicalBoundary?: readonly IAutoMovieMeshPhysicalSource[];

  /**
   * Carry the internal source scalar through each actual appended vertex's parent/weight stencil. The observer must mirror these resident indices without mutating borrowed parents/weights; its external side effects and exceptions propagate. Existing vertices are not re-reported as appended.
   *
   * @evidence contracts/common.md#principled-implementation Actual appended vertex index and exact gather parents/weights let the material scalar owner follow the same topology operation.
   * @evidence contracts/common.md#clear-and-simple-design This callback signature exposes the gather receipt while numerical scalar interpolation and source admission stay with caller/stitch owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The receipt adds no fabricated source point or separate geometry, and effectful callbacks are not claimed isolated or silently suppressed.
   * @evidence contracts/common.md#meaningful-documentation Prose states appended-only timing, resident indices, borrowed stencil and observer purity/error boundary.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased callback runs no scalar gather or subdivision; concrete callback/producer implementations own their costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Sharing an actual append stencil is producer behavior, not cached work in this signature.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature acquires no buffer or task; caller observers own retained scalar fields/receipts and effect lifetime.
   */
  appendSourceScalar?: (
    vertex: number,
    parents: readonly number[],
    weights: readonly number[],
  ) => void;
}
