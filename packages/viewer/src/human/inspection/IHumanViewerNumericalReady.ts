import type { IHumanViewerNodeAuthority } from "./IHumanViewerNodeAuthority.js";

/**
 * Checked Node realm readiness; it carries no model or admission verdict.
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
