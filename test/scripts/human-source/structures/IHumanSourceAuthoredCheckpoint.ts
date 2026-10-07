import type { IHumanSourceLidSeatReceipt } from "./IHumanSourceLidSeatReceipt.ts";
import type { IHumanSourceOrbitalSkinReceipt } from "./IHumanSourceOrbitalSkinReceipt.ts";
import type { IHumanSourceExcludedRegionReceipt } from "./IHumanSourceExcludedRegionReceipt.ts";
import type { IHumanSourceEditReceipt } from "./IHumanSourceEditReceipt.ts";

/** Completed source components; the full-stage physical refusal stays explicit.
 * @author Samchon
 */
export interface IHumanSourceAuthoredCheckpoint {
  bodyNeutralReceipt: Record<string, unknown>;
  lidSeatReceipt: IHumanSourceLidSeatReceipt;
  orbitalSkinReceipt: IHumanSourceOrbitalSkinReceipt;
  excludedRegionReceipts: IHumanSourceExcludedRegionReceipt[];
  editReceipt: IHumanSourceEditReceipt;
  movedSourceVertices: number[];
  refusal: string;
}
