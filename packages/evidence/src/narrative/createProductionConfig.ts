import type { IEvidenceConfig } from "@wrtnlabs/evidence";

import type { IProductionConfigProps } from "./IProductionConfigProps";
import { captureProductionValidationOwners } from "./internal/captureProductionValidationOwners";
import { createGraphConfig } from "./internal/createGraphConfig";
import { productionConfigOwners } from "./internal/productionConfigOwners";

/**
 * Creates the evidence config for one production.
 *
 * It builds the shared evidence claims, then adds the production's extra claims.
 *
 * @evidence contracts/common.md#principled-implementation The native graph config is built first, then original config identity, serialized props and claim ownership are captured; later validation can reject clones and mutation.
 * @evidence contracts/common.md#clear-and-simple-design This factory owns graph composition and provenance registration together so a returned config cannot omit its ownership record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ownership is attached through weak registries instead of writable machine JSON; no config clone or label-based fallback is admitted.
 * @evidence contracts/common.md#meaningful-documentation The comment states this builds shared and production-specific claims; the supporting ownership capture enforces original-object validation semantics.
 * @evidence contracts/performance.md#efficient-algorithms Claim discovery/building is followed by serialization of config/props and a claim scan whose custom scope lookup can cost O(c*s) for c custom claims and s scopes; output and captured strings scale with the graph.
 * @evidence contracts/performance.md#reuse-equivalent-work The exact returned config becomes the lookup identity for subsequent validation; construction itself runs anew because props and discovered contract files may differ.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Weak registries retain props, serialized ownership and claim references while the returned config stays live; they impose no independent lifetime or fixed population limit and own no OS handles.
 */
export function createProductionConfig(
  props: IProductionConfigProps,
): IEvidenceConfig {
  const config: IEvidenceConfig = createGraphConfig(props);
  productionConfigOwners.set(config, props);
  captureProductionValidationOwners(config, props);
  return config;
}
