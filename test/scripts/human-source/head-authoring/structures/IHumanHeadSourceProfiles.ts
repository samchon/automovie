import type { IHumanSourceNasalAxisReceipt } from "../../structures/IHumanSourceNasalAxisReceipt.ts";
import type { IHumanHeadEarSourceGuide } from "./IHumanHeadEarSourceGuide.ts";
import type { IHumanHeadNasalSocketGuide } from "./IHumanHeadNasalSocketGuide.ts";
import type { IHumanHeadSourceGuide } from "./IHumanHeadSourceGuide.ts";

/** Already admitted source profiles; readers retain their original bytes and provenance.
 * @author Samchon
 */
export interface IHumanHeadSourceProfiles {
  /** Shared cranial/facial/cervical source witnesses. */
  sourceGuide: IHumanHeadSourceGuide;

  /** Paired pinna region and shared-root authority. */
  earGuide: IHumanHeadEarSourceGuide;

  /** Frozen original nasal socket selections. */
  nasalSocket: IHumanHeadNasalSocketGuide;

  /** Registered native normal-cone extrusion directions. */
  nasalAxis: IHumanSourceNasalAxisReceipt;

  /** Optional source exterior; absence refuses an explicit exterior request. */
  nasalExteriorGuide?: IHumanHeadSourceGuide;
}
