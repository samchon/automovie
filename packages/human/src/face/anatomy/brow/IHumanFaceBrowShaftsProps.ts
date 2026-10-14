import type { IHumanFaceSkinChart } from "../skin/IHumanFaceSkinChart";
import type { IPortraitEyebrowBinding } from "./IPortraitEyebrowBinding";
import type { IPortraitEyebrowProfile } from "./IPortraitEyebrowProfile";

/**
 * One eyebrow's current material chart, shape-only native reference band and
 * authored shaft population. The reference defines finite guides; the chart
 * transports their retained native incidence to current metric and normals.
 *
 *
 * @evidence contracts/common.md#principled-implementation The current registered material chart transports finite shape-reference guides onto the same retained native triangle incidence.
 * @evidence contracts/common.md#clear-and-simple-design Chart and reference positions distinguish performed metric evaluation from source-owned guide construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored bends do not authorize performed-state nearest reseating or replace the requested shaft population.
 * @evidence contracts/common.md#meaningful-documentation Members identify current chart, reference metre frame, ordered boundaries, pre-thinning count and authored dimensions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceBrowShaftsProps is a TypeScript-only schema and executes no guide, surface or field algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceBrowShaftsProps declares inputs or results; copying and equivalence belong to its concrete producer/consumer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceBrowShaftsProps acquires no runtime state or handle; array, map and callback lifetimes remain with their owning operations.
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
