/**
 * One human module as a compile generation transformed it, with the identity
 * of that generation.
 *
 * @evidence contracts/common.md#principled-implementation Every served module names the compile it came from, so a page can prove it loaded one compile only.
 * @evidence contracts/common.md#meaningful-documentation Names both members.
 *
 * @evidence contracts/common.md#clear-and-simple-design Module code and compile identity travel together as the smallest served-source receipt.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A requested source path alone cannot replace the generation identity of its transformed code.
 *
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Every served module names the compile it came from, so a page can prove it loaded one compile only.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest A requested source path alone cannot replace the generation identity of its transformed code.
 *
 * @author Samchon
 */
export interface IHumanViewerCompiledSource {
  /**
   * The transformed TypeScript.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Serves the transformed module text actually produced by the named compile generation.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Serves the transformed module text actually produced by the named compile generation.
   */
  code: string;

  /**
   * Identity of the compile generation that produced it.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Labels the producing compile so mixed-generation module loads remain detectable.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Labels the producing compile so mixed-generation module loads remain detectable.
   */
  compile: string;
}
