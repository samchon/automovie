import type { IHumanSourceAcquisitionSource } from "./IHumanSourceAcquisitionSource.ts";

/** `acquisition.json` of one work directory. */
export interface IHumanSourceAcquisition {
  lockSha256: string;
  observeOnly: boolean;
  sources: IHumanSourceAcquisitionSource[];
}
