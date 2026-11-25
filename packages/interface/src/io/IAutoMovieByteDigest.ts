/**
 * Identity of an immutable sequence of stored bytes, independent of its
 * encoding. The publisher computes SHA-256 over exactly `bytes` bytes: an
 * archive receipt identifies compressed bytes, while a JSON receipt identifies
 * UTF-8 JSON bytes. Readers verify both fields against acquired bytes before
 * reuse. The mutable receipt record neither freezes storage nor performs
 * verification itself.
 */

export interface IAutoMovieByteDigest {
  /** SHA-256 of the exact artifact bytes, including compression when present. */
  sha256: string;

  /** Number of artifact bytes covered by sha256. */
  bytes: number;
}
