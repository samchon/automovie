import path from "node:path";
import { productionOpenListFiles } from "./productionOpenListFiles";

/**
 * Filter the inspection walk to entries whose native basename equals the selected name.
 *
 * @evidence contracts/common.md#principled-implementation Runs the same complete sorted DFS, then exact basename comparison; linked entries remain observations for the later guarded manifest reader.
 * @evidence contracts/common.md#clear-and-simple-design Render inspection uses this adapter over the existing tree walker.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A matching name alone establishes neither a regular manifest nor valid/current bytes.
 * @evidence contracts/common.md#meaningful-documentation Defines exact native basename selection and preserves the walk's ordering and absence policy.
 * @evidence contracts/performance.md#efficient-algorithms Includes the full E-entry walk and per-directory name sorting, then R native basename operations and exact comparisons for R returned regular/link paths. Path/name text contributes beyond population counts, and the filtered result adds up to R references.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the walker result within this call without introducing a cached render inventory.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Both walk and filtered arrays can coexist until return; only selected path strings transfer and readers own actual file handles.
 */
export const productionOpenListNamedFiles: (root: string, name: string) => string[] = (root: string, name: string): string[] => productionOpenListFiles(root).filter((file: string): boolean => path.basename(file) === name);
