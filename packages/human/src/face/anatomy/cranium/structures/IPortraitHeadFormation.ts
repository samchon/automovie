import { IPortraitComponent } from "../../../surface/structures/IPortraitComponent";
import { IPortraitComponentHost } from "../../../surface/structures/IPortraitComponentHost";
import type { IPortraitCraniumShape } from "./IPortraitCraniumShape";
import { IPortraitHeadPerformance } from "./IPortraitHeadPerformance";
import { IPortraitNeckShape } from "./IPortraitNeckShape";

/**
 * Reference head formation and optional observed skin-colour coordinates.
 * Preparation shares this input with buildPortraitHead. Appearance coordinates
 * are a material sampling basis, not a physical rest shape for a tissue solver.
 * Paired component identities and topology are validated before interpolation.
 *
 * @evidence contracts/common.md#principled-implementation The formation groups the reference cranium, neck, performance and the optional colour-reference appearance that preparePortraitHead and buildPortraitHead share, so current and colour-reference assembly use the same inputs.
 * @evidence contracts/common.md#clear-and-simple-design One optional record per concern.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitHeadFormation carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States that appearance coordinates are a material sampling basis and not a tissue rest shape, and that pairing is validated before interpolation.
 * @evidence contracts/modeling.md#part-identity-and-grouping It is a group that composes the cranium, neck, performance and appearance declarations and copies none of their values.
 * @author Samchon
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
