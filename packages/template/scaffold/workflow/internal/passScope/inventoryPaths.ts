import {
  type IEvidenceInventory,
  type IEvidenceSourceAddress,
  type IEvidenceSourceDependency,
  type IEvidenceSourceFile,
} from "@wrtnlabs/evidence";

/** Collects physical, logical, and absent-source dependency paths from one captured inventory. */
export function inventoryPaths(inventory: IEvidenceInventory): string[] {
  return [
    ...new Set([
      ...inventory.sources.flatMap((source: IEvidenceSourceFile): string[] => [
        source.physicalPath,
        ...source.addresses.map(
          (address: IEvidenceSourceAddress): string => address.absolute,
        ),
      ]),
      ...inventory.dependencies.map(
        (dependency: IEvidenceSourceDependency): string => dependency.path,
      ),
    ]),
  ].sort((left: string, right: string): 1 | -1 | 0 =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}
