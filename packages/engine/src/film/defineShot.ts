import {
  IAutoMovieDefinedShot,
  IAutoMovieShotDefinition,
} from "@automovie/interface";

/**
 * Register one coding-agent-authored shot under `id`.
 *
 * Returns a new record of exactly id, scene, contract and build; the id argument is authoritative and extra definition fields are dropped. The builder is not called and values are not validated here; compileDefinedShot owns those phases and their structured diagnostics. Reading definition fields can invoke author-supplied accessors, so registration does not sandbox module evaluation. The contract and builder are shared by reference.
 *
 * @evidence contracts/common.md#principled-implementation Builds the registration as an object literal from the four declared fields, so the argument id cannot be overwritten by an `id` the definition carries at runtime, which an object spread after the id did; the premise is that `build` does not depend on `this` being the definition object, since `compileDefinedShot` calls it as a method of the returned record.
 * @evidence contracts/common.md#clear-and-simple-design Attaches the address and reads the three definition fields without invoking the builder; compilation and validation remain compileDefinedShot's responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Applies the same field selection to every definition and defers validation to the compiler; ordinary property access retains JavaScript accessor behavior rather than pretending to isolate author code.
 * @evidence contracts/common.md#meaningful-documentation States authoritative id, selected fields, deferred validation/build, reference sharing and the accessor/module-execution boundary.
 * @evidence contracts/performance.md#efficient-algorithms Three field reads and one four-field allocation take constant local work; supplied property accessors can perform additional arbitrary work or throw.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call registers one export once at module evaluation; there is no repeated work to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing itself; the returned record references the caller's contract and builder for as long as the caller keeps the registration.
 */
export function defineShot<Context>(
  id: string,
  definition: IAutoMovieShotDefinition<Context>,
): IAutoMovieDefinedShot<Context> {
  return {
    id,
    scene: definition.scene,
    contract: definition.contract,
    build: definition.build,
  };
}
