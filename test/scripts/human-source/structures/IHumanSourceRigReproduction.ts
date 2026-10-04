import type { IHumanSourceLoss } from "./IHumanSourceLoss.ts";
import type { IHumanSourceReproductionRow } from "./IHumanSourceReproductionRow.ts";

/**
 * Body neutral, landmark and rig reproduction. `freshWeights` holds the
 * extractor-stored weights of every source vertex (`[slot, weight]` rows) so
 * vertices the published body never had can be skinned from upstream.
 *
 * @author Samchon
 */
export interface IHumanSourceRigReproduction {
  rows: IHumanSourceReproductionRow[];
  losses: IHumanSourceLoss[];
  freshWeights: [string, number][][];
  checks: Record<string, number | boolean | string>;
}
