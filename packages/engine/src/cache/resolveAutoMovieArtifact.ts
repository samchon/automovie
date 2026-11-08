import type { IAutoMovieArtifactResolution } from "./IAutoMovieArtifactResolution";
import type { IAutoMovieArtifactStore } from "./IAutoMovieArtifactStore";

/**
 * Read one keyed artifact, or compute and store it: the read-or-compute step
 * every stage cache shares.
 *
 * A stored entry is reused only after its bytes hash to the digest recorded at
 * write time; a failing entry is removed and recomputed, so a truncated or
 * replaced file never reaches a consumer. With `verify`, a valid entry is
 * recomputed anyway and the digests compared; a difference replaces the entry
 * and reports `mismatched` rather than letting the first writer win. The
 * computation must be a pure function of everything its key declares.
 *
 * @param store Storage port; read, written and asked to digest.
 * @param key A key from `composeAutoMovieArtifactKey`.
 * @param compute Produces the artifact when no valid entry exists or when verifying; a rejection propagates and stores nothing.
 * @param verify Recompute and compare even when a valid entry exists.
 * @returns The artifact, its content digest and the outcome.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A constructive trace with a content-verified value (Mokhov et al. 2018): the key stands for all inputs, the recorded digest proves the value is the one written, and the optional recomputation is Bazel's rebuild-and-compare audit that purges a mismatch.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One function owns the read, verify, compute and write order; key composition, planning and storage are separate modules.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A corrupt entry is recomputed rather than served, a mismatch is reported rather than hidden, and compute failures are not caught.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most one read, one digest of the stored bytes, one computation, one digest of its bytes and one write; digest cost is linear in artifact size.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares a stored artifact across runs only when the composed key matches and its content digest verifies; equivalence of the computation itself rests on the key declaring every input.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds at most the stored and the computed bytes during the call and returns one of them; the store owns any handles.
 * @evidence contracts/development/common.md#meaningful-documentation States verification, repair, audit behavior, the purity premise and failure effects.
 */
export async function resolveAutoMovieArtifact(
  store: IAutoMovieArtifactStore,
  key: string,
  compute: () => Promise<Uint8Array>,
  verify: boolean = false,
): Promise<IAutoMovieArtifactResolution> {
  let stored: IAutoMovieArtifactStore.IEntry | undefined =
    await store.read(key);
  let repaired: boolean = false;

  // Content verification: a reused entry must still hash to what was written.
  if (
    stored !== undefined &&
    (await store.digest(stored.bytes)) !== stored.digest
  ) {
    await store.remove(key);
    stored = undefined;
    repaired = true;
  }
  if (stored !== undefined && !verify)
    return { bytes: stored.bytes, digest: stored.digest, outcome: "reused" };

  const bytes: Uint8Array = await compute();
  const digest: string = await store.digest(bytes);
  if (stored !== undefined && stored.digest === digest)
    return { bytes, digest, outcome: "verified" };
  await store.write(key, { bytes, digest });
  return {
    bytes,
    digest,
    outcome:
      stored !== undefined ? "mismatched" : repaired ? "repaired" : "computed",
  };
}
