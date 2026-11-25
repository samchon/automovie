/**
 * How a hand holds an object at a grip affordance, the closed set an author
 * picks from instead of describing finger angles.
 *
 * The five kinds are the opposition classes the grasp taxonomies agree on
 * (Cutkosky 1989, grasp choice in manufacturing tasks; Feix et al. 2016, the
 * GRASP taxonomy, which reduces 33 human grasps to these oppositions):
 *
 * - `"power"`: the palm and the flexed fingers wrap the object, the thumb closing
 *   over them (a hammer, a cup handle, a rail). Palm opposition.
 * - `"precision"`: the thumb pad opposes the finger pads with the palm clear (a
 *   pen, a coin, a paper note). Pad opposition.
 * - `"lateral"`: the thumb pad presses the object against the side of the bent
 *   index finger (a key, a card). Side opposition.
 * - `"hook"`: the fingers flex round the object with no thumb (a bag strap, a bar
 *   hung from).
 * - `"two-hand"`: both hands hold the object, each in a power grip at its own
 *   affordance (a box, a broom).
 *
 * A consumer turns the kind into which digits close and where the palm sits;
 * how far each digit closes is solved against the object, never authored.
 */
export type AutoMovieGripKind =
  | "power"
  | "precision"
  | "lateral"
  | "hook"
  | "two-hand";
