import type { IPortraitCraniumShape } from "./IPortraitCraniumShape";
import { IPortraitComponent } from "../../../surface/IPortraitComponent";
import { IPortraitComponentHost } from "../../../surface/IPortraitComponentHost";
import { IPortraitHeadPerformance } from "./IPortraitHeadPerformance";
import { IPortraitNeckShape } from "./IPortraitNeckShape";

/**
 * Reference head formation and optional observed skin-colour coordinates.
 * Preparation shares this input with buildPortraitHead. Appearance coordinates
 * are a material sampling basis, not a physical rest shape for a tissue solver.
 * Paired component identities and topology are validated before interpolation.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Supplies the common cranial and colour basis against which replaceable attachments are prepared.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Preserves region and replacement correspondence before producing a shared refined skin.
 */
export interface IPortraitHeadFormation {
  /** Reference cranial shape, shared by current and colour-reference assembly. */
  cranium?: IPortraitCraniumShape;
  /** Reference neck sections and crop, before optional continuation motion. */
  neck?: IPortraitNeckShape;
  /** Reference restoration and pose of newly appended cranial/cervical tissue. */
  performance?: IPortraitHeadPerformance;
  /** Observed-reference assembly and numerical linear RGB sampling. */
  appearance?: {
    host: IPortraitComponentHost;
    components: IPortraitComponent[];
    performance?: IPortraitHeadPerformance;
    sample: (reference: readonly number[]) => number[];
  };
}
