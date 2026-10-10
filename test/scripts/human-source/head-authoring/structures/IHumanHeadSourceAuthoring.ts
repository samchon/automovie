import type { IHumanSourceSample } from "../../structures/IHumanSourceSample.ts";
import type { IHumanHeadSourceAuthoringManifest } from "./IHumanHeadSourceAuthoringManifest.ts";
import type { IHumanHeadSourceInputEntry } from "./IHumanHeadSourceInputEntry.ts";
import type { IHumanHeadSourceProfiles } from "./IHumanHeadSourceProfiles.ts";
import type { IHumanHeadSourceRecipe } from "./IHumanHeadSourceRecipe.ts";

/** One captured native source and its complete recipe/profile byte authority.
 * Evaluation borrows this state; new arrays and publication bytes are owned.
 * @author Samchon
 */
export interface IHumanHeadSourceAuthoring {
  /** Source-inputs directory whose relative locators own the consumed data. */
  directory: string;

  /** Original licensed complete sample, retaining native coordinates. */
  sample: IHumanSourceSample;

  /** Complete source-authoring manifest decoded from exact admitted bytes. */
  manifest: IHumanHeadSourceAuthoringManifest;

  /** SHA-256 of the consumed raw source-inputs.json bytes. */
  manifestSha256: string;

  /** Admitted source profiles, independent of a person's measurements. */
  profiles: IHumanHeadSourceProfiles;

  /** Actual numerical source recipe, preserving unknown clinical limitations. */
  recipe: IHumanHeadSourceRecipe;

  /** Captured raw files by resolved absolute address, for byte-stable IO. */
  captured: ReadonlyMap<string, Buffer>;

  /** Source-relative numerical recipe entries used by packet publication. */
  recipeEntries: Record<string, IHumanHeadSourceInputEntry>;

  /** Reobserve mutable inputs before committing a produced component. */
  verifyUnchanged(): void;
}
