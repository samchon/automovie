import type { IEvidenceClaim, IEvidenceConfig } from "@wrtnlabs/evidence";

import type { IProductionConfigProps } from "../IProductionConfigProps";
import { collectProductionClaims } from "./collectProductionClaims";

/**
 * Builds the full evidence config.
 *
 * Every layer contributes the same shared claims, recorded work requirements
 * add independent settings and treatments coverage claims when present, the settings outline adds
 * its installed topology, and the production's own claims follow them. A claim
 * whose reference population came back empty selects nothing, so it is dropped
 * rather than left to report an empty target.
 *
 * Reports retain every diagnostic so one inspection round can collect all
 * failures before related causes are repaired together.
 */
export function createGraphConfig(
  props: IProductionConfigProps,
): IEvidenceConfig {
  const claims: IEvidenceClaim[] = collectProductionClaims(props);

  return {
    claims,
  } satisfies IEvidenceConfig;
}
