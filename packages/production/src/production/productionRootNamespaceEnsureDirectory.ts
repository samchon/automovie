import type { Stats } from "node:fs";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { productionRootNamespaceReleaseCoordinates } from "./productionRootNamespaceReleaseCoordinates";
import { productionRootNamespaceAcquireCreationCoordinates } from "./productionRootNamespaceAcquireCreationCoordinates";
import { productionRootNamespaceLstatOrNull } from "./productionRootNamespaceLstatOrNull";

/**
 * Resolve an existing directory or create missing ancestors through physical-parent creation fences. Existing parent aliases may resolve through realpath; new names refuse linked or nondirectory collisions.
 *
 * @evidence contracts/common.md#principled-implementation Recursive parent resolution establishes a real parent before fencing and creating one child, with physical identity checked by the shared creation owner.
 * @evidence contracts/common.md#clear-and-simple-design The parent walk owns missing-directory construction, and each recursion level scopes its short creation locks around one mkdir/realpath operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A filesystem root without a usable directory refuses; an existing path is followed only under the established parent-directory semantics, while new child collisions reject links.
 * @evidence contracts/common.md#meaningful-documentation Explains existing alias resolution, missing-ancestor creation and collision refusal, including that already created ancestors are not rolled back after later failure.
 * @evidence contracts/performance.md#efficient-algorithms For D missing ancestors, recursion and creation fencing perform O(D) scopes and recursion frames, plus path manipulation and hashing driven by ancestor spellings. Retained path text follows the sum of those spellings rather than only D; native wait and token work accrue per scope.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses each resolved parent inside its child attempt without caching future physical identity or replacing a directory with an equivalent path string.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each creation scope attempts reverse lock retirement in finally; native failures can retain fences under the void release contract. Created directories can persist on later refusal, and no independent directory rollback or retained handle is provided.
 */
export const productionRootNamespaceEnsureDirectory: (directory: string) => string = (directory: string): string => {
  const linked: Stats | null = productionRootNamespaceLstatOrNull(directory);
  if (linked !== null) {
    if (fileSystem.statSync(directory).isDirectory() === false)
      throw new Error(
        `Production project parent "${directory}" is not a directory.`,
      );
    return fileSystem.realpathSync(directory);
  }
  const parent: string = path.dirname(directory);
  if (parent === directory)
    throw new Error(
      `Production project parent "${directory}" does not exist as a physical directory.`,
    );
  const parentReal: string = productionRootNamespaceEnsureDirectory(parent);
  const physical: string = path.join(parentReal, path.basename(directory));
  const locks: { path: string; token: string; }[] = productionRootNamespaceAcquireCreationCoordinates(
    parentReal,
    path.basename(directory),
  );
  try {
    const current: Stats | null = productionRootNamespaceLstatOrNull(physical);
    if (current === null) fileSystem.mkdirSync(physical);
    else if (
      current.isSymbolicLink() ||
      fileSystem.statSync(physical).isDirectory() === false
    )
      throw new Error(
        `Production project parent "${directory}" is not a physical directory.`,
      );
    return fileSystem.realpathSync(physical);
  } finally {
    productionRootNamespaceReleaseCoordinates(locks);
  }
};
