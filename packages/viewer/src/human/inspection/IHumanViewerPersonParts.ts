/**
 * The two parts of a person document whose basis names the catalogue reads; either may be missing or malformed until checked.
 *
 * @evidence contracts/common.md#principled-implementation Names optional unexamined face/body values so the catalogue can inspect declared basis references before full Person admission.
 * @evidence contracts/common.md#clear-and-simple-design Unknown nested fields preserve ingress uncertainty instead of casting malformed JSON into admitted numerical documents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/primitive parts or absent/empty basis names refuse at readHumanViewerPersonBases; this type supplies no fallback.
 * @evidence contracts/common.md#meaningful-documentation Documents both potentially malformed sides and limits this projection to identity routing rather than numerical anatomy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape performs no parse; its consumer uses fixed two-side structural/member checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Complete document/basis/source authority controls numerical reuse; projected nested object identity alone is insufficient.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input file/catalogue owners retain parsed JSON; this optional-field view acquires no worker, model cache or native buffer.
 *
 * @author Samchon
 */
export interface IHumanViewerPersonParts {
  /** The face document. */
  face?: unknown;

  /** The body document. */
  body?: unknown;
}
