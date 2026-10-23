import type { IProductionConfigProps } from "./IProductionConfigProps";
import { productionConfigOwners } from "./internal/productionConfigOwners";

/** The returned graph and gate tooling share this exact config owner. */
export function getProductionEvidenceConfigProps(
  config: object,
): IProductionConfigProps {
  const props: IProductionConfigProps | undefined =
    productionConfigOwners.get(config);
  if (props?.lifecycle !== "independent-evidence-v1")
    throw new Error("This config does not use the evidence-only lifecycle.");
  return props;
}
