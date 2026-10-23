import type {
  IEvidenceInventory,
  IEvidenceSourceAddress,
  IEvidenceSourceDependency,
  IEvidenceSourceFile,
} from "@wrtnlabs/evidence";

import type { ProductionPathCapture } from "./ProductionPathCapture";
import { isProductionAuthoredPath } from "./isProductionAuthoredPath";

/**
 * Rejects physical or logical authoring aliases captured by a support population.
 *
 * @evidence contracts/common.md#principled-implementation Captured source IDs and physical aliases are checked alongside logical source/dependency addresses; support cannot consume an authoring source through a symlink, hard link or declared authoring path.
 * @evidence contracts/common.md#clear-and-simple-design The helper isolates one inventory's ownership check so support hosts and references share the same captured-boundary rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native IDs remain opaque and only captured OS identities establish protected hard-link ownership; no byte-equivalence or live filesystem inference bypasses the boundary.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies physical and logical alias rejection and the error explains the scoped-work-claim alternative.
 * @evidence contracts/performance.md#efficient-algorithms Flattening addresses/dependencies requires O(p) temporary entries; each path may scan a saved alias list of a entries and b boundaries, for O(p*(a+b)) path comparisons plus path-string work. Source-ID membership uses sets.
 * @evidence contracts/performance.md#reuse-equivalent-work The immutable capture's alias table and protected-ID set are reused for every support inventory; this helper owns no independently cached result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary path arrays are limited by the supplied inventory and discarded on return or throw; no filesystem handle, running task or module-retained state is acquired.
 */
export function assertSupportInventory(
  inventory: IEvidenceInventory,
  capture: ProductionPathCapture,
  authored: Set<string>,
): void {
  const paths: string[] = [
    ...inventory.sources.flatMap((source: IEvidenceSourceFile): string[] => [
      source.physicalPath,
      ...source.addresses.map(
        (address: IEvidenceSourceAddress): string => address.absolute,
      ),
    ]),
    ...inventory.dependencies.map(
      (dependency: IEvidenceSourceDependency): string => dependency.path,
    ),
  ];
  const capturedAuthor: boolean = inventory.sources.some(
    (source: IEvidenceSourceFile): boolean =>
      authored.has(source.id) || capture.isProtectedSource(source.id),
  );
  const protectedPath: boolean = paths.some((filename: string): boolean => {
    const physical: string = capture.resolve(filename);
    return (
      isProductionAuthoredPath(filename) ||
      isProductionAuthoredPath(physical) ||
      capture.boundaries.some(
        (boundary: string): boolean =>
          physical === boundary || physical.startsWith(`${boundary}/`),
      )
    );
  });
  if (capturedAuthor || protectedPath)
    throw new Error(
      "Support claim inventory consumes authored production inputs; use an exactly scoped work claim.",
    );
}
