import type { IHumanFaceSkinChart } from "../skin/IHumanFaceSkinChart";
import type { IPortraitEyebrowBinding } from "./IPortraitEyebrowBinding";
import type { IPortraitEyebrowProfile } from "./IPortraitEyebrowProfile";

/**
 * One eyebrow's current material chart, shape-only native reference band and
 * authored shaft population. The reference defines finite guides; the chart
 * transports their retained native incidence to current metric and normals.
 *
 * @evidence contracts/common.md#principled-implementation Shape-only reference positions and the current chart share original native incidence; the reference defines guides while the chart alone supplies current geometry and metric.
 * @evidence contracts/common.md#clear-and-simple-design One record names every input of the shaft builder; nothing is read from ambient state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original native binding and reference positions accompany the existing profile; no performed-frame fallback supplies guide registration.
 * @evidence contracts/common.md#meaningful-documentation Each member states its unit and owner.
 * @evidence contracts/modeling.md#spatial-conventions Reference and current positions share head-frame metres; the profile retains millimetres and fractions, converted by the reference-guide and shaft owners.
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
