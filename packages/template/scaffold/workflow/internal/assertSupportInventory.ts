import type {
  IEvidenceInventory,
  IEvidenceSourceAddress,
  IEvidenceSourceDependency,
  IEvidenceSourceFile,
} from "@wrtnlabs/evidence";

import { canonicalProductionPath } from "../canonicalProductionPath";
import { isProductionAuthoredPath } from "./isProductionAuthoredPath";

/** Rejects physical or logical authoring aliases captured by a support population. */
export function assertSupportInventory(
  inventory: IEvidenceInventory,
  boundaries: string[],
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
    (source: IEvidenceSourceFile): boolean => authored.has(source.id),
  );
  const protectedPath: boolean = paths.some((filename: string): boolean => {
    const physical: string = canonicalProductionPath(filename);
    return (
      isProductionAuthoredPath(filename) ||
      boundaries.some(
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
