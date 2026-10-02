/**
 * Refuse a solve shard whose input identity cannot be verified before merge.
 *
 * The caller computes the complete basis digest once with
 * `bodyCorrectiveBasisDigest` and supplies it beside the revision name. The
 * solve command records both in its shard. Historical shards without a digest
 * remain diagnostic records; they need a fresh solve before publication. A
 * matching revision with different skin weights is refused just as a different
 * revision is. This checks the source of the rows, not their quality, and
 * mutates neither the input identity nor the shard. `label` identifies the
 * shard in every refusal, so a command merging several files reports the
 * exact input that needs a fresh solve.
 *
 * @evidence contracts/common.md#principled-implementation The shard must carry both the exact input revision and its complete payload fingerprint; a missing digest supplies no evidence of which same-named skin the rows were solved on and is refused.
 * @evidence contracts/common.md#clear-and-simple-design Three explicit refusals separate absent provenance, a revision mismatch and a payload mismatch before the merge can mutate an output candidate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Historical shards receive no bypass: their rows remain available for research but cannot be published without verified input provenance.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the caller-owned digest, producer, failure effects, read-only inputs and the geometric validation that remains the merge caller's responsibility.
 */
export function assertBodyCorrectiveBasis(
  input: { id: string; sha256: string },
  shard: { basis: string; basisSha256?: string },
  label: string,
): void {
  if (shard.basisSha256 === undefined)
    throw new Error(`${label}: the corrective shard has no input basis digest; solve it again.`);
  if (shard.basis !== input.id)
    throw new Error(
      `${label}: the corrective shard was solved on ${shard.basis}, not on ${input.id}.`,
    );
  if (shard.basisSha256 !== input.sha256)
    throw new Error(
      `${label}: the corrective shard's input basis payload differs; solve it again.`,
    );
}
