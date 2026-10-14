import type { IAutoMovieProductionEvidence } from "@automovie/evidence";

/**
 * The resident library snapshot projection supplied by completion fixtures.
 *
 * The planner reads sources and sourceOwners; root, configuration and design fields preserve the fixture's broader snapshot shape. The type authenticates no actual filesystem.
 *
 * @evidence contracts/common.md#principled-implementation Retains the fixture's evidence and source identity projection with literal protocol fields and nullable unreadable source digests; the planner selects sources and sourceOwners without validating the remaining protocol or graph fields.
 * @evidence contracts/common.md#clear-and-simple-design Names the existing fixture shape shared by its constructor and the source-plan alias, without adding a runtime wrapper or new production API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural type is a test seam and validates neither a runtime object nor the synthetic snapshot digest; behavioral expectations remain in its consumer tests.
 * @evidence contracts/common.md#meaningful-documentation Describes the fixed fixture protocol, declared source identities and unused snapshot digest so callers do not mistake this projection for complete physical acquisition.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type alias describes fields and chooses no executable algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased declaration coordinates no runtime requests or result reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type acquires and retains no runtime resources; its constructor and consumer own actual values.
 *
 * @author Samchon
 */
export type ICompletionSnapshot = Pick<
  IAutoMovieProductionEvidence,
  | "root"
  | "packageName"
  | "configuration"
  | "manifest"
  | "designBranches"
  | "designOwners"
  | "sourceOwners"
> & {
  /** Fixed fixture protocol version, not checked by the execution planner. */
  version: 1;

  /** Fixed resident snapshot protocol, not checked by the execution planner. */
  protocol: "automovie.library-authoring-snapshot.v1";

  /** Library-only shape used by these completion scenarios. */
  kind: "library";

  /** Selected source identities; a null digest represents missing bytes. */
  sources: readonly { path: string; digest: string | null }[];

  /** Synthetic fixture snapshot identity, not independently authenticated. */
  digest: string;
};
