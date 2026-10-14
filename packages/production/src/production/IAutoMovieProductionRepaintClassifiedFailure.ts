import { IAutoMovieRepaintAttemptOutput } from "./IAutoMovieRepaintAttemptOutput";
import { IAutoMovieRepaintAttemptRecord } from "./IAutoMovieRepaintAttemptRecord";
import { AutoMovieRepaintFailureClass } from "@automovie/interface";

/**
 * Separates failure class/message/status/cost from optional available-output metadata for one caught attempt outcome.
 *
 * @evidence contracts/common.md#principled-implementation Separates failure class/message/status/cost from optional available-output metadata for one caught attempt outcome.
 * @evidence contracts/common.md#clear-and-simple-design This internal shape connects guarded failure inspection to the executor's policy-specific retry decision without storing retry eligibility prematurely.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural shape introduces no runtime branch, provider substitution or fixture-specific behavior; runtime facts are admitted by its stated producer/consumer boundaries.
 * @evidence contracts/common.md#meaningful-documentation Available output is metadata, so classification does not retain raw provider bytes or publish rendition candidates.
 * @evidence contracts/performance.md#efficient-algorithms This structural type erases at runtime; this type carries classifier output only; disclosure admission remains guarded at the executor boundary.
 * @evidence contracts/performance.md#reuse-equivalent-work This erased shape shares the same admitted facts across its stated consumers; it creates no result cache or runtime equivalence/invalidation shortcut.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Available output is metadata, so classification does not retain raw provider bytes or publish rendition candidates.
 */
export interface IAutoMovieProductionRepaintClassifiedFailure {
  /** Carries a closed classified failure cause; retry eligibility is decided later against the unchanged policy. */
  failureClass: AutoMovieRepaintFailureClass;

  /** Carries succeeded/failed/cancelled/invalid/stale terminal classification rather than selecting a rendition. */
  status: IAutoMovieRepaintAttemptRecord["status"];

  /** Carries admitted diagnostic text; hostile inspection is contained by the owning classifier. */
  message: string;

  /** Carries finite nonnegative metered cost charged against the request ceiling, without estimating actual billing. */
  costUnits: number;

  /** Preserves nullable digest/byte-count/receipt metadata even for failed attempts; it owns no raw buffer. */
  availableOutput: IAutoMovieRepaintAttemptOutput | null;
}
