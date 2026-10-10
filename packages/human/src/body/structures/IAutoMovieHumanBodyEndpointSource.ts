import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";
import type { IAutoMovieHumanEndpointGeometryContribution } from "../../common/structures/IAutoMovieHumanEndpointGeometryContribution";
import type { IAutoMovieHumanEndpointSourceDriver } from "../../common/structures/IAutoMovieHumanEndpointSourceDriver";
import type { IAutoMovieHumanBodyBasis } from "./IAutoMovieHumanBodyBasis";

/**
 * Actual external contributions beside the exact body whose gains drive them.
 * The composition owner supplies source arrays and channel bindings. The body
 * knows no person or face type and verifies exact body/partition/row coherence.
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
