import type { IEvidenceConfig } from "@wrtnlabs/evidence";

import type { IProductionConfigProps } from "./IProductionConfigProps";
import { createGraphConfig } from "./internal/createGraphConfig";

/** Creates a native Evidence configuration from the production's claim families. */
export function createProductionConfig(
  props: IProductionConfigProps,
): IEvidenceConfig {
  return createGraphConfig(props);
}
