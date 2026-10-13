import { AutoMovieContentDigest } from "@automovie/interface";

/**
 * Current identities required when sampling a persisted film effect.
 *
 * A consumer establishes these four values from the compile manifest and the
 * timeline it holds, never from the runtime array itself, so a stale artifact
 * cannot vouch for its own currentness.
 *
 * @author Samchon
 */
export interface IAutoMovieFilmEffectCurrentIdentity {
  /** Current production identity. */
  production: string;
  /** Current film identity. */
  film: string;
  /** Current aggregate builder input. */
  compileFingerprint: AutoMovieContentDigest;
  /** Current normalized edit identity. */
  editFingerprint: AutoMovieContentDigest;
}
