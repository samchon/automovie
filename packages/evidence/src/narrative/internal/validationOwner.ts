import type { IEvidenceClaim, IEvidenceConfig } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../AuthoredLayer";
import type { IProductionClaimOwner } from "../IProductionClaimOwner";
import type { IProductionConfigProps } from "../IProductionConfigProps";
import type { ProductionGatePass } from "../ProductionGatePass";
import type { IProductionValidationOwnership } from "./IProductionValidationOwnership";
import { productionConfigOwners } from "./productionConfigOwners";
import { productionValidationOwners } from "./productionValidationOwners";

/**
 * Rejects clones, another module instance, and edits after factory capture.
 *
 * @evidence contracts/common.md#principled-implementation Both weak factory registries must recognize the exact config; captured serialized config/props and every original claim reference/order are compared before copied owners are returned.
 * @evidence contracts/common.md#clear-and-simple-design This single provenance guard serves all public owner access and scope classification, avoiding mutable provenance fields on the config.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Clones, edits and another module instance fail instead of recovering by labels, equivalent JSON or altered claim order.
 * @evidence contracts/common.md#meaningful-documentation The comment names clone/module/mutation rejection and the error explains the original factory-instance requirement.
 * @evidence contracts/performance.md#efficient-algorithms Config/props serialization scans their total JSON size, claim-reference validation scans n claims and copying scans n owners; temporary strings and returned records require proportional memory.
 * @evidence contracts/performance.md#reuse-equivalent-work Captured owner records are reused by original config identity, but mutation checks run on every request because caller objects are editable.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned owners are copied and caller-owned; local serialization strings expire after the call while weak registries own snapshots only as long as the config remains live.
 */
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
