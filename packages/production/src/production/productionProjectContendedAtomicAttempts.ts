

/**
 * Five attempts cap retries for supported contended atomic filesystem errors.
 * The four retries request waits of 20, 40, 60 and 80 milliseconds, totaling
 * 200 milliseconds; filesystem work and OS scheduling have no wall-clock bound.
 *
 * The shared retry owner applies this scalar uniformly to eligible codes for rename and removal. An eligible code need not be transient; exhausting attempts preserves the failure. This scalar chooses no processing algorithm and retains no handle, payload population or task; the retry owner documents effect and wait cost.
 */
export const productionProjectContendedAtomicAttempts: number = 5;
