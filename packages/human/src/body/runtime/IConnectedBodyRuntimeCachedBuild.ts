import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";

/**
 * The last admitted document text and its evaluated body. Reuse applies only
 * after parsing the next request, so matching text never bypasses admission.
 * The enclosing runtime fixes basis, constructor source context and whole-person readers for its lifetime. Its callers must keep those borrowed inputs unchanged; text equality does not establish equivalence after external mutation.
 *
 * @evidence contracts/common.md#principled-implementation Exact serialized text identifies the last completed evaluation only within one runtime's fixed source context, and canonical parsing still precedes reuse.
 * @evidence contracts/common.md#clear-and-simple-design One text/build pair represents the runtime's single-entry cache without a second geometry index or global cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reuse cannot bypass admission or claim equivalence for externally mutated basis or source dependencies.
 * @evidence contracts/common.md#meaningful-documentation The prose gives exact-text identity, parse-before-reuse and borrowed source immutability requirements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This cached-build interface performs no lookup or evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The cache policy is implemented by createConnectedBodyRuntime, not this erased pair schema.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The runtime closure retains and replaces the build; this type owns no disposal operation.
 *
 * @author Samchon
 */
export interface IConnectedBodyRuntimeCachedBuild {
  /** Exact serialized text that produced this build. */
  document: string;

  /** Evaluated geometry and readings for that text. */
  built: IAutoMovieHumanBodyBuild;
}
