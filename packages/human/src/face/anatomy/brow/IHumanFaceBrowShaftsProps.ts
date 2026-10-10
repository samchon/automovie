import type { IHumanFaceSkinChart } from "../skin/IHumanFaceSkinChart";
import type { IPortraitEyebrowBinding } from "./IPortraitEyebrowBinding";
import type { IPortraitEyebrowProfile } from "./IPortraitEyebrowProfile";

/**
 * One eyebrow's current material chart, shape-only native reference band and
 * authored shaft population. The reference defines finite guides; the chart
 * transports their retained native incidence to current metric and normals.
 *
 * @author Samchon
 */
export interface IHumanFaceBrowShaftsProps {
  /** Current registered-band chart retaining native triangle continuation. */
  chart: IHumanFaceSkinChart;

  /** Shape-only head-frame metres defining the finite band, roots and guide-bend directions. */
  referencePositions: readonly number[];

  /** Side and ordered band boundaries as host-surface vertex identities. */
  binding: IPortraitEyebrowBinding;

  /** Requested shaft count before end-fade thinning. */
  count: number;

  /** Authored shaft dimensions and flow. */
  profile: IPortraitEyebrowProfile;
}
