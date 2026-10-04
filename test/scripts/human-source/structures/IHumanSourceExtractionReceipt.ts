import type { IHumanSourceExtractionFrame } from "./IHumanSourceExtractionFrame.ts";

/** The fields of the body `extraction-receipt.json` the compiler consumes. */
export interface IHumanSourceExtractionReceipt {
  frame: IHumanSourceExtractionFrame;
}
