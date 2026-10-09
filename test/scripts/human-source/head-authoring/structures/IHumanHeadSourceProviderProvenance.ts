import type { IHumanSourceSampleFile } from "../../structures/IHumanSourceSampleFile.ts";
import type { IHumanHeadSourceNasalSection } from "./IHumanHeadSourceNasalSection.ts";
import type { IHumanHeadSourceRecipe } from "./IHumanHeadSourceRecipe.ts";

/** Content receipt of actual whole-head source evaluation before packet compilation.
 * Numerical source authoring, generation admission and clinical acceptance are
 * distinct; this receipt preserves input byte identity and original lineage.
 * @author Samchon
 */
export interface IHumanHeadSourceProviderProvenance {
  schema: "automovie-authored-head-provider/1";
  stage: string;
  generationBasis: string;
  frame: string;
  nativeVertices: number;
  vertices: number;
  polygons: number;
  positionsSha256: string;
  numericRecipe: IHumanHeadSourceRecipe;
  recipeAuthority: Record<string, string>;
  recipeInputs: Record<string, IHumanSourceSampleFile>;
  envelope: Record<string, unknown>;
  earSections: Record<string, unknown>[];
  nasalSections: IHumanHeadSourceNasalSection[];
  invalidatedDescendants: string[];
  pending: string[];
}
