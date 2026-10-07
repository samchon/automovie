import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanFaceSkinHost } from "../skin/IHumanFaceSkinHost";
import type { IPortraitEyebrowBinding } from "./IPortraitEyebrowBinding";

/**
 * What the brow tint of one side is read from: the band on the skin, the
 * shafts that were emitted on it, and the two colours involved.
 *
 * @evidence contracts/common.md#principled-implementation Coverage is a ratio of two areas on the same skin state, so the record carries that state's host, the band on it and the shafts built on it.
 * @evidence contracts/common.md#clear-and-simple-design One record per side; colours arrive resolved, so the reader knows no material id.
 * @evidence contracts/common.md#meaningful-documentation Each member states its unit and origin.
 * @evidence contracts/modeling.md#spatial-conventions Positions are head-frame metres; colours are linear RGB in [0,1].
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
