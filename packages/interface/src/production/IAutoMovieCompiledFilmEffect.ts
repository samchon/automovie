import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieCompiledEffect } from "./IAutoMovieCompiledEffect";
import { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";

/**
 * Compiler-owned film-global effect runtime consumed by preview and capture.
 *
 * The inner effect is the existing bounded deterministic stream. This wrapper
 * fixes its authority, full-rate clock, and builder identities so a persisted
 * runtime cannot be replayed against a different edit or on a proxy-local
 * frame clock.
 *
 * @author Samchon
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
  compileFingerprint: AutoMovieContentDigest;

  /** Current normalized edit identity. */
  editFingerprint: AutoMovieContentDigest;

  /** Exact reduced production frame rate. */
  frameRate: IAutoMovieProductionFrameRate;

  /** Inclusive film-global frame. */
  startFrame: number;

  /** Exclusive film-global frame. */
  endFrame: number;

  /** Existing bounded effect stream sampled by the engine and viewer. */
  effect: IAutoMovieCompiledEffect;

  /** Digest of every field above. */
  digest: AutoMovieContentDigest;
}
