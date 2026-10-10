import type { IHumanViewerNodeAuthority } from "./IHumanViewerNodeAuthority";

/** Checked Node realm readiness; it carries no model or admission verdict. @author Samchon */
export interface IHumanViewerNumericalReady {
  type: "ready";

  /** Existing viewer protocol, retained across the numerical transport change. */
  protocol: string;

  /** Actual source and compiler authority supplied by the running Node realm. */
  authority: IHumanViewerNodeAuthority;
}
