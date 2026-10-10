import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanFaceSkinHost } from "../skin/IHumanFaceSkinHost";
import type { IPortraitEyebrowBinding } from "./IPortraitEyebrowBinding";

/**
 * What the brow tint of one side is read from: the band on the skin, the
 * shafts that were emitted on it, and the two colours involved.
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
