


/**
 * Exact retained host identity captured when a first pilot passes.
 *
 * @evidence contracts/common.md#principled-implementation A normalized relative path is paired with separate SHA-256 identities for authored body and ordered evidence tags, allowing reset validation to distinguish the two preserved obligations.
 * @evidence contracts/common.md#clear-and-simple-design One retained-host record binds location and both content identities rather than trusting a filename alone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both digests describe supplied authored source; no host name selects fixture bytes or an assumed review result.
 * @evidence contracts/common.md#meaningful-documentation Members specify normalized project-relative addressing and the exact body-versus-evidence digest denominators.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The retained-host identity schema executes no hashing algorithm itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A retained-host record is a receipt fact, not a cache of an in-flight filesystem read.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased retained-host type stores no receipt itself; createAutoMovieRetainedPilotHost returns path/body/tag digest strings whose lifetime belongs to the receipt caller rather than the source parser.
 *
 *
 * @author Samchon
 */
export interface IAutoMovieRetainedPilotHost {
  /** Normalized project-relative path. */
  path: string;

  /** SHA-256 of the UTF-8 encoding of supplied source text after structural evidence metadata is removed, rather than a raw-file byte hash. */
  bodySha256: string;

  /** SHA-256 of ordered parser-projected evidence declaration text joined by newlines; carrier decoration and wrapped rows are normalized by the parser. Equality preserves that declaration identity without judging its meaning. */
  evidenceTagSha256: string;
}
