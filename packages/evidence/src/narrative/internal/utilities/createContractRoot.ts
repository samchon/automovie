import type { IContractLocation } from "../../../internal/IContractLocation";
import { createReferenceRoot } from "../../../internal/createReferenceRoot";
import { createContractDirectory } from "./createContractDirectory";

/**
 * Resolves the reference root of the contract tree owning one family.
 *
 * Bundled references such as `principles/screenplay.md` start at the skills
 * tree's `contracts/story`. Production-owned `language/...` and `work/...`
 * references start at `docs/contracts`. Each citation works the same way in a
 * workspace and in a standalone production.
 *
 * The same local Markdown bytes are both pre-draft instructions and later
 * evidence targets. Config constructs the graph but owns no document mirror.
 *
 * @param contracts The production location and optional shared tree; read, not
 *   retained.
 * @param scope The contract family the reference addresses.
 * @returns The `/`-separated root relative to the production's configuration
 *   directory.
 */
export function createContractRoot(
  contracts: IContractLocation,
  scope: "shared" | "language" | "work",
): string {
  return createReferenceRoot(
    contracts.location,
    createContractDirectory(contracts, scope),
  );
}
