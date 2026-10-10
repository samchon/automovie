import type { IHumanHeadCervicalRecipe } from "./IHumanHeadCervicalRecipe.ts";
import type { IHumanHeadCranialRecipe } from "./IHumanHeadCranialRecipe.ts";
import type { IHumanHeadFacialRecipe } from "./IHumanHeadFacialRecipe.ts";

/** Shared exterior source-neutral chart with three named independent trait groups.
 * Its supports are authored conventions rather than inferred bone or tissue.
 * @author Samchon
 */
export interface IHumanHeadEnvelopeRecipe {
  /** Original prototype and unavailable clinical qualification. */
  qualification: string;

  /** Superior vault, temporal breadth and posterior/anterior cranial traits. */
  cranial: IHumanHeadCranialRecipe;

  /** Paired malar/buccal/mandibular and common chin traits. */
  facial: IHumanHeadFacialRecipe;

  /** Shared neck exterior and licensed joint-span differences. */
  cervical: IHumanHeadCervicalRecipe;
}
