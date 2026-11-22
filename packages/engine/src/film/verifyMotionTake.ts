import type {
  IAutoMovieMotionTake,
  IAutoMovieMotionTakeAnchor,
} from "@automovie/interface";

/**
 * Verify a saved version 1 take against independently reconstructed production facts.
 *
 * Pass production identity, source, parent and freshly measured provenance before rebuilding motion. When an admitted cut has been prepared, pass its rederived anchor too. The ledger order is immaterial. A difference throws a diagnostic identifying the changed field or ledger key.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the admitted saved input, independently acquired facts, optional rederived anchor, comparison semantics and failures.
 * @evidence contracts/development/implementation.md#principled-implementation Compares exact stable ids, digests, versions, seeds and times; master identities are checked before the ledgers, each ledger is matched by unique key and the optional anchor is checked as a separate fact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Keeps file/runtime measurement in the host, schema validation in admitMotionTake and pairwise comparison here.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses every changed, missing or new input and provider; no stale digest or source hint is used to restore motion.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(N) time across N measured and saved ledger rows; each ledger creates and releases one temporary index.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Compares one set of current facts without loading or preparing a take.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Indexes current rows only for the duration of comparison and retains nothing.
 */
export function verifyMotionTake(
  take: IAutoMovieMotionTake,
  current: Omit<IAutoMovieMotionTake, "version" | "replay" | "anchor"> & {
    anchor?: IAutoMovieMotionTakeAnchor;
  },
): void {
  equal("production", take.production, current.production);
  equal("take", take.take, current.take);
  equal("source.module", take.source.module, current.source.module);
  equal("source.export", take.source.export, current.source.export);
  equal("parent.path", take.parent?.path, current.parent?.path);
  equal("parent.sha256", take.parent?.sha256, current.parent?.sha256);

  ledger(
    "files",
    take.provenance.files,
    current.provenance.files,
    "path",
    "sha256",
  );
  ledger(
    "providers",
    take.provenance.providers,
    current.provenance.providers,
    "id",
    "version",
  );
  ledger(
    "seeds",
    take.provenance.seeds,
    current.provenance.seeds,
    "id",
    "value",
  );

  if (current.anchor !== undefined) {
    const fields: readonly (keyof IAutoMovieMotionTakeAnchor)[] = [
      "sequence",
      "entry",
      "shot",
      "outputSeconds",
      "sourceSeconds",
      "side",
    ];
    for (const field of fields)
      if (take.anchor[field] !== current.anchor[field])
        throw new Error(`take-anchor: anchor.${field} changed since save`);
  }
}

/** Compare one independently measured persisted identity. */
function equal(path: string, saved: unknown, current: unknown): void {
  if (saved !== current)
    throw new Error(`take-provenance: ${path} changed since save`);
}

/** Match an independently measured ledger by stable key and compare values. */
function ledger<Key extends string, Value extends string>(
  path: string,
  saved: readonly Record<Key | Value, string>[],
  current: readonly Record<Key | Value, string>[],
  key: Key,
  value: Value,
): void {
  const measured: Map<string, string> = new Map();
  for (const row of current) {
    const address: string = row[key];
    if (measured.has(address))
      throw new Error(
        `take-provenance: current ${path} duplicate "${address}"`,
      );
    measured.set(address, row[value]);
  }
  for (const row of saved) {
    const address: string = row[key];
    if (!measured.has(address))
      throw new Error(`take-provenance: ${path} missing "${address}"`);
    equal(`${path}[${address}].${value}`, row[value], measured.get(address));
    measured.delete(address);
  }
  const added: string | undefined = measured.keys().next().value;
  if (added !== undefined)
    throw new Error(`take-provenance: ${path} added "${added}"`);
}
