/**
 * Postural gestures synthesized by gestureMotion's clinical-angle templates.
 * Jump carries root translation through a separate branch; targeted strikes
 * belong to the actor synthesizer's reach path.
 */
export type AutoMovieGenericGesture =
  | "bow"
  | "nod"
  | "shake"
  | "crouch"
  | "kick"
  | "stagger"
  | "wave"
  | "celebrate"
  | "draw"
  | "throw";
