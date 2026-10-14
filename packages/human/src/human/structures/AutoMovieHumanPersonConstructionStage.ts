/**
 * Closed progress labels emitted by synchronous registered person construction: body preparation/skin evaluation, face construction with its admission report, combined skin and optional normal reference formation, then resident model validation. A label carries no geometry or final acceptance verdict. Later measurement observers/admission combination can still fail after model-validated; observer side effects/exceptions remain caller-owned and may stop the call.
 *
 * @evidence contracts/common.md#principled-implementation Four actual owner completion boundaries expose person construction progress without estimating execution or synthesizing anatomical outcomes.
 * @evidence contracts/common.md#clear-and-simple-design A closed label union separates reporting identity from source inputs, result geometry and admission records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts model-validated denotes resident validation only, not complete later callbacks, clinical acceptance or current worker/GPU health.
 * @evidence contracts/common.md#meaningful-documentation Prose states completion order, synchronous delivery and effectful/later-failure limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased label union executes no construction or stage-delivery algorithm; the builder/observer own their work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Label identity implements no event deduplication or construction cache; runtime consumers coordinate actual reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring labels acquires no result buffer, worker or callback task; delivery owners control any retained events.
 *
 * @author Samchon
 */
export type AutoMovieHumanPersonConstructionStage =
  | "body-evaluated"
  | "face-evaluated"
  | "skin-formed"
  | "model-validated";
