import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";
import type { IAutoMovieHumanFaceBasisRegion } from "./IAutoMovieHumanFaceBasisRegion";
import type { IAutoMovieHumanFaceAttachmentChart } from "./IAutoMovieHumanFaceAttachmentChart";
import type { IAutoMovieHumanFaceHairDomain } from "./IAutoMovieHumanFaceHairDomain";
import type { IAutoMovieHumanFaceSourcePosePlan } from "./IAutoMovieHumanFaceSourcePosePlan";
import type { IAutoMovieHumanFaceSurfaceAttachment } from "./IAutoMovieHumanFaceSurfaceAttachment";

/**
 * One connected skin or separately attached component of a face basis.
 *
 * The surface owns its shared vertex identities, oriented connectivity and
 * normals across every material region, in the basis's Y-up head frame.
 * Endpoint rows, hair domains, collision closure and attachments all address
 * these shared identities before any material or UV seam splitting.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisSurface {
  /** Surface identity, unique within the basis. */
  id: string;

  /** Shared flat XYZ positions, before material or UV seam splitting. */
  positions: number[];

  /** Optional shared-source cell lineage, prepared after the final neutral crop. */
  sourcePartition?: IAutoMovieHumanBasisSourcePartition;

  /**
   * Source-owned material disks for continuous skin courses. Each disk keeps
   * its exact native incidence and generation through identity and performance;
   * its dimensionless coordinates are not texture UVs or physical lengths.
   * Omission leaves source-supported regional courses unavailable.
   */
  materialCharts?: Record<string, IAutoMovieHumanFaceAttachmentChart>;

  /** Optional native-after-posing replay of appended shared oral refinement samples. */
  sourcePosePlan?: IAutoMovieHumanFaceSourcePosePlan;

  /** Oriented triangles over those shared vertex identities. */
  indices: number[];

  /** Sparse [vertex, dx, dy, dz] rows, strictly increasing by vertex per endpoint. */
  targets: Record<string, number[]>;

  /**
   * Optional shared anatomical hair-growth domains. Triangle ordinals refer
   * to this surface's complete indices, before material or UV separation.
   * Each nonempty domain has unique ascending ordinals and a finite neutral
   * chart origin in metres. These regions are common to every identity.
   */
  hairDomains?: IAutoMovieHumanFaceHairDomain[];

  /**
   * Optional oriented triangles over resident vertices closing an otherwise
   * open contact surface. They participate only in numerical hair collision
   * queries, never visible geometry. The completed surface must be embedded,
   * closed and outward oriented; deformation must preserve those premises.
   * This is shared collision topology, not personal offsets or a fitted mesh.
   */
  hairContactClosure?: number[];

  /**
   * Optional sparse attachment of this surface's vertices to the articulated
   * owners of `articulation` (`jaw`, `leftEye`, `rightEye`). Rows are
   * `[vertex, weight]` pairs, strictly increasing by vertex, with each weight
   * in (0, 1] and the weights of one vertex over all owners summing to at
   * most one; the remainder is the cranium, which the head frame holds
   * still. A vertex bound to one owner with weight one moves as that bone,
   * which is what makes a tooth or a globe rigid without a post-hoc fit, and
   * a blended vertex takes the weighted mean of its owners' rigid images.
   * Weights are shared basis data measured from the source, never a
   * person's sculpt. Omission or an empty list attaches the whole surface to
   * the cranium.
   */
  attachments?: IAutoMovieHumanFaceSurfaceAttachment[];

  /** An exact partition of the surface triangles, preserving oriented triples. */
  regions: IAutoMovieHumanFaceBasisRegion[];
}
