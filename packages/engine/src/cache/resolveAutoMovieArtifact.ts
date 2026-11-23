import type {
  IAutoMovieArtifactResolution,
  IAutoMovieArtifactStore,
} from "@automovie/interface";

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
 * @param compute Produces the artifact when no valid entry exists or when
 *   verifying; a rejection propagates and stores nothing.
 * @param verify Recompute and compare even when a valid entry exists.
 * @returns The artifact, its content digest and the outcome.
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
