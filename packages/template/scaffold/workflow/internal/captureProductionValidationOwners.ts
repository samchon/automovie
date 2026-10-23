import type { IEvidenceClaim, IEvidenceConfig } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../AuthoredLayer";
import type { IProductionClaimOwner } from "../IProductionClaimOwner";
import type { IProductionConfigProps } from "../IProductionConfigProps";
import type { ProductionGatePass } from "../ProductionGatePass";
import { claimOwner } from "./claimOwner";
import { productionValidationOwners } from "./productionValidationOwners";

/** Captures factory ownership on the original config, before plan filtering. */
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
