import { IAutoMovieBuildProjectOutput } from "@automovie/interface";

/**
 * Supply the oracle's synchronous current builder-status observation.
 *
 * @evidence contracts/common.md#principled-implementation The factory's current source-status closure supplies the builder output used for compile freshness.
 * @evidence contracts/common.md#clear-and-simple-design Status observation remains an injected seam separate from geometry and capture execution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The result is trusted as typed output; an omitted provider bypasses oracle freshness and a thrown provider failure propagates.
 * @evidence contracts/common.md#meaningful-documentation The callback is synchronous and its receiver remains the original oracle service when invoked there.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Fresh source snapshot/gate work executes in the factory-provided status owner, not this erased signature.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The status owner may reuse a proved successful snapshot; this callback type introduces no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The service retains the supplied closure until released and the closure's dependency lifetime belongs to the host/status owner.
 *
 * @author Samchon
 */
export type AutoMovieBuildStatusProvider = () => IAutoMovieBuildProjectOutput;
