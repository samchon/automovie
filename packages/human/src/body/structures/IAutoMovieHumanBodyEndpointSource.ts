import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";
import type { IAutoMovieHumanEndpointGeometryContribution } from "../../common/structures/IAutoMovieHumanEndpointGeometryContribution";
import type { IAutoMovieHumanEndpointSourceDriver } from "../../common/structures/IAutoMovieHumanEndpointSourceDriver";
import type { IAutoMovieHumanBodyBasis } from "./IAutoMovieHumanBodyBasis";

/**
 * Actual external contributions beside the exact body whose gains drive them.
 * The composition owner supplies source arrays and channel bindings. The body
 * knows no person or face type and verifies exact body/partition/row coherence.
 *
 * @evidence contracts/common.md#principled-implementation Generation identity, exact body and partition data let admission compare the actual external contribution with its source.
 * @evidence contracts/common.md#clear-and-simple-design Composition supplies drivers and contributions while the body verifies their coherence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied body arrays are caller data; this record supplies no bundled person or replacement partition.
 * @evidence contracts/common.md#meaningful-documentation Members describe generation agreement, body comparison and endpoint-keyed contribution ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The external endpoint provenance declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The external endpoint provenance schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The external endpoint provenance type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyEndpointSource {
  /** Shared generation identity of both partitions. */
  generation: string;

  /** Exact body data, compared structurally with the constructor input. */
  body: IAutoMovieHumanBodyBasis;

  /** Actual external skin partition from that generation. */
  partition: IAutoMovieHumanBasisSourcePartition;

  /** Actual channel/endpoint bindings read by the composition owner. */
  drivers: IAutoMovieHumanEndpointSourceDriver[];

  /** Existing geometry contributions, keyed by their endpoint identity. */
  contributions: Record<string, IAutoMovieHumanEndpointGeometryContribution[]>;
}
