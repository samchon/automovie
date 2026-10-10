import type { IHumanHeadEarSectionRecipe } from "./IHumanHeadEarSectionRecipe.ts";

/** Paired source pinnae with independently authored differences and one support width.
 * @author Samchon
 */
export interface IHumanHeadEarRecipe {
  /** Explicit prototype and clinical limitations retained with the recipe. */
  qualification: string;

  /** Positive source-private smooth fold support width, in millimetres. */
  foldSupportMillimetres: number;

  /** Native +X side. */
  left: IHumanHeadEarSectionRecipe;

  /** Native -X side. */
  right: IHumanHeadEarSectionRecipe;
}
