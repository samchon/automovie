/**
 * Invoke a measurement reader only while the panel classifies its displayed person as admitted. A labelled construction draft receives an immediate rejected promise, which rows display instead of a reading. The ordinary measurement owner still evaluates admitted input and can refuse it; this gate does not prove any clinical validity or freeze the panel's state during an asynchronous read.
 *
 * @evidence contracts/common.md#principled-implementation The panel's current draft classification prevents ordinary whole-person measurement work on an explicitly refused construction; otherwise the exact supplied reader and arguments run unchanged.
 * @evidence contracts/common.md#clear-and-simple-design A single wrapper owns display-state gating and leaves measurement evaluation and later revision checks to their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Draft readings are reported unavailable rather than fabricated, and an admitted display classification does not replace the worker's input admission.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies immediate draft refusal and the limits of a call-time classification check.
 * @evidence contracts/performance.md#efficient-algorithms The gate performs constant state work plus forwarding its argument tuple; admitted calls retain the underlying evaluator's full cost while drafts start no numerical request.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The wrapper keeps no reading cache or in-flight merge; reader inputs and revision/admission identity remain the caller's and measurement owner's responsibility.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure borrows two callbacks until its section is discarded. It starts no draft task and imposes no admitted-task cap or cancellation; the measurement transport owns pending requests and shutdown.
 *
 * @author Samchon
 */
export function readConnectedPersonAdmitted<
  Arguments extends unknown[],
  Reading,
>(
  isDraft: () => boolean,
  read: (...input: Arguments) => Promise<Reading>,
): (...input: Arguments) => Promise<Reading> {
  return (...input: Arguments): Promise<Reading> =>
    isDraft()
      ? Promise.reject(
          new Error(
            "not read: the displayed person is a draft its owner did not accept",
          ),
        )
      : read(...input);
}
