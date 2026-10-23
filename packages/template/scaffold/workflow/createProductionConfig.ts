import type { IEvidenceConfig } from "@wrtnlabs/evidence";

import type { IProductionConfigProps } from "./IProductionConfigProps";
import { captureProductionValidationOwners } from "./internal/captureProductionValidationOwners";
import { createGraphConfig } from "./internal/createGraphConfig";
import { productionConfigOwners } from "./internal/productionConfigOwners";

/**
 * Creates the evidence config for one production.
 *
 * It builds the shared evidence claims, then adds the production's extra claims.
 */
export function createProductionConfig(
  props: IProductionConfigProps,
): IEvidenceConfig {
  const config: IEvidenceConfig = createGraphConfig(props);
  productionConfigOwners.set(config, props);
  captureProductionValidationOwners(config, props);
  return config;
}
