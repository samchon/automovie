import type { IContractLocation } from "../../../internal/IContractLocation";
import { createReferenceRoot } from "../../../internal/createReferenceRoot";
import { createContractDirectory } from "./createContractDirectory";

/**
 * Resolves the reference root of the contract tree owning one family.
 *
 * The root stops above the family folder rather than descending into it, so a
 * citation address carries the family that owns it: `shared/principles/...`,
 * `language/naturalness/...`, and `work/...` are told apart by the address a
 * host writes, instead of colliding on the same relative file name. Only the
 * root differs between owners: the shared tree's `contracts/story`, reached
 * through `..` segments in a workspace, or the production's own
 * `docs/contracts`, so every citation address is the same in a workspace and
 * in a standalone production.
 *
 * The same local Markdown bytes are both pre-draft instructions and later
 * evidence targets. Config constructs the graph but owns no document mirror.
 *
 * @param contracts The production location and optional shared tree; read, not retained.
 * @param scope The contract family the reference addresses.
 * @returns The `/`-separated root relative to the production's configuration directory.
 *
 * @evidence contracts/development/implementation.md#principled-implementation createContractDirectory picks the owning tree for the family and createReferenceRoot expresses it relative to the production location, the directory native Evidence resolves reference roots against; family-qualified file addresses keep shared/language/work identity in every citation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Ownership and relative-root spelling each live with their own owner; this function only composes them for the shared, language and work reference factories.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The installed shared and production trees are the layout contracts; no fallback remote root, retired location, fixture path or copied contract bytes are introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of path operations, linear in the location and skills path lengths, without reading directories or file bytes.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure path computation coordinates no work across requests.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the returned string outlives the call.
 * @evidence contracts/development/common.md#meaningful-documentation The prose explains family-qualified addresses, the two owning roots, why only the root differs between owners, local Markdown ownership and the absence of a document mirror.
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
