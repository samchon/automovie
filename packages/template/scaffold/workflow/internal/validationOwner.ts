import type { IEvidenceClaim, IEvidenceConfig } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../AuthoredLayer";
import type { IProductionClaimOwner } from "../IProductionClaimOwner";
import type { IProductionConfigProps } from "../IProductionConfigProps";
import type { ProductionGatePass } from "../ProductionGatePass";
import type { IProductionValidationOwnership } from "./IProductionValidationOwnership";
import { productionConfigOwners } from "./productionConfigOwners";
import { productionValidationOwners } from "./productionValidationOwners";

/** Rejects clones, another module instance, and edits after factory capture. */
export function validationOwner(config: IEvidenceConfig): {
  props: IProductionConfigProps;
  owners: IProductionClaimOwner[];
} {
  const record: IProductionValidationOwnership | undefined =
    productionValidationOwners.get(config);
  const props: IProductionConfigProps | undefined =
    productionConfigOwners.get(config);
  if (record === undefined || props === undefined)
    throw new Error(
      "Pass validation requires the original config and its exact factory module instance.",
    );
  if (
    record.config !== JSON.stringify(config) ||
    record.props !== JSON.stringify(props) ||
    record.claims.length !== config.claims.length ||
    record.claims.some(
      (claim: IEvidenceClaim, index: number): boolean =>
        claim !== config.claims[index],
    )
  )
    throw new Error(
      "The original config or factory ownership changed after creation.",
    );
  return {
    props,
    owners: record.owners.map(
      (
        owner: IProductionClaimOwner,
      ): {
        index: number;
        kind: "generated" | "custom" | "review" | "verdict" | "support";
        authored?: true;
        layer: AuthoredLayer;
        pass: ProductionGatePass;
      } => ({ ...owner }),
    ),
  };
}
