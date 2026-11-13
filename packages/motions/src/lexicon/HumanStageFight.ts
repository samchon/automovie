import { crouch } from "../everyday/crouch";
import { lieDown } from "../floor/lieDown";
import { clinch } from "../grappling/clinch";
import { HumanActionRow } from "../law/HumanActionRow";
import { give } from "../reaction/give";
import { stagger } from "../reaction/stagger";
import { step } from "../striking/step";
import { touch } from "../touch/touch";

/**
 * Stage fighting short of a strike: slaps, grabs and holds, each a row of a
 * shipped action on a partner the composition names (the row leaves the
 * target or the partner open). The receiver's response is its own row
 * (`slapped`, `shoved`, `grabbed`, `pushed`), whose start the composition
 * syncs to the attacker's contact:
 * `b.registered("slapped", { from }).sync({ of: "slap" })`.
 * Register the ones a film uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the action it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (`HumanActionRow`), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the row.
 */
export namespace HumanStageFight {
  /** A forehand slap: one tap of the open palm. The composition gives the cheek as the target. */
  export const slap = HumanActionRow.of("slap", touch, {
    with: "palm",
    kind: "tap",
    count: 1,
    tangent: "across",
  });

  /** A backhand slap: one tap of the hand's back. */
  export const backhand = HumanActionRow.of("backhand", touch, {
    with: "handBack",
    kind: "tap",
    count: 1,
    tangent: "across",
  });

  /** A shove: the palm pressed on the partner's chest. */
  export const shove = HumanActionRow.of("shove", touch, {
    with: "palm",
    kind: "press",
    count: 1,
  });

  /** A grab: the hand closed on the partner's region and held (a collar, an arm, the hair at the crown). */
  export const grab = HumanActionRow.of("grab", touch, {
    with: "palm",
    kind: "squeeze",
    count: 1,
  });

  /** A poke of the forefinger into the partner's chest, repeated. */
  export const poke = HumanActionRow.of("poke", touch, {
    with: "fingertips",
    kind: "tap",
  });

  /** A hold on the partner by the clinch, kept three seconds (provisional). */
  export const restrain = HumanActionRow.of("restrain", clinch, { hold: 3 });

  /** The receiver of a slap: the head turned away from the hand (`from`). Sync its start to the slap's contact. */
  export const slapped = HumanActionRow.of("slapped", give, {
    part: "head",
    way: "away",
  });

  /** The receiver of a shove: a step back to catch the balance, the body leaving at 0.8 m/s (provisional). Sync its start to the shove's contact. */
  export const shoved = HumanActionRow.of("shoved", stagger, { speed: 0.8 });

  /** The receiver of a grab: the trunk led toward the grabbing hand (`from`). Sync its start to the grab's contact. */
  export const grabbed = HumanActionRow.of("grabbed", give, {
    part: "trunk",
    way: "toward",
  });

  /** A choke from the front: both palms closed on the neck and held two seconds (provisional). The composition gives the two sides of the neck as `target` and `other`. */
  export const choke = HumanActionRow.of("choke", touch, {
    with: "palm",
    kind: "squeeze",
    count: 1,
    hold: 2,
  });

  /** A headlock or a choke from behind: the clinch's hold on the partner's neck, kept two seconds (provisional). */
  export const headlock = HumanActionRow.of("headlock", clinch, { hold: 2 });

  /** A hair pull: the hand closed on the crown, the temple or the nape the composition names and held; the receiver's `grabbed` follows it. The puller stands as close as for a slap: the row does not close the distance itself, and a region beyond the arm is refused. */
  export const hairPull = HumanActionRow.of("hairPull", touch, {
    with: "palm",
    kind: "squeeze",
    count: 1,
    hold: 1.5,
  });

  /** The receiver of a choke: both hands brought to the attacker's forearms. The composition gives them as `target` and `other`. */
  export const struggle = HumanActionRow.of("struggle", touch, {
    with: "palm",
    kind: "squeeze",
    count: 1,
    hold: 1.5,
  });

  /** A dive for cover: down onto the floor, prone, and stay there three seconds (provisional). */
  export const diveForCover = HumanActionRow.of("diveForCover", lieDown, {
    position: "prone",
    hold: 3,
  });

  /** A duck under a threat with no strike to answer: a short partial crouch (0.3 s held, provisional). */
  export const duck = HumanActionRow.of("duck", crouch, {
    depth: "partial",
    hold: 0.3,
  });

  /** A dodge with no strike to answer: one quick step to the right out of a threat's line. */
  export const dodge = HumanActionRow.of("dodge", step, {
    direction: "right",
    steps: 1,
  });

  /** A lean back out of a threat's line (`from`), the feet kept. */
  export const leanBack = HumanActionRow.of("leanBack", give, {
    part: "trunk",
    way: "away",
  });

  /** The receiver of a poke or a light push: the trunk giving way from the hand (`from`) without a step. */
  export const pushed = HumanActionRow.of("pushed", give, {
    part: "trunk",
    way: "away",
    intensity: 0.5,
  });
}
