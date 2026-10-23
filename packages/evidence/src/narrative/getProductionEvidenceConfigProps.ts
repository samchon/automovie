import type { IProductionConfigProps } from "./IProductionConfigProps";
import { productionConfigOwners } from "./internal/productionConfigOwners";

/**
 * The returned graph and gate tooling share this exact config owner.
 *
 * @evidence contracts/common.md#principled-implementation The weak identity registry returns props only for a factory-owned config with the supported lifecycle; no serialized config is treated as proof of origin.
 * @evidence contracts/common.md#clear-and-simple-design One accessor exposes the same policy owner used by graph creation and gate tooling without adding provenance fields to user config.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown and unowned config objects throw; no optional file name, consumer label or cloned JSON reconstructs factory ownership.
 * @evidence contracts/common.md#meaningful-documentation The comment states shared graph/gate ownership and the error names the installed createEvidenceConfig API and original-config requirement.
 * @evidence contracts/performance.md#efficient-algorithms One weak-map lookup and lifecycle comparison take expected constant time; the result is the original props reference, not a copied graph.
 * @evidence contracts/performance.md#reuse-equivalent-work The factory-owned policy object is reused by exact config identity; callers needing mutation protection use validationOwner's captured comparison rather than this lookup alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This accessor retains no new state; the weak registry owns the existing policy while its config key is live, and no external resource is acquired.
 */
export function getProductionEvidenceConfigProps(
  config: object,
): IProductionConfigProps {
  const props: IProductionConfigProps | undefined =
    productionConfigOwners.get(config);
  if (props?.lifecycle !== "independent-evidence-v1")
    throw new Error(
      "Narrative checking requires createEvidenceConfig({ location, narrative: ... }) from @automovie/evidence and its original factory config. See the installed package README.",
    );
  return props;
}
