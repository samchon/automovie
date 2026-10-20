/**
 * Current identities a film-effect runtime is written under and sampled against.
 *
 * A consumer establishes these four values from the compile manifest and the timeline it holds, never from the runtime array itself, so a stale artifact cannot vouch for its own currentness. `materializeProductionFilmEffects` stamps exactly these four fields on every runtime it writes, and `sampleProductionFilmEffects` refuses a runtime whose four fields differ. Both first refuse a blank id or a digest that is not `sha256:` plus 64 lowercase hex digits.
 *
 * @evidence contracts/common.md#principled-implementation Currentness is decided by exact string equality of four independently established identities, two ids and two SHA-256 content digests, so a runtime is current only when it was written for this production, film, compile input and normalized edit.
 * @evidence contracts/common.md#clear-and-simple-design One record carries the whole identity the writer stamps and the sampler compares, so neither function takes four loose arguments and both validate it through `validateProductionFilmEffectIdentity`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field is optional or wildcarded, and the digests are refused rather than normalized when they are uppercase or use another algorithm, so a malformed identity never reads as a stale match.
 * @evidence contracts/common.md#meaningful-documentation States that the consumer derives the values outside the runtime, which functions stamp and compare them, the non-blank and digest-format rules, and for each member where its value comes from.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; its validation is two trims and two anchored pattern tests, answered on `validateProductionFilmEffectIdentity`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Supplied per call by the caller; the engine stores no identity between materialization and sampling calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Four strings owned by the caller; the writer copies them by value into each runtime and keeps no reference to the record.
 */
export interface IAutoMovieFilmEffectCurrentIdentity {
  /** Non-blank id of the production the runtimes belong to. */
  production: string;

  /** Non-blank finished-film id, the timeline's `id`. */
  film: string;

  /** Aggregate builder input digest, the timeline's `inputFingerprint`. */
  compileFingerprint: string;

  /** Normalized edit digest derived from the current timeline by productionFilmEffectEditFingerprint. */
  editFingerprint: string;
}
