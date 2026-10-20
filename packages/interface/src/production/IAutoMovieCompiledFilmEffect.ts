import { IAutoMovieCompiledEffect } from "./IAutoMovieCompiledEffect";
import { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";

/**
 * Compiler-owned film-global effect runtime consumed by preview and capture.
 *
 * The inner effect is the existing bounded deterministic stream. This wrapper fixes its authority, full-rate clock, and builder identities so a persisted runtime cannot be replayed against a different edit or on a proxy-local frame clock.
 *
 * @evidence contracts/common.md#principled-implementation A film-owned timeline-frame envelope binds the inner deterministic stream to production, film, compile and edit fingerprints plus a reduced rational frame rate and half-open integer frame interval; persisted-runtime validation recomputes both digests and the exact inner clock.
 * @evidence contracts/common.md#clear-and-simple-design The existing effect stream remains the simulation input, while the envelope owns global edit authority and frame mapping, preventing preview proxies from introducing another effect clock.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A content-valid runtime still needs current owner and edit identities; changing the frame rate or inner step cannot be hidden by replaying a digest from another timeline.
 * @evidence contracts/common.md#meaningful-documentation States explicit film authority, full-rate timeline clock, current builder identities, reduced rational rate, inclusive/exclusive frames and inner-plus-envelope digest coverage.
 */
export interface IAutoMovieCompiledFilmEffect {
  /** Film-effect runtime format. */
  version: 1;

  /** Explicit authority discriminator. */
  owner: "film";

  /** Compiler-owned full-rate clock discriminator. */
  clock: "timeline-frame";

  /** Current production identity. */
  production: string;

  /** Current builder-owned film identity. */
  film: string;

  /** Current aggregate builder input. */
  compileFingerprint: string;

  /** Current normalized edit identity. */
  editFingerprint: string;

  /** Exact reduced production frame rate. */
  frameRate: IAutoMovieProductionFrameRate;

  /** Inclusive film-global frame. */
  startFrame: number;

  /** Exclusive film-global frame. */
  endFrame: number;

  /** Existing bounded effect stream sampled by the engine and viewer. */
  effect: IAutoMovieCompiledEffect;

  /** Digest of every field above. */
  digest: string;
}
