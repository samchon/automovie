
import { type IProductionAssetInventoryContext } from "./IProductionAssetInventoryContext";

/**
 * Report declared resource uses that no actual model or motion inspection consumed.
 *
 * @evidence contracts/common.md#principled-implementation Visits each active model-resource and motion-resource declaration and checks the owner-plus-resource key against successful inspection accounting.
 * @evidence contracts/common.md#clear-and-simple-design Reverse resource accounting runs after all model inspections and before recipe/adoption joining, preserving original diagnostic order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A declared use alone is not an actual dependency; this phase invents neither a resource nor an owning asset when its consumed key is absent.
 * @evidence contracts/common.md#meaningful-documentation States production filtering, exact owner/resource keys and model versus motion diagnostic ownership.
 * @evidence contracts/performance.md#efficient-algorithms Visits U supplied uses with expected constant Set lookups and input-length key construction, without rescanning resource bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the same invocation's consumed-resource Sets; it does not cache those observations across later byte or ledger changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only appended diagnostic strings escape this phase; shared records/Sets remain with the inventory and no handle or task is acquired.
 *
 * @author Samchon
 */
export function validateProductionAssetResources(context: IProductionAssetInventoryContext): void {
  const { records, consumedModelResources, consumedMotionResources, diagnostic, productionId }: IProductionAssetInventoryContext = context;
for (const resource of records)
    for (const use of resource.uses)
      if (
        use.production === productionId &&
        use.consumer.kind === "model-resource" &&
        consumedModelResources.has(`${use.consumer.id}\0${resource.path}`) ===
          false
      )
        diagnostic(
          "asset-use-dangling",
          resource.path,
          `Asset "${resource.path}" is authorized as a model-resource of "${use.consumer.id}" but is not an actual LOD, buffer, or image dependency of that model.`,
        );
      else if (
        use.production === productionId &&
        use.consumer.kind === "motion-resource" &&
        consumedMotionResources.has(`${use.consumer.id}\0${resource.path}`) ===
          false
      )
        diagnostic(
          "asset-use-dangling",
          resource.path,
          `Asset "${resource.path}" is authorized as a motion-resource of "${use.consumer.id}" but is not an actual buffer or image dependency of that motion source.`,
        );
}
