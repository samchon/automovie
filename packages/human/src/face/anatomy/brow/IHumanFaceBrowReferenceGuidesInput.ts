import type { IPortraitEyebrowBinding } from "./IPortraitEyebrowBinding";
import type { IPortraitEyebrowProfile } from "./IPortraitEyebrowProfile";

/**
 * Native reference band and numerical shaft traits shared by source preparation
 * and runtime. These source positions are not a person's sculpting resource.
 *
 * @author Samchon
 */
export interface IHumanFaceBrowReferenceGuidesInput {
  /** Complete shape-only reference skin positions in head-frame metres. */
  positions: readonly number[];

  /** Source-native upper and lower implantation boundaries and side. */
  binding: IPortraitEyebrowBinding;

  /** Requested count before end-fade thinning. */
  count: number;

  /** Shaft traits with their existing millimetre and fraction meanings. */
  profile: IPortraitEyebrowProfile;
}
