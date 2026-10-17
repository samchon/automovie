import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { readInput } from "../io/readInput.ts";
import type { TrunkProtocol } from "./TrunkProtocol.ts";

/**
 * Reads the hash-bound private trunk protocol before source observations are emitted.
 *
 * @evidence contracts/common.md#principled-implementation Reads the manifest's trunkProtocol input through hash verification and admits finite dimensions, an explicit method and a qualification flag; a supplied bracket must contain its selected height.
 * @evidence contracts/common.md#clear-and-simple-design Owns protocol admission only; it neither selects a branch event nor changes geometry to fit a desired result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing provenance and invalid dimensions fail explicitly rather than inheriting an identity-specific default.
 * @evidence contracts/common.md#meaningful-documentation Names the required manifest entry and states that qualification metadata is preserved, not independently certified here.
 * @evidence contracts/performance.md#efficient-algorithms Reads and hashes the protocol once, checks a constant number of fields, and verifies any declared supporting input in O(b) time and transient memory for its b bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned admitted record is used for all section and guide producers in one run; no independent default crop is generated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous input helper closes its file read; only the parsed protocol is returned and no cache or handle survives.
 */
export function readTrunkProtocol(manifest: ReferenceManifest): TrunkProtocol {
  const value: unknown = readInput<unknown>(manifest, "trunkProtocol");
  if (typeof value !== "object" || value === null)
    throw new Error("Trunk protocol must be an object");
  const protocol: TrunkProtocol = value as TrunkProtocol;
  if (
    !Number.isFinite(protocol.lowerHeightMm) ||
    !Number.isFinite(protocol.spacingMm) ||
    protocol.spacingMm <= 0 ||
    typeof protocol.lowerBoundaryMethod !== "string" ||
    !protocol.lowerBoundaryMethod.trim() ||
    typeof protocol.lowerBoundaryQualified !== "boolean" ||
    !Number.isSafeInteger(protocol.validationIntervals) ||
    protocol.validationIntervals < 2 ||
    protocol.validationIntervals > 10_000
  )
    throw new Error(
      "Trunk protocol requires finite dimensions and explicit boundary grounds",
    );
  if (protocol.lowerBoundaryBracketMm !== undefined) {
    const bracket: [number, number] = protocol.lowerBoundaryBracketMm;
    if (
      !Array.isArray(bracket) ||
      bracket.length !== 2 ||
      !bracket.every(Number.isFinite) ||
      bracket[0] > protocol.lowerHeightMm ||
      bracket[1] < protocol.lowerHeightMm
    )
      throw new Error(
        "Trunk event bracket must contain the declared lower crop",
      );
  }
  if (protocol.lowerBoundaryInput !== undefined) {
    if (
      typeof protocol.lowerBoundaryInput !== "string" ||
      !protocol.lowerBoundaryInput
    )
      throw new Error("Trunk boundary provenance must name a manifest input");
    // Verify supporting bytes; the branch producer, not this loader, qualifies
    // their topology and the protocol's stated event correspondence.
    readInput<unknown>(manifest, protocol.lowerBoundaryInput);
  }
  return protocol;
}
