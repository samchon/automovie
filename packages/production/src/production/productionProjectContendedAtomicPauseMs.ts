

/**
 * Base requested retry wait in milliseconds, multiplied by the completed attempt.
 *
 * The shared retry owner multiplies this 20 millisecond base by the failed attempt number before the next synchronous effect. It applies uniformly to configured contention codes and certifies neither transience nor elapsed-time bounds. Native blocking stays with the pause helper; this scalar chooses no algorithm and retains no native resource, byte buffer or scheduled task.
 */
export const productionProjectContendedAtomicPauseMs: number = 20;
