import type { IHumanViewerNodeAuthority } from "./IHumanViewerNodeAuthority.js";

/**
 * Checked Node realm readiness; it carries no model or admission verdict.
 *
 * @evidence contracts/common.md#principled-implementation Checked readiness carries the actual Node compiler and source receipt independently of any model or admission.
 * @evidence contracts/common.md#clear-and-simple-design Protocol compatibility and execution authority remain separate fields in one ready envelope.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A ready notification cannot stand in for a displayed model, admitted document or browser provenance.
 * @evidence contracts/common.md#meaningful-documentation The protocol identifies transport compatibility while authority identifies the running Node source and loader.
 *
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Checked readiness carries the actual Node compiler and source receipt independently of any model or admission.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest A ready notification cannot stand in for a displayed model, admitted document or browser provenance.
 * @author Samchon
 */
export interface IHumanViewerNumericalReady {
  /**
   * Checked-realm readiness message discriminant; it supplies no model or document verdict.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Marks checked realm readiness without claiming any document is admitted or displayed.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Marks checked realm readiness without claiming any document is admitted or displayed.
   */
  type: "ready";

  /**
   * Existing viewer protocol, retained across the numerical transport change.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Preserves the actual numerical transport generation required by the waiting page.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Preserves the actual numerical transport generation required by the waiting page.
   */
  protocol: string;

  /**
   * Actual source and compiler authority supplied by the running Node realm.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Supplies original checked Node source and compiler witnesses instead of a browser transformation stamp.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Supplies original checked Node source and compiler witnesses instead of a browser transformation stamp.
   */
  authority: IHumanViewerNodeAuthority;
}
