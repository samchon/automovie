/**
 * A coarse mask used to select surviving bone and expression channels. Concurrent actions are judged by their actual surviving root, bone and expression ownership; sharing a region label alone neither requires sequencing nor proves a conflict.
 *
 * The closed names define fixed channel groups rather than arbitrary prose masks:
 *
 * - `lowerBody`: hips/root + both legs (locomotion, stance, kicks).
 * - `upperBody`: spine + both arms + hands (gestures, reaches, punches).
 * - `head`: neck + head (look-at, nods, shakes).
 * - `face`: expression/morph channels (emotes).
 * - `fullBody`: the union of body-bone groups, excluding expression channels. It may overlap another region only when their actual surviving content remains disjoint.
 *
 * compilePerformance retains expressions only for face. With one region it retains root channels; when multiple regions layer, only lowerBody and fullBody retain root. Masking reports discarded content instead of silently treating every original channel as surviving.
 *
 * @evidence contracts/common.md#principled-implementation Closed regions classify motion channels for masking and layering, while actual surviving root, bone and expression ownership determines whether concurrent content conflicts.
 * @evidence contracts/common.md#clear-and-simple-design Fixed limb/head/face groups keep channel selection explicit; fullBody combines body bones while face owns expressions, and root retention follows the compiler's layering rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Region names alone do not guarantee disjoint content, especially fullBody overlaps; composition must inspect the masked surviving channels rather than permit concurrency by label only.
 * @evidence contracts/common.md#meaningful-documentation Defines each region's channels and the fullBody exception requiring actual disjoint surviving content.
 * @author Samchon
 */
export type AutoMovieBodyRegion =
  | "lowerBody"
  | "upperBody"
  | "head"
  | "face"
  | "fullBody";
