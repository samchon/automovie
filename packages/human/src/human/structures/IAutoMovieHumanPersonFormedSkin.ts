/**
 * A one-skin person's posed skin halves and what the two partitions asked of
 * the shared boundary.
 *
 * @evidence contracts/common.md#principled-implementation The posed halves and the boundary readings come from one forming step.
 * @evidence contracts/common.md#clear-and-simple-design Four fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The boundary disagreement is reported, not corrected.
 * @evidence contracts/common.md#meaningful-documentation States what each field holds.
 * @evidence contracts/modeling.md#spatial-conventions Posed metres of the person frame.
 * @evidence contracts/modeling.md#shared-boundaries Shared samples hold the same position in both halves.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The halves are skin positions, not parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels The result carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The evaluator emits the parts.
 * @evidenceExclude contracts/modeling.md#rendered-observation The result is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The result carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The result admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The result converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonFormedSkin {
  /** Posed head skin positions. */
  facePosed: number[];

  /** Posed body skin positions. */
  bodyPosed: number[];

  /** The largest face field step at a shared sample, metres. */
  faceField: number;

  /** The largest body field step at a shared sample beyond the head carry, metres. */
  bodyField: number;
}
