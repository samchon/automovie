import crypto from "node:crypto";

/**
 * Construct the merge receipt from the verified input and exact output bytes.
 *
 * The merge command calls this after admitting the candidate through the body
 * builder. Its caller already checked every shard against the input identity
 * captured before merging. The receipt distinguishes that complete input
 * payload fingerprint from the uncompressed and compressed output byte hashes.
 * None certifies geometry or the source code that performed the merge. The
 * result owns its step array and shares its caller-owned step objects; no
 * input, step or byte array is mutated.
 *
 * @evidence contracts/common.md#principled-implementation Input payload identity is recorded separately from two exact output-byte identities and their byte counts, preserving the producer/derivative distinction.
 * @evidence contracts/common.md#clear-and-simple-design One pure construction owns all receipt fields, using one standard SHA-256 operation for each output byte population.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The input fingerprint is supplied by the verified shared digest producer and is not recalculated with a competing formula or inferred from a revision label.
 * @evidence contracts/common.md#meaningful-documentation States the admission and shard-verification preconditions, actual merge consumer, byte identities, ownership and provenance limits.
 */
export function createBodyCorrectiveMergeReceipt(props: {
  revision: string;
  input: { id: string; sha256: string };
  steps: readonly object[];
  document: Uint8Array;
  compressed: Uint8Array;
}): {
  basis: string;
  supersedes: string;
  inputSha256: string;
  steps: object[];
  uncompressedSha256: string;
  uncompressedBytes: number;
  compressedSha256: string;
  compressedBytes: number;
} {
  const sha = (bytes: Uint8Array): string =>
    crypto.createHash("sha256").update(bytes).digest("hex");
  return {
    basis: props.revision,
    supersedes: props.input.id,
    inputSha256: props.input.sha256,
    steps: props.steps.slice(),
    uncompressedSha256: sha(props.document),
    uncompressedBytes: props.document.byteLength,
    compressedSha256: sha(props.compressed),
    compressedBytes: props.compressed.byteLength,
  };
}
