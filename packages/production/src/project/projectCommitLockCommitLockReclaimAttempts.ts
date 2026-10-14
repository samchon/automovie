

/**
 * At most three dead-owner transfer attempts within one acquisition; retries can span transient native handle contention without repeatedly surveying on every two-millisecond pause.
 */
export const projectCommitLockCommitLockReclaimAttempts: number = 3;
