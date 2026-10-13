import {
  IAutoMovieDefinedShot,
  IAutoMovieShotDefinition,
} from "@automovie/interface";

/**
 * Register one coding-agent-authored shot under `id`.
 *
 * Returns a new record of exactly `id`, `scene`, `contract` and `build`; the
 * `id` argument is authoritative, so re-registering an existing
 * {@link IAutoMovieDefinedShot} under a new id yields the new id, and any other
 * field the definition object carries is dropped. Nothing is executed or
 * validated here, so module evaluation stays free of side effects;
 * {@link compileDefinedShot} reports a blank id, scene or beat and every later
 * fault as a structured diagnostic. The contract and builder are shared by
 * reference, not copied.
 *
 * @evidence contracts/common.md#principled-implementation Builds the registration as an object literal from the four declared fields, so the argument id cannot be overwritten by an `id` the definition carries at runtime, which an object spread after the id did; the premise is that `build` does not depend on `this` being the definition object, since `compileDefinedShot` calls it as a method of the returned record.
 * @evidence contracts/common.md#clear-and-simple-design A pure constructor that only attaches the address, leaving every check to `compileDefinedShot`, so authoring modules can import and list shots without running engine phases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Accepts any id and definition alike and inspects neither; validation is deferred by design to the compiler that reports it as diagnostics, not skipped.
 * @evidence contracts/common.md#meaningful-documentation States the returned fields, that the argument id wins over one inside the definition, that extra fields are dropped, that nothing runs or validates, where faults are reported, and that contract and builder are shared by reference.
 * @evidence contracts/performance.md#efficient-algorithms Constant time and one four-field allocation per registration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call registers one export once at module evaluation; there is no repeated work to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing itself; the returned record references the caller's contract and builder for as long as the caller keeps the registration.
 */
export function defineShot<Context>(
  id: string,
  definition: IAutoMovieShotDefinition<Context>,
): IAutoMovieDefinedShot<Context> { return ({
  id,
  scene: definition.scene,
  contract: definition.contract,
  build: definition.build,
}); }
