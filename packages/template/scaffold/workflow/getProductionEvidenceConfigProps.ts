import type { IProductionConfigProps } from "./IProductionConfigProps";
import { productionConfigOwners } from "./internal/productionConfigOwners";

/** The returned graph and gate tooling share this exact config owner. */
export function getProductionEvidenceConfigProps(
  config: object,
): IProductionConfigProps {
  const props: IProductionConfigProps | undefined =
    productionConfigOwners.get(config);
  if (props?.lifecycle !== "independent-evidence-v1")
    throw new Error(
      "Narrative checking requires the optional narrative.config.ts profile selected in evidence.config.ts; see workflow/README.md. Original factory ownership is required.",
    );
  return props;
}
