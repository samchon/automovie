import type { IHumanSourceAuthoredBinding } from "./IHumanSourceAuthoredBinding.ts";
import type { IHumanSourceAuthoredCutInput } from "./IHumanSourceAuthoredCutInput.ts";
import type { IHumanSourceSampleWeights } from "./IHumanSourceSampleWeights.ts";

/** One provider tree and its native rig support, with frozen original ownership.
 * @author Samchon
 */
export interface IHumanSourceAuthoredSkinInput extends IHumanSourceAuthoredCutInput {
  weights: IHumanSourceSampleWeights;
  bindings: readonly IHumanSourceAuthoredBinding[];
}
