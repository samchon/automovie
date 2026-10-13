
/**
 * Target basis against which one external motion conversion was decided.
 *
 * @evidence contracts/common.md#principled-implementation Model and skeleton identities locate the receiving rig, while the canonical skeleton digest seals its actual hierarchy, rest transforms and constraints against which native compatibility or retarget conversion was decided.
 * @evidence contracts/common.md#clear-and-simple-design Three target fields identify the runtime receiver without repeating its full skeleton in the receipt or merging target characterization with the independently preserved source basis.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal skeleton names do not prove unchanged rig content; the target basis digest prevents a converted motion from silently borrowing compatibility from a previous hierarchy or constraint table.
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
