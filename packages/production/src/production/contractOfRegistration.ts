import { IAutoMovieDefinedShotContract, IAutoMovieShotContract } from "@automovie/interface";

/**
 * Return the measurable shot contract without its production id and source-module binding fields. The remaining nested values are borrowed references, not deep copies.
 *
 * @evidence contracts/common.md#principled-implementation Object rest removes exactly id and source while preserving the contract's remaining own enumerable properties for defineShot registration comparison.
 * @evidence contracts/common.md#clear-and-simple-design Shot source admission and defineShot construction share this one projection so production module metadata is kept outside the engine's measurable contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No measurable field is renamed or synthesized, and extra own enumerable fields would remain; structural contract admission is an upstream premise rather than a whitelist implemented here.
 * @evidence contracts/common.md#meaningful-documentation States the exact two removed fields, new outer record, nested aliasing and existing registration consumers.
 * @evidence contracts/performance.md#efficient-algorithms Object-rest copying is linear in the contract's own enumerable property count and allocates one outer object; nested contract arrays and records are not traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work Both registration consumers share the projection rule, but each call creates a fresh outer record because the contract may have changed; no projection cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned record and its borrowed nested references. No source module, file handle, task or cross-attempt state is acquired.
 */
export const contractOfRegistration: (contract: IAutoMovieShotContract) => IAutoMovieDefinedShotContract = (
  contract: IAutoMovieShotContract,
): IAutoMovieDefinedShotContract => {
  const { id: _id, source: _source, ...registration }: IAutoMovieShotContract = contract;
  return registration;
};
