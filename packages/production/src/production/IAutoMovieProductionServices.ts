import type { IAutoMovieBuildProjectOutput } from "@automovie/interface";

import type { AutoMovieProductionBuilder } from "./AutoMovieProductionBuilder";
import type { AutoMovieProductionOracleService } from "./AutoMovieProductionOracleService";
import type { AutoMovieProductionProject } from "./AutoMovieProductionProject";

/**
 * Project, compiler, oracle and fresh source status for one admitted namespace.
 *
 * @evidence contracts/common.md#principled-implementation One service bundle shares the same admitted project and authoring dependencies, so captures and currentness checks judge the namespace the builder compiled.
 * @evidence contracts/common.md#clear-and-simple-design The context constructs and caches this bundle by production id while each service owns its own compilation, measurement or capture operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A status callback observes fresh inputs before reusing an earlier gate answer, rather than treating a cached service handle as proof of current compilation.
 * @evidence contracts/common.md#meaningful-documentation States the shared namespace and each service's responsibility, with currentness behavior on the callable member.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface executes no operation; construction, compilation and source observation are costed by their owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Services share one admitted project and one retained-status closure per namespace; gate reuse depends on fresh matching source snapshots rather than service identity alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The context and callers retain one bundle per requested namespace; the status closure keeps at most one successful snapshot and answer, and host-owned capture disposal remains with the host.
 * @author Samchon
 */
export interface IAutoMovieProductionServices {
  /** Admitted tracked project for this exact namespace. */
  project: AutoMovieProductionProject;

  /** Deterministic compiler sharing the admitted project and authoring graph. */
  builder: AutoMovieProductionBuilder;

  /** Geometry and actual-frame oracle over this project's current compile. */
  oracle: AutoMovieProductionOracleService;

  /**
   * Observe source-gate inputs and execute source only when reuse is unproved.
   *
   * @evidence contracts/common.md#principled-implementation Fresh snapshots and actual gate reads prove equivalence before a retained successful result is reused; failures and undeclared executed modules prevent retention.
   * @evidence contracts/common.md#clear-and-simple-design The bundle exposes one status seam backed by the retained-source-status owner, shared by capture and publication guards.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cached service identity does not bypass observation or turn a failed or unreadable gate into success.
   * @evidence contracts/common.md#meaningful-documentation States fresh input observation and the condition for skipping authored source execution.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callable contract chooses no snapshot or compiler algorithm; acquireAutoMovieProductionSourceSnapshot and retainAutoMovieProductionSourceStatus own those costs.
   * @evidence contracts/performance.md#reuse-equivalent-work The closure reuses only successful output proved against current dependencies, comparing revision only when the executed gate read it.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains at most one snapshot and output for its service lifetime, replacing or clearing that state on each observation; file handles remain with the project readers.
   */
  buildStatus: () => IAutoMovieBuildProjectOutput;
}
