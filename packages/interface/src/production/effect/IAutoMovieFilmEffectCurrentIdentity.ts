/**
 * Current identities a film-effect runtime is written under and sampled
 * against.
 *
 * A consumer establishes these four values from the compile manifest and the
 * timeline it holds, never from the runtime array itself, so a stale artifact
 * cannot vouch for its own currentness. `materializeProductionFilmEffects`
 * stamps exactly these four fields on every runtime it writes, and
 * `sampleProductionFilmEffects` refuses a runtime whose four fields differ.
 * Both first refuse a blank id or a digest that is not `sha256:` plus 64
 * lowercase hex digits.
 */
export interface IAutoMovieFilmEffectCurrentIdentity {
  /** Non-blank id of the production the runtimes belong to. */
  production: string;

  /** Non-blank finished-film id, the timeline's `id`. */
  film: string;

  /** Aggregate builder input digest, the timeline's `inputFingerprint`. */
  compileFingerprint: string;

  /**
   * Normalized edit digest derived from the current timeline by
   * productionFilmEffectEditFingerprint.
   */
  editFingerprint: string;
}
