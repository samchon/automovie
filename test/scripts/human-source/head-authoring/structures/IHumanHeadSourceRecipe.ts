import type { IHumanHeadEarRecipe } from "./IHumanHeadEarRecipe.ts";
import type { IHumanHeadEnvelopeRecipe } from "./IHumanHeadEnvelopeRecipe.ts";
import type { IHumanHeadNasalEnvelopeRecipe } from "./IHumanHeadNasalEnvelopeRecipe.ts";
import type { IHumanHeadNasalRecipe } from "./IHumanHeadNasalRecipe.ts";

/** Complete numerical shared-head source recipe consumed before root compilation.
 * This offline source recipe authors no personal mesh or clinical inverse.
 * @author Samchon
 */
export interface IHumanHeadSourceRecipe {
  /** Shared exterior convention and its independently named trait groups. */
  head: IHumanHeadEnvelopeRecipe;

  /** Paired pinna section differences. */
  ears: IHumanHeadEarRecipe;

  /** Paired native nasal lining construction dimensions. */
  nose: IHumanHeadNasalRecipe;

  /** Optional connected nasal exterior; absence differs from a zero request. */
  nasalExterior?: IHumanHeadNasalEnvelopeRecipe;
}
