/**
 * Physical sample registration for one connected surface under a supplied namespace.
 *
 * `samples` holds one canonical sample ID per connected-surface vertex, in
 * vertex order, captured before any UV split. The region gatherer maps them
 * through the same source-to-UV table as positions, so attribute aliases of a
 * source point keep one identity. Published domains name the current figure
 * instance and source registration (`humanPhysicalSourceDomain`): a registered
 * generation or native-indexed fingerprint. Internal assembly may use a working
 * namespace; its publication owner must bind the retained samples to the actual
 * instance before they leave that assembly. The gatherer validates a nonblank
 * domain and dense safe IDs, without authenticating the namespace.
 *
 *
 * @evidence contracts/common.md#principled-implementation One canonical sample per connected-surface vertex is registered before UV splitting under its supplied namespace; publication owns the actual instance-and-source binding.
 * @evidence contracts/common.md#clear-and-simple-design Domain identity and ordered sample IDs are supplied separately from the region gatherer's source-to-UV resident mapping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts UV aliases preserve one physical answer; an internal working namespace cannot substitute for the publication owner's instance-and-registration binding.
 * @evidence contracts/common.md#meaningful-documentation The prose states registration timing and gather behavior while members require a nonblank domain and non-negative safe-integer IDs.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Connected-surface physical sample registration is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Connected-surface physical sample registration specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Connected-surface physical sample registration acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 * @author Samchon
 */
export interface IHumanPhysicalSampleRegistration {
  /** Nonblank namespace of every sample; publication owns actual instance-and-source registration. */
  domain: string;

  /** Non-negative safe-integer sample ID per connected-surface vertex. */
  samples: readonly number[];
}
