/**
 * How a hand holds an object at a grip affordance, the closed set an author
 * picks from instead of describing finger angles.
 *
 * The five kinds are the opposition classes the grasp taxonomies agree on
 * (Cutkosky 1989, grasp choice in manufacturing tasks; Feix et al. 2016, the
 * GRASP taxonomy, which reduces 33 human grasps to these oppositions):
 *
 * - `"power"`: the palm and the flexed fingers wrap the object, the thumb
 *   closing over them (a hammer, a cup handle, a rail). Palm opposition.
 * - `"precision"`: the thumb pad opposes the finger pads with the palm clear
 *   (a pen, a coin, a paper note). Pad opposition.
 * - `"lateral"`: the thumb pad presses the object against the side of the
 *   bent index finger (a key, a card). Side opposition.
 * - `"hook"`: the fingers flex round the object with no thumb (a bag strap,
 *   a bar hung from).
 * - `"two-hand"`: both hands hold the object, each in a power grip at its
 *   own affordance (a box, a broom).
 *
 * A consumer turns the kind into which digits close and where the palm sits;
 * how far each digit closes is solved against the object, never authored.
 *
 * @evidence contracts/development/design.md#principled-representation The opposition classes of the Cutkosky and Feix taxonomies, the level both agree on, as a closed literal union.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by grasping laws through the affordance's `grip`; finer taxonomy grasps would be unauthorable rough detail.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No finger angle or object name is encoded; closure is solved against the object.
 * @evidence contracts/development/common.md#meaningful-documentation States each kind's opposition, an example and who resolves closure.
 */
export type AutoMovieGripKind =
  | "power"
  | "precision"
  | "lateral"
  | "hook"
  | "two-hand";
