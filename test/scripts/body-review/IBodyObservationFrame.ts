import type { HumanObservationPass } from "@automovie/playground/src/human/observation/HumanObservationPass";
import type { HumanObservationView } from "@automovie/playground/src/human/observation/HumanObservationView";

import type { IBodyReviewState } from "./standardBodyReviewDocuments";

/**
 * One frame a review asks for: which document state to draw, from which view,
 * as which pass, with which parts isolated.
 *
 * The state is carried whole (shape channels, joint rows, shoulder goals) so
 * that a frame is reproducible from the manifest alone. `isolate` names the
 * displayed parts to show by themselves, or null for the assembled body.
 */
export interface IBodyObservationFrame {
  /** Name of the state, unique within its unit. */
  state: string;

  /** The document state to apply. */
  document: IBodyReviewState;

  /** Named view. */
  view: HumanObservationView;

  /** Pass the subject is drawn as. */
  pass: HumanObservationPass;

  /** Parts shown alone, or null for the assembled body. */
  isolate: string[] | null;
}
