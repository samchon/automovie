import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionConstruction } from "./IProductionConstruction";
import type { NarrativeScope } from "./NarrativeScope";

/** Selects narrative claim families, their stages and additional native claims. */
export interface IProductionConfigProps {
  /**
   * Chooses four-layer long work, short brief plus screenplay, or standalone
   * assets.
   */
  mode: "long" | "short" | "asset";

  /** Engineering duties participate globally without a narrative parent. */
  supportClaims?: IEvidenceClaim[];

  /**
   * Points to the production package.
   *
   * Use its absolute directory so package and shared files resolve correctly.
   */
  location: string;

  /**
   * Points to the shared `.agents/skills` tree holding the bundled contracts.
   *
   * Use its absolute directory. A workspace passes its root tree, so the shared
   * story contracts resolve there, while the production's own `work` and
   * `language` contracts always stay under `<location>/docs/contracts`. Omit it
   * for a standalone production, whose shared contracts sit under its own
   * `.agents/skills`.
   *
   * @default path.join(location, ".agents", "skills")
   */
  skills?: string;

  /** Selects the complete work or one exact first-part pilot slice. */
  narrativeScope: NarrativeScope;

  /**
   * Selects each layer's construction claims and actual parent references.
   *
   * It owns what the layer says: the principles each unit answers for itself
   * and the population duties the layer's own material settles.
   */
  construction: IProductionConstruction;

  /**
   * Adds claims used only by this production.
   *
   * They follow the shared claims and do not replace them.
   */
  claims?: IEvidenceClaim[];
}
