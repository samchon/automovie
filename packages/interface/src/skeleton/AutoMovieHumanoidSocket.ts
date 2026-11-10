/**
 * Closed vocabulary of contact frames on a humanoid body: where the body
 * itself touches, holds or bears weight, each a point with an outward normal
 * and a forward direction on one bone's collision shapes.
 *
 * - `palm*`: the palm's centre, normal out of the palm, forward along the
 *   fingers; where a hand presses, pats, pushes or shakes.
 * - `grip*`: the centre of a closed hand's grasp, between the palm and the
 *   curled fingers, forward along the fingers; where a held object's handle
 *   sits (a socket in game-engine terms, such as Unreal's hand sockets).
 * - `fist*`: the front of the closed fist over the knuckles.
 * - `heel*`, `ball*`, `toe*`: the sole under the heel, under the
 *   metatarsophalangeal joints and at the toe tip, normal down; where a foot
 *   strikes, rolls and pushes off.
 * - `sole*`: the sole's centre, normal down, forward toward the toes.
 * - `seat`: under the ischial tuberosities, normal down; where a sitting body
 *   bears weight. `back`: the posterior trunk's centre, normal backward;
 *   where a body leans or lies.
 *
 * Paired sockets carry their side, the body's own left or right. The engine
 * resolves each from the profile; the list grows additively.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives each socket's place, normal and forward direction and what the body does there.
 * @evidence contracts/development/design.md#principled-representation Contact frames where the body itself touches, holds or bears weight, a point with a normal and a forward direction.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Names only; the engine resolves each frame from the body's profile.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union separate from the struck regions, instead of overloading region names with frames.
 */
export type AutoMovieHumanoidSocket =
  | "palmLeft"
  | "palmRight"
  | "gripLeft"
  | "gripRight"
  | "fistLeft"
  | "fistRight"
  | "heelLeft"
  | "heelRight"
  | "ballLeft"
  | "ballRight"
  | "toeLeft"
  | "toeRight"
  | "soleLeft"
  | "soleRight"
  | "seat"
  | "back";
