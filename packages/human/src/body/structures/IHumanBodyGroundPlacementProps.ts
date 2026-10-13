import type { IAutoMovieHumanBodyBasis } from "./IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBuild } from "./IAutoMovieHumanBodyBuild";

/**
 * The evaluated body and its source ground/foot registration for vertical
 * placement. The source floor remains in its rest frame.
 *
 * @evidence contracts/common.md#principled-implementation A completed body and the basis's fixed ground and foot registration supply vertical placement.
 * @evidence contracts/common.md#clear-and-simple-design The placement owner receives actual posed surfaces alongside their source reference.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source rest floor remains fixed instead of moving it to conceal a posed foot gap.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish rest registration from performed geometry and static model.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The ground placement inputs declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The ground placement inputs declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The ground placement inputs type has no runtime acquisition, retention or release operation.
 *
 * @author Samchon
 */
export interface IHumanBodyGroundPlacementProps {
  /** Basis that owns the ground landmark and foot attachment regions. */
  basis: IAutoMovieHumanBodyBasis;

  /** Actual final posed surfaces and the static model derived from them. */
  build: IAutoMovieHumanBodyBuild;
}
