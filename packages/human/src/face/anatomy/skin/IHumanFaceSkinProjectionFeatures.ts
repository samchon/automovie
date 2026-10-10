import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import type { IHumanFaceSkinProjectionFeature } from "./IHumanFaceSkinProjectionFeature";

/**
 * Native nearest-feature candidates for one guide chord. A single local scale
 * keeps triangle construction independent of tiny relief widths; reconstruct
 * head-frame positions as origin + scale * projected local position.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinProjectionFeatures {
  /** Head-frame guide origin, metres. */
  origin: readonly number[];

  /** Positive coordinate normalization in metres. */
  scale: number;

  /** Free guide displacement in normalized coordinates. */
  direction: readonly IHumanExactFraction[];

  /** Actual vertex, edge and face candidates, in deterministic native order. */
  features: readonly IHumanFaceSkinProjectionFeature[];
}
