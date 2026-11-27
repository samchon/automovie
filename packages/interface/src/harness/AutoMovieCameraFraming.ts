/**
 * The closed shot-size vocabulary accepted by a camera frame action.
 *
 * - `wide`: Shows the subject small in its surroundings.
 * - `full`: Frames the subject's full body.
 * - `medium`: Frames the subject from the waist up.
 * - `close`: Fills the frame with the subject's head and shoulders.
 */
export type AutoMovieCameraFraming =
  | "wide"
  | "full"
  | "medium"
  | "close";
