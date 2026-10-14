import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";
import type { IAutoMovieHumanPersonSourceChart } from "./IAutoMovieHumanPersonSourceChart";
import type { IAutoMovieHumanPersonSourceWeight } from "./IAutoMovieHumanPersonSourceWeight";

/**
 * An admitted pair of complementary source partitions: owned copies of both records, the size of their shared canonical sample namespace, and memoized chart and preimage lookups over it. Lookups return buffers borrowed read only from the plan. Everything is dimensionless. Captured records and lookup buffers must remain unchanged while this plan is used; their mutable array types provide no runtime freeze, and mutation can invalidate memoized charts.
 *
 * @evidence contracts/common.md#principled-implementation Complementary owned partition records preserve canonical sample identity; admission checks their ordered parent and cut tables before exposing affine lookups.
 * @evidence contracts/common.md#clear-and-simple-design One plan groups both admitted halves and their shared sample namespace, avoiding separate face and body correspondence authorities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The plan records admitted source charts without consumer-specific samples or replacement geometry; absent legacy partitions are handled by the validator.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes owned records from borrowed lookup buffers, states the namespace/count and makes the unchanged-capture premise explicit without claiming runtime freezing.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface declares partition metadata and lookup signatures; chart construction and preimage traversal belong to their named builders.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Memoization behavior is documented here, but equivalence by requested sample over captured metadata is implemented by the chart and preimage factories.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no state; the compiled partition operation owns captured records and requested-sample caches for its lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourcePartitionPlan {
  /** Owned copy of the face's source partition. */
  face: IAutoMovieHumanBasisSourcePartition;

  /** Owned copy of the body's source partition. */
  body: IAutoMovieHumanBasisSourcePartition;

  /** Count of canonical samples: originals, cut points and refinements. */
  sampleCount: number;

  /**
   * A sample's positive affine weights over original source vertices. The returned array is borrowed read-only; an out-of-domain sample refuses through the chart reader.
   *
   * @evidence contracts/common.md#principled-implementation Positive original-vertex coefficients expose the same admitted chart used for geometry and shading, preserving canonical source identity.
   * @evidence contracts/common.md#clear-and-simple-design One sample argument reads its sparse preimage without exposing the partition factory's internal maps.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This callback contract requires source-derived coefficients, with no fixture vertex list or fitted replacement positions.
   * @evidence contracts/common.md#meaningful-documentation The member states positive coefficients, borrowed read-only results and refusal for samples outside the captured domain.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A preimage signature selects no traversal; its factory evaluates only the chart's three original corners.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The callback type describes a sample lookup; requested-sample memoization belongs to the implementing preimage closure.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The preimage member acquires no cache itself; the containing captured plan owns returned coefficient buffers.
   */
  preimage: (sample: number) => readonly IAutoMovieHumanPersonSourceWeight[];

  /**
   * A sample's ordered original-vertex chart. Its buffers are borrowed read-only; a sample outside the captured canonical domain refuses.
   *
   * @evidence contracts/common.md#principled-implementation Ordered original corners and two affine coordinates preserve source interpolation for originals, edge cuts and refinements.
   * @evidence contracts/common.md#clear-and-simple-design A canonical sample ID is sufficient because the owning plan captures the source namespace and refinement metadata.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Chart lookup exposes captured source lineage rather than extrapolating an absent sample or substituting neutral geometry.
   * @evidence contracts/common.md#meaningful-documentation The member documents ordered corners, borrowed buffers and the canonical-domain refusal.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This chart signature chooses no branching strategy; original, cut and refinement dispatch belong to the chart factory.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Canonical sample memoization is implemented by the chart closure over captured metadata rather than by its interface member.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring chart lookup owns no retained map; the plan's implementing closure controls chart-buffer lifetime.
   */
  chart: (sample: number) => IAutoMovieHumanPersonSourceChart;
}
