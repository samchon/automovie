import type { IHumanSourceAcquisition } from "./IHumanSourceAcquisition.ts";

/** One captured work receipt, separate from portable source content identity.
 * Download/run locators remain run evidence. Its original bytes are rechecked
 * before publication instead of being reread as a different acquisition.
 * @author Samchon
 */
export interface IHumanSourceAcquisitionReading {
  acquisition: IHumanSourceAcquisition;
  sha256: string;
  verifyUnchanged(): void;
}
