import type { IBodyReviewState } from "./IBodyReviewState";

/**
 * A review state with the identity and basis submitted to the viewer. An
 * authored explicit basis remains subject to the viewer's admission check.
 * @author Samchon
 */
export interface IBodyCaptureDocument extends IBodyReviewState {
  /** Unique state identity inside the submitted input file. */
  id: string;

  /** Display name assigned to this submitted state. */
  name: string;

  /** Numerical basis identity required by the published view or explicit candidate. */
  basis: string;
}
