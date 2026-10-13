import { MAX_FILES, fail } from "./referenceError";

/**
 * Append one already-admitted Markdown identity to the current inventory. The
 * exact 10,000th file is valid; the next refuses the complete result instead of
 * publishing a truncated population. The caller owns this mutable inventory.
 */
export function appendReferenceInventoryFile(files: string[], file: string): void {
  files.push(file);
  if (files.length > MAX_FILES)
    fail("RESOURCE_LIMIT", "Layer exceeds the 10,000 file limit.");
}
