import type { IHumanViewerNodeAuthority } from "./IHumanViewerNodeAuthority.js";

/**
 * Checked Node realm readiness; it carries no model or admission verdict.
 *
 * @evidence contracts/common.md#principled-implementation Checked readiness carries the actual Node compiler and source receipt independently of any model or admission.
 * @evidence contracts/common.md#clear-and-simple-design Protocol compatibility and execution authority remain separate fields in one ready envelope.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A ready notification cannot stand in for a displayed model, admitted document or browser provenance.
 * @evidence contracts/common.md#meaningful-documentation The protocol identifies transport compatibility while authority identifies the running Node source and loader.
 *
 * @author Samchon
 */
export interface IHumanViewerNumericalReady {
  /**
   * Checked-realm readiness message discriminant; it supplies no model or document verdict.
   */
  type: "ready";

  /**
   * Existing viewer protocol, retained across the numerical transport change.
   */
  protocol: string;

  /**
   * Actual source and compiler authority supplied by the running Node realm.
   */
  authority: IHumanViewerNodeAuthority;
}
