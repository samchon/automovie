/**
 * A coarse mask used to select surviving bone and expression channels.
 * Concurrent actions are judged by their actual surviving root, bone and
 * expression ownership; sharing a region label alone neither requires
 * sequencing nor proves a conflict.
 *
 * The closed names define fixed channel groups rather than arbitrary prose
 * masks:
 *
 * - `lowerBody`: hips/root + both legs (locomotion, stance, kicks).
 * - `upperBody`: spine + both arms + hands (gestures, reaches, punches).
 * - `head`: neck + head (look-at, nods, shakes).
 * - `face`: expression/morph channels (emotes).
 * - `fullBody`: the union of body-bone groups, excluding expression channels. It
 *   may overlap another region only when their actual surviving content remains
 *   disjoint.
 *
 * CompilePerformance retains expressions only for face. With one region it
 * retains root channels; when multiple regions layer, only lowerBody and
 * fullBody retain root. Masking reports discarded content instead of silently
 * treating every original channel as surviving.
 */
export type AutoMovieBodyRegion =
  | "lowerBody"
  | "upperBody"
  | "head"
  | "face"
  | "fullBody";
