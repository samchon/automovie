import type { IHumanSourceAcquisitionSource } from "./IHumanSourceAcquisitionSource.ts";

/**
 * `acquisition.json` of one work directory.
 *
 * @author Samchon
 */
export interface IHumanSourceAcquisition {
  lockSha256: string;
  observeOnly: boolean;
  sources: IHumanSourceAcquisitionSource[];
}
