import type { IPortraitEyebrowBinding } from "./IPortraitEyebrowBinding";
import type { IPortraitEyebrowProfile } from "./IPortraitEyebrowProfile";
import type { IHumanFaceSkinChart } from "../skin/IHumanFaceSkinChart";

/**
 * What one eyebrow's shaft population is built from: the skin it grows on,
 * the registered implantation band on that skin, and the authored population.
 *
 * @evidence contracts/common.md#principled-implementation The chart and positions belong to the same current native surface; registered band identities and inverse chart pieces address that skin.
 * @evidence contracts/common.md#clear-and-simple-design One record names every input of the shaft builder; nothing is read from ambient state.
 * @evidence contracts/common.md#meaningful-documentation Each member states its unit and owner.
 * @evidence contracts/modeling.md#spatial-conventions Skin positions are head-frame metres; the profile keeps its documented millimetres and fractions, and the shaft builder converts them once.
 *
 * @author Samchon
 */
export interface IHumanFaceBrowShaftsProps {
  /** Current registered-band chart retaining native triangle continuation. */
  chart: IHumanFaceSkinChart;

  /** Flat head-frame metre positions of the host surface in the state being built. */
  positions: readonly number[];

  /** Side and ordered band boundaries as host-surface vertex identities. */
  binding: IPortraitEyebrowBinding;

  /** Requested shaft count before end-fade thinning. */
  count: number;

  /** Authored shaft dimensions and flow. */
  profile: IPortraitEyebrowProfile;
}
