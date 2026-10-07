import type { IPortraitEyebrowProfile } from "../anatomy/brow/IPortraitEyebrowProfile";

/** Explicit authored shaft population and dimensions on the shared brow band.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBrowPopulation extends IPortraitEyebrowProfile {
  /** Requested shaft count, integer 0..4096; not follicle density or a clinical count. */
  strandCount: number;
}
