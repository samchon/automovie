import type { IHumanViewerResolveIo } from "./IHumanViewerResolveIo.js";
import type { IHumanViewerRevisionReadIo } from "./IHumanViewerRevisionReadIo.js";
import type { IHumanViewerRevisionsEntries } from "./IHumanViewerRevisionsEntries.js";
import type { IHumanViewerNodeInputScope } from "./IHumanViewerNodeInputScope.js";

/**
 * What the revision digests are computed from.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 *
 * @evidence contracts/common.md#principled-implementation Entry graphs, extra configuration files and basis digests enumerate the inputs that determine each numerical and browser revision.
 * @evidence contracts/common.md#clear-and-simple-design Filesystem existence and text access are borrowed through one combined read port.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cache authority derives from actual input content rather than source filenames alone.
 *
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Entry graphs, extra configuration files and basis digests enumerate the inputs that determine each numerical and browser revision.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Cache authority derives from actual input content rather than source filenames alone.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerRevisionsProps {
  /**
   * Repository root with forward slashes; digests hash paths relative to it.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Normalizes dependency paths relative to the owning repository root before source graph digesting.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Normalizes dependency paths relative to the owning repository root before source graph digesting.
   */
  root: string;

  /**
   * Entry files of each digest's import graph.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Specifies the actual browser, Face, Body and Person entry graphs whose transitive inputs determine revision authority.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Specifies the actual browser, Face, Body and Person entry graphs whose transitive inputs determine revision authority.
   */
  entries: IHumanViewerRevisionsEntries;

  /**
   * Files that change every result without being imported.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Includes configuration and other inputs that change results without being imported by an entry module.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Includes configuration and other inputs that change results without being imported by an entry module.
   */
  extra: readonly string[];

  /** Checked-loader source scope contributing only to browser/admission revision, not numerical model-cache digests. */
  checkedInputs?: IHumanViewerNodeInputScope;

  /**
   * The published basis digests the browser digest also covers.
   *
   * @evidence contracts/common.md#principled-implementation Published basis digests are read when the browser revision is recomputed.
   * @evidence contracts/common.md#clear-and-simple-design Basis identity remains with the source owner, separate from import-graph traversal.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The browser digest cannot omit changed basis bytes merely because code imports stayed unchanged.
   * @evidence contracts/common.md#meaningful-documentation The string contributes the current published-basis digest authority.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Published basis digests are read when the browser revision is recomputed.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest The string contributes the current published-basis digest authority.
   */
  bases: () => string;

  /**
   * File access: existence and text, undefined for an unreadable file.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Supplies actual existence and current source text while leaving filesystem effects with the host.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Supplies actual existence and current source text while leaving filesystem effects with the host.
   */
  io: IHumanViewerResolveIo & IHumanViewerRevisionReadIo;
}
