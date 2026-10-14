
/**
 * Target basis against which one external motion conversion was decided.
 *
 * @evidence contracts/common.md#principled-implementation Model and skeleton identities locate the receiving rig, while the canonical skeleton digest seals its actual hierarchy, rest transforms and constraints against which native compatibility or retarget conversion was decided.
 * @evidence contracts/common.md#clear-and-simple-design Three target fields identify the runtime receiver without repeating its full skeleton in the receipt or merging target characterization with the independently preserved source basis.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The draft hashes the complete resolved target skeleton, so equal names need not imply equal basis digests. Detecting later changes still requires comparing current input/output ownership; this stored digest alone performs no current rig lookup, compatibility recheck or visual validation.
 * @evidence contracts/common.md#meaningful-documentation Gives production model identity, model-owned skeleton identity and canonical target-basis content rather than implying name-only compatibility.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionConversionTarget {
  /** Target production model identity. */
  model: string;

  /** Target skeleton identity within the model. */
  skeleton: string;

  /** Canonical digest of the target skeleton basis. */
  basisDigest: string;
}
