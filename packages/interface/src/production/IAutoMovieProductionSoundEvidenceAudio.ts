
/**
 * Final encoded audio identity retained by the sibling sound evidence record.
 *
 * @evidence contracts/common.md#principled-implementation A render-relative path, byte length and digest describe the encoded audio sibling; callers must compare these claims with resident bytes before treating the identity as verified.
 * @evidence contracts/common.md#clear-and-simple-design A small byte-identity record joins sound evidence to encoded output without embedding the audio payload or repeating its parsed codec facts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The closed audio/mp4 media type does not itself prove valid audio, and this pure type does not enforce nonzero size, digest syntax, container validity or a codec profile.
 * @evidence contracts/common.md#meaningful-documentation Defines render-root-relative sibling path, closed media type and exact encoded byte size and digest.
 * @author Samchon
 */
export interface IAutoMovieProductionSoundEvidenceAudio {
  /** Render-root-relative sibling audio path. */
  path: string;

  /** Closed final audio media type. */
  mediaType: "audio/mp4";

  /** Exact sibling audio byte length. */
  bytes: number;

  /** Digest of the exact sibling audio bytes. */
  digest: string;
}
