/**
 * Record the loaded input identity beside a corrective solver's rows.
 *
 * The solve command computes the complete payload digest once, before dropping
 * any existing corrective, and calls this owner when constructing its shard.
 * The input is the caller's verified revision and digest, not a geometry or
 * source-code certificate. No row payload is read or changed here.
 *
 * @evidence contracts/common.md#principled-implementation The published field names carry the exact loaded revision and complete input fingerprint together rather than substituting the solver's changed working basis.
 * @evidence contracts/common.md#clear-and-simple-design One pure record construction owns the shard identity fields used by the real solve command.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller computes the fingerprint with the shared digest owner; this function introduces no second hashing formula or historical bypass.
 * @evidence contracts/common.md#meaningful-documentation States the real consumer, capture before corrective removal, caller-owned verified input and the limits of provenance.
 */
export function createBodyCorrectiveShardMetadata(input: {
  id: string;
  sha256: string;
}): { basis: string; basisSha256: string } {
  return { basis: input.id, basisSha256: input.sha256 };
}
