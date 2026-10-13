/**
 * Actual checked Node numerical realm and its source-byte witnesses. A Node
 * receipt never claims to be a browser transformation stamp.
 *
 * @evidence contracts/common.md#principled-implementation Revision, checked loader, owning project, runtime versions and source-byte inputs identify the actual Node realm that performed the computation.
 * @evidence contracts/common.md#clear-and-simple-design One receipt groups loader and source authority without conflating Node execution with browser transformation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The loader discriminant names the supported checked entry; byte witnesses cannot be replaced by a readiness timestamp.
 * @evidence contracts/common.md#meaningful-documentation Field comments distinguish host-selected source, owning project, Node version, compiler version and input digests.
 *
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Revision, checked loader, owning project, runtime versions and source-byte inputs identify the actual Node realm that performed the computation.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest The loader discriminant names the supported checked entry; byte witnesses cannot be replaced by a readiness timestamp.
 *
 * @author Samchon
 */
export interface IHumanViewerNodeAuthority {
  /**
   * Source revision selected by the host before this owned realm starts.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Preserves the host-selected source generation whose checked modules actually ran.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Preserves the host-selected source generation whose checked modules actually ran.
   */
  revision: string;

  /**
   * Public checked loader that admitted the TypeScript entry.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Names the supported public checked loader rather than private SDK emit machinery.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Names the supported public checked loader rather than private SDK emit machinery.
   */
  loader: "ttsc/register";

  /**
   * Actual nearest owning project used by the checked loader.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Identifies the actual nearest owning TypeScript project admitted by that loader.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Identifies the actual nearest owning TypeScript project admitted by that loader.
   */
  project: string;

  /**
   * Running Node version, independently of the browser's V8.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Reports the numerical realm's real Node version independently of the browser's V8.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Reports the numerical realm's real Node version independently of the browser's V8.
   */
  node: string;

  /**
   * Installed compiler package version.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Identifies the installed compiler version that supplied the checked execution.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Identifies the installed compiler version that supplied the checked execution.
   */
  compiler: string;

  /**
   * Byte digest per actual watched input after the entry loaded.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Retains exact watched-input byte digests after entry loading for source authority comparison.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Retains exact watched-input byte digests after entry loading for source authority comparison.
   */
  inputs: Record<string, string>;
}
