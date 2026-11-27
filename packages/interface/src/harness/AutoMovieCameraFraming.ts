/**
 * The closed shot-size vocabulary accepted by a camera frame action.
 *
 * Its string values are the serialized authoring spellings.
 */
export const enum AutoMovieCameraFraming {
  /** A wide view that includes more of the surroundings. */
  Wide = "wide",
  /** A full-body view of the subject. */
  Full = "full",
  /** A medium view of the subject. */
  Medium = "medium",
  /** A close view of the subject. */
  Close = "close",
}