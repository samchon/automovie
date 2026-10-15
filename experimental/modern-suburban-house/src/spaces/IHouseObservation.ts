import { IObservationPose } from "./IObservationPose";

/**
 * One derived spatial question.
 */

export interface IHouseObservation {
  /** Question identity. */
  id: string;
  /** Kind of question. */
  role: "center" |
  "corner" |
  "threshold" |
  "reflex-corner" |
  "facade" |
  "roof" |
  "underside" |
  "envelope-corner" |
  "entrance";
  /** Space the question is asked in, or null for exterior questions. */
  space: string | null;
  /** Boundary, opening or face the question looks at, or null. */
  subject: string | null;
  /** Camera pose, or null when none could be placed. */
  pose: IObservationPose | null;
}
