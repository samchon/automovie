import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanFaceSkinHost } from "../skin/IHumanFaceSkinHost";
import type { IPortraitEyebrowBinding } from "./IPortraitEyebrowBinding";

/**
 * What the brow tint of one side is read from: the band on the skin, the
 * shafts that were emitted on it, and the two colours involved.
 *
 *
 * @evidence contracts/common.md#principled-implementation Actual emitted shaft silhouettes and the same host band determine a geometric coverage ratio applied to per-vertex RGB gains.
 * @evidence contracts/common.md#clear-and-simple-design Skin host/positions and boundary binding accompany shaft representation, two colours, opacity and caller-owned mutable gains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coverage remains an unresolved-population approximation; this shape supplies no measured optical density or exact visible-pixel average.
 * @evidence contracts/common.md#meaningful-documentation Members specify linear RGB, metre positions, tube/ribbon selection, opacity range and in-place gain ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceBrowTintProps is a TypeScript-only schema and executes no guide, surface or field algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceBrowTintProps declares inputs or results; copying and equivalence belong to its concrete producer/consumer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceBrowTintProps acquires no runtime state or handle; array, map and callback lifetimes remain with their owning operations.
 *
 * @author Samchon
 */
export interface IHumanFaceBrowTintProps {
  /** Host compiled on `positions`. */
  host: IHumanFaceSkinHost;

  /** Flat head-frame metre positions of the host surface. */
  positions: readonly number[];

  /** Side and ordered band boundaries as host-surface vertex identities. */
  binding: IPortraitEyebrowBinding;

  /** Emitted shaft meshes of this side. */
  shafts: readonly IAutoMovieMesh[];

  /** True when the shafts are flat ribbons; false for tubes. */
  ribbon: boolean;

  /** Linear RGB of the shafts as drawn. */
  fibre: readonly number[];

  /** Linear RGB base colour of the skin material under the band. */
  skin: readonly number[];

  /** Opacity of the shafts' finish in [0,1]; scales the coverage. */
  opacity: number;

  /** Output gains, flat RGB triples per host-surface vertex, multiplied in place. */
  gains: number[];
}
