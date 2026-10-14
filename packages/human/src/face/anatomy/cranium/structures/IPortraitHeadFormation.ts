import type { IPortraitCraniumShape } from "./IPortraitCraniumShape";
import type { IPortraitHeadAppearance } from "./IPortraitHeadAppearance";
import { IPortraitHeadPerformance } from "./IPortraitHeadPerformance";
import { IPortraitNeckShape } from "./IPortraitNeckShape";

/**
 * Reference head formation and optional observed skin-colour coordinates.
 * Preparation shares this input with buildPortraitHead. Appearance coordinates
 * are a material sampling basis, not a physical rest shape for a tissue solver.
 * Paired component identities and topology are validated before interpolation.
 *
 *
 * @evidence contracts/common.md#principled-implementation Reference cranial/neck controls and optional continuation restoration/pose accompany an independently corresponding colour-reference assembly.
 * @evidence contracts/common.md#clear-and-simple-design Geometry formation, continuation performance and appearance-coordinate sampling remain separate optional inputs to preparation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Appearance coordinates are a material basis, not tissue-solver rest geometry; component identity/topology correspondence must be admitted before colour interpolation.
 * @evidence contracts/common.md#meaningful-documentation The prose states the paired-reference purpose and members identify cranial/neck sharing, continuation ownership and observed linear-RGB sampling.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitHeadFormation is erased by TypeScript and evaluates no anatomy, geometry or material algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitHeadFormation declares caller data; concrete producers own copying and equivalence rather than this schema caching results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitHeadFormation starts no task or handle and retains no runtime state; actual callback/array lifetimes belong to its owners.
 *
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
  appearance?: IPortraitHeadAppearance;
}
