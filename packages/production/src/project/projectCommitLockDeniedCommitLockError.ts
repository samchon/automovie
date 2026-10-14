

/**
 * Preserve filesystem denial as the cause of an immediate path-specific refusal; waiting for a competing session cannot repair permission on that path.
 *
 * @evidence contracts/common.md#principled-implementation The acquisition owner routes EACCES/EPERM here, retaining the original error as cause while naming the refused path and permission capability.
 * @evidence contracts/common.md#clear-and-simple-design Permission explanation is separate from contention survey because no holder evidence is needed for a denied exclusive create.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not retry denial or fabricate an owner; permission guidance concerns the actual supplied path rather than assuming its location under an account home.
 * @evidence contracts/common.md#meaningful-documentation Names immediate denial, cause preservation and correction at the caller's actual revision or coordination path.
 * @evidence contracts/performance.md#efficient-algorithms Constructs one message in path/cause-description length, with constant field access and one retained Error.
 * @evidence contracts/performance.md#reuse-equivalent-work Retains the supplied original cause without rerunning the denied filesystem effect or sharing an error across distinct paths.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only an Error with a cause reference escapes; this refusal acquires no descriptor, local depth or physical lock.
 */
export const projectCommitLockDeniedCommitLockError: (lockPath: string, cause: unknown) => Error = (lockPath: string, cause: unknown): Error =>
  new Error(
    `AutoMovie cannot write the commit lock at "${lockPath}": the filesystem refused it (${(cause as NodeJS.ErrnoException).code}). This is a permission on that path rather than another session holding it, so waiting will not clear it. Grant this process write access to that path, or run it as the account that owns it.`,
    { cause },
  );
