import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";
import type { IAutoMovieHumanEndpointGeometryContribution } from "../../common/structures/IAutoMovieHumanEndpointGeometryContribution";
import type { IAutoMovieHumanEndpointSourceDriver } from "../../common/structures/IAutoMovieHumanEndpointSourceDriver";
import type { IAutoMovieHumanBodyBasis } from "./IAutoMovieHumanBodyBasis";

/**
 * Actual external contributions beside the exact body whose gains drive them.
 * The composition owner supplies source arrays and channel bindings. The body
 * knows no person or face type and verifies exact body/partition/row coherence.
 *
 * @evidence contracts/common.md#principled-implementation Supplies actual geometry and the exact body context instead of a resident permission set.
 * @evidence contracts/common.md#clear-and-simple-design Body identity, external partition, bindings and source rows form one admitted constructor input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing geometry cannot be supplied as an empty marker.
 * @evidence contracts/common.md#meaningful-documentation Separates composition projection from body admission.
 * @evidence contracts/modeling.md#parameter-channels Preserves body gain ownership and actual external bindings.
 * @evidence contracts/modeling.md#shared-boundaries External and body source partitions identify the same generation.
 * @evidence contracts/modeling.md#spatial-conventions Contributions retain source metre coordinates.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#rendered-observation Establishes no rendered acceptance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing channels own bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Converts no personal input.
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
