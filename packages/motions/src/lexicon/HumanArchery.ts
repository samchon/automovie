import { operate } from "../affordance/operate";
import { pickUp } from "../handling/pickUp";
import { putDown } from "../handling/putDown";
import { HumanActionRow } from "../law/HumanActionRow";
import { release } from "../throwing/release";
import { HumanWeaponPresent } from "./HumanWeaponPresent";

/**
 * Archery under its own names (#3487), each a row of a shipped law: the
 * arrow is a prop taken, nocked, carried by the drawn string and launched,
 * and nothing here moves it by itself.
 *
 * - `takeArrow`: a pick up of the arrow by its shaft, from where the
 *   composition says it lies (a quiver's slot site).
 * - `nockArrow`: a put down of the arrow's nock onto the bow's `nock`
 *   socket, its shaft on the bow's `rest`.
 * - `presentBow`: presenting the bow in one hand with the line of aim from
 *   the face (`HumanWeaponPresent`, anchor `face`), the bow's `rest` as the
 *   working point the line passes through.
 * - `drawBow`: an operation of the bow's `string` slider by the drawing
 *   hand, performed over `presentBow` (`HumanChain.over`); the string's drive
 *   moves the nock and, by `follows`, bends the limbs (#3476).
 * - `loose`: a release of the drawing hand that launches the nocked arrow
 *   along its line from `nock` to `tip` at the bow's launch speed, which the
 *   composition gives from the bow's `launchSpeed` at the string's travel
 *   (#3481).
 * - `spanCrossbow`: an operation of the crossbow's `string` (a straight pull
 *   with the foot in the `stirrup`) or its `crank`, to full travel.
 * - `presentCrossbow`: presenting the crossbow with the line from the cheek.
 * - `shootCrossbow`: the shot, whose press drives the `trigger` and ends the
 *   latch's hold (`HumanWeaponPresent.fire`).
 *
 * The phases are Nishizono et al.'s as Simsek and Ertan cite them (bow
 * hold, drawing, full draw, aiming, release, follow-through); their
 * durations are not yet read at a source and are the shipped laws' own,
 * provisional. A draw tradition (the Mediterranean draw, the thumb draw of
 * a horse bow) is the composition's choice of hand and anchor, not a law.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is a row of, which affordances it reads, what the composition gives and what is provisional.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface #3487's rows; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own.
 */
export namespace HumanArchery {
  /** Take an arrow by its shaft. */
  export const takeArrow = HumanActionRow.of("takeArrow", pickUp, {
    handle: "shaft",
  });

  /** Set the arrow's nock on the bow's string. */
  export const nockArrow = HumanActionRow.of("nockArrow", putDown, {});

  /** Hold the bow out in one hand on the line from the face to the target. */
  export const presentBow = HumanActionRow.of(
    "presentBow",
    HumanWeaponPresent.present,
    { anchor: "face", hands: 1, tip: "rest", edge: "grip" },
  );

  /** Draw the string back to the anchor, over `presentBow`. */
  export const drawBow = HumanActionRow.of("drawBow", operate, {});

  /** Let the string go: the nocked arrow flies at the bow's speed. */
  export const loose = HumanActionRow.of("loose", release, {});

  /** Span a crossbow by its string or its crank. */
  export const spanCrossbow = HumanActionRow.of("spanCrossbow", operate, {});

  /** Hold the crossbow to the cheek on the line to the target. */
  export const presentCrossbow = HumanActionRow.of(
    "presentCrossbow",
    HumanWeaponPresent.present,
    { anchor: "cheek" },
  );

  /** Press the crossbow's trigger. */
  export const shootCrossbow = HumanActionRow.of(
    "shootCrossbow",
    HumanWeaponPresent.fire,
    {},
  );
}
