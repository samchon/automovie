import type { IAutoMovieHumanBasisNormalTransport } from "./IAutoMovieHumanBasisNormalTransport";
import type { IAutoMovieHumanBasisSourceChartPoint } from "./IAutoMovieHumanBasisSourceChartPoint";
import type { IAutoMovieHumanBasisSourceIntersection } from "./IAutoMovieHumanBasisSourceIntersection";

/**
 * Immutable provenance of one surface's cells in a shared source triangle tree.
 * Offline face/body compilation binds both partitions to the same generation,
 * parent topology and ordered affine cut table. This stores identities and
 * dimensionless weights, never source coordinates or personal sculpt inputs.
 *
 * Freeze the cut table before the neutral bake and reuse its virtual sample IDs
 * on both sides. A performed vertex retains its sample identity. The assembly
 * normal owner first gathers actual performed cell area vectors by parent,
 * accumulates them at original source vertices, then evaluates cut samples by
 * this one ordered stencil and scatters the shared field to both partitions.
 * Runtime refinement must carry its parent and source preimage explicitly.
 *
 * Equal generation strings do not establish matching geometry or valid source
 * coverage. The consuming assembly verifies plan/domain compatibility and the
 * performed cells. Changing connectivity or source bindings needs recompilation;
 * a single open partition cannot supply the other half's performed geometry.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBasisSourcePartition {
  /** Shared offline compiler generation; a label is not a validity certificate. */
  readonly generation: string;

  /** Count of original source vertices, not a coordinate or a metre value. */
  readonly originalVertices: number;

  /** Flat oriented source triples; every ID is in [0, originalVertices). */
  readonly parentTriangles: readonly number[];

  /**
   * Frozen ordered original-edge preimages. Entry i owns virtual sample
   * originalVertices+i = (1-t)*a+t*b, with distinct original IDs and 0<t<1.
   * Both partitions reuse the same ordered endpoints and t without reordering.
   */
  readonly intersections: readonly IAutoMovieHumanBasisSourceIntersection[];

  /**
   * Additional source samples inside an oriented parent triangle. Entry i owns
   * sample originalVertices+intersections.length+i. Coordinates [u,v] mean
   * corner0+u*(corner1-corner0)+v*(corner2-corner0), with finite u,v >= 0 and
   * u+v <= 1. The third weight is implicit, rather than a redundantly stored
   * triple whose floating sum must be repaired. Geometry and normal fields
   * use interpolateHumanBasisSourceTriangle with this same ordered chart.
   * Omission retains the edge-only source plan. The former experimental
   * barycentric triple property is not this two-coordinate input.
   */
  readonly refinements?: readonly IAutoMovieHumanBasisSourceChartPoint[];

  /**
   * One dimensionless normal-island ID per original parent corner, in the same
   * flat order as parentTriangles. Omission means domain zero everywhere.
   * A star is keyed by original geometry ID and this domain, allowing opposed
   * contact sides at the same physical sample to retain distinct normals.
   * This is normal incidence, independently of geometric parent coverage.
   */
  readonly parentNormalDomains?: readonly number[];

  /** Optional fixed-source differential transport; ancestral domains remain unchanged. */
  readonly normalTransport?: IAutoMovieHumanBasisNormalTransport;

  /** One canonical original or virtual sample ID per shared surface vertex. */
  readonly samples: readonly number[];

  /**
   * One raw parent-triangle ordinal selected for each surface vertex's normal.
   * The parent must occur in that vertex's actual cell incidence and contain
   * its source-preimage support. Its three corner-domain stars are interpolated
   * by those geometry weights. Ambiguous, missing or zero required stars refuse.
   * The smooth shared cut must select equivalent weighted normal keys on both
   * sides; a contact alias may select distinct incidence at the same sample.
   */
  readonly normalParents?: readonly number[];

  /** One parent-triangle ordinal per surface triangle, in surface index order. */
  readonly parents: readonly number[];
}
