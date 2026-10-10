import type { IHumanHeadNasalSectionRecipe } from "./IHumanHeadNasalSectionRecipe.ts";

/** Paired authored nasal vestibules under their original native source supports.
 * @author Samchon
 */
export interface IHumanHeadNasalRecipe {
  /** Prototype source convention and explicit unavailable clinical qualification. */
  qualification?: string;

  /** Native +X side. */
  left: IHumanHeadNasalSectionRecipe;

  /** Native -X side. */
  right: IHumanHeadNasalSectionRecipe;
}
