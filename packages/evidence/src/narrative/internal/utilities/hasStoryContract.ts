import fs from "node:fs";
import path from "node:path";

import type { IContractLocation } from "../../../internal/IContractLocation";
import { createContractDirectory } from "./createContractDirectory";

/**
 * Checks whether an optional bundled checklist exists at its citation address.
 *
 * @param contracts The production and its configured skills tree.
 * @param file A checklist path relative to `contracts/story`.
 * @returns Whether the current installation supplies the checklist.
 */
export function hasStoryContract(
  contracts: IContractLocation,
  file: string,
): boolean {
  return fs.existsSync(
    path.join(createContractDirectory(contracts, "shared"), file),
  );
}
