import type { IHumanSourceExtractionFrame } from "./IHumanSourceExtractionFrame.ts";

/**
 * The fields of the body `extraction-receipt.json` the compiler consumes.
 *
 * @author Samchon
 */
export interface IHumanSourceExtractionReceipt {
  frame: IHumanSourceExtractionFrame;
}
