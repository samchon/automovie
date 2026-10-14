

/**
 * Protocol prefix separating the commit-lock JSON owner token from unsupported resident bytes; both token creation and decoding use this spelling.
 */
export const projectCommitLockOwnerPrefix: ReturnType<() => "automovie-commit-lock:"> = "automovie-commit-lock:";
