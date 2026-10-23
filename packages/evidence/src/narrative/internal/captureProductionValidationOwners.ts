import type { IEvidenceClaim, IEvidenceConfig } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../AuthoredLayer";
import type { IProductionClaimOwner } from "../IProductionClaimOwner";
import type { IProductionConfigProps } from "../IProductionConfigProps";
import type { ProductionGatePass } from "../ProductionGatePass";
import { claimOwner } from "./claimOwner";
import { productionValidationOwners } from "./productionValidationOwners";

/**
 * Captures factory ownership on the original config, before plan filtering.
 *
 * @evidence contracts/common.md#principled-implementation Generated claims retrieve factory-recorded owners, custom claims match their explicitly validated scope, and repeated claim objects are rejected before original indices and serialized policy are captured.
 * @evidence contracts/common.md#clear-and-simple-design The capture boundary is the completed config array before native planning can remove disabled claims, preserving original authored indices for later diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ownership comes from original object identity and exact validated scope names; diagnostic labels and plan filtering never reconstruct it.
 * @evidence contracts/common.md#meaningful-documentation The comment states pre-filter ownership capture; stored config/props strings and original references explain later clone/mutation rejection.
 * @evidence contracts/performance.md#efficient-algorithms For n claims and c custom claims with s scope declarations, mapping costs O(n+c*s) plus config/props serialization bytes; custom and seen sets provide identity membership and duplicate detection.
 * @evidence contracts/performance.md#reuse-equivalent-work One captured ownership record is reused by exact config identity; all later accesses compare current serialization and claim object order before using it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The weak config-keyed registry retains captured strings, claim references and n owners while that config is live; local sets expire after this call and no fixed graph-size limit or OS handle exists.
 */
export function captureProductionValidationOwners(
  config: IEvidenceConfig,
  props: IProductionConfigProps,
): void {
  const custom: Set<IEvidenceClaim> = new Set(props.claims ?? []);
  const seen: Set<object> = new Set<object>();
  const owners: IProductionClaimOwner[] = config.claims.map(
    (claim: IEvidenceClaim, index: number): IProductionClaimOwner => {
      if (seen.has(claim))
        throw new Error("The authored claim array repeats a claim object.");
      seen.add(claim);
      if (!custom.has(claim)) return claimOwner(claim, index);
      const scope: {
        name: string;
        layer: AuthoredLayer;
        pass: ProductionGatePass;
      } = props.gate.claimScopes.find(
        (scope: {
          name: string;
          layer: AuthoredLayer;
          pass: ProductionGatePass;
        }): boolean => scope.name === claim.name,
      )!;
      return { index, layer: scope.layer, pass: scope.pass, kind: "custom" };
    },
  );
  productionValidationOwners.set(config, {
    config: JSON.stringify(config),
    props: JSON.stringify(props),
    claims: [...config.claims],
    owners,
  });
}
