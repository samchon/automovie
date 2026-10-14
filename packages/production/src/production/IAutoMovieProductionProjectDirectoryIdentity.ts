/**
 * Physical identity of one observed native directory.
 *
 * @evidence contracts/common.md#principled-implementation Preserves BigInt stat device and inode as decimal strings so directory ancestry guards compare exact observed identities without floating-point narrowing.
 * @evidence contracts/common.md#clear-and-simple-design Physical directory observation supplies this pair to ancestry snapshots; lexical path admission and generation rechecks remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Paths, timestamps and names do not substitute for either physical identity component; the type itself does not prove an observation remains current.
 * @evidence contracts/common.md#meaningful-documentation States component origin and exact string representation; supported filesystem stat semantics determine their identity guarantees.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The pair chooses no stat or ancestry traversal; the observation and guard functions own those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One observed pair supplies a later comparison operand, not permission to skip fresh directory admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Callers retain two scalar identities rather than a directory descriptor; the type owns no task or handle.
 * @author Samchon
 */
export interface IAutoMovieProductionProjectDirectoryIdentity {
  /** Decimal BigInt device identity from native stat. */
  device: string;

  /** Decimal BigInt inode identity from native stat. */
  inode: string;
}
