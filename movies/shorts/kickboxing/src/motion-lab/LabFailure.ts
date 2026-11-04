/**
 * Preserve an already computed failed stage without recomputing geometry after rollback.
 * @evidence contracts/common.md#implementation-and-ownership Copies the producer's existing observation and original nested cause into detached plain data. No fitting, sampling, target change or admission decision occurs at this error boundary.
 * @evidence contracts/common.md#authoring-interface Stage names identify body, arm, evaluation or selection. The caller captures its raw request/native result before restoring a transaction; a later actor mutation cannot rewrite this Error.cause.
 */
export namespace LabFailure {
  /**
   * Attach the immutable failure record to a new contextual error.
   * @evidence contracts/common.md#implementation-and-ownership Structured cloning makes the original goals, applied pose, solver result, load checks and source-fit failure independent of the reused actor. Existing producer cause remains separately visible.
   * @evidence contracts/common.md#authoring-interface Only detached cloneable observations are accepted; message and stack remain with their original error while the new stage is explicit.
   */
  export function error(
    stage: string,
    error: unknown,
    observation: object,
  ): Error {
    return new Error(error instanceof Error ? error.message : String(error), {
      cause: structuredClone({
        stage,
        observation,
        producerCause: error instanceof Error ? error.cause : undefined,
      }),
    });
  }
}
