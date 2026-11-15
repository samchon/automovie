import { operate } from "../affordance/operate";
import { pickUp } from "../handling/pickUp";
import { putDown } from "../handling/putDown";
import { HumanActionRow } from "../law/HumanActionRow";
import { touch } from "../touch/touch";
import { HumanWeaponPresent } from "./HumanWeaponPresent";

/**
 * The musket's drill (#3488), the one musket lexicon: the 1764 Manual
 * Exercise's carry positions, its Prime and Load in its own order, and its
 * firings, each a row of a shipped law on the musket's, the cartridge's
 * and the pouch's affordances. One soldier's rows; the manual's three ranks
 * are the crowds campaign's to arrange.
 *
 * In the manual's order: `handleCartridge` (a pick up of a cartridge from
 * the pouch's slot), `biteCartridge` (a touch of the cartridge's `end` to
 * the mouth), `prime` (a touch of the cartridge to the `pan`), `shutPan`
 * (an operation of the `frizzen` hinge), `castAbout` (presenting at a high
 * ready, the muzzle up before the body), `charge` (a put down of the
 * cartridge into the `muzzle`), `drawRammer` (an operation of the `ramrod`
 * slider, then a pick up of the rod), `ramDown` (an operation inserting the
 * rod into the `muzzle`, withdrawn), `returnRammer` (a put down into the
 * pipe), `recover` (the firelock upright before the body, its butt at the
 * left breast, the manual's Make Ready beginning "SPRING the firelock
 * briskly to the recover"), `makeReady` over it (an operation of the `cock`
 * hinge to full cock), then `presentMusket` and `fireMusket`. `shoulderArms` takes the musket by its
 * `butt` and `orderArms` sets its butt down by the foot.
 *
 * The manual gives the order and the count of motions, not their
 * durations: each row's timing is its law's, provisional, and the composed
 * Prime and Load is to fall inside a trained soldier's rate, which a
 * primary source is still to give (secondary sources give about three
 * rounds a minute). Biting and pouring are the hand brought to the place;
 * the fingers' fine work waits for #3420.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the manual's order with each row's law and affordance, what is the crowds campaign's and what is provisional.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface #3488's musket rows; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; a row needing a hand that holds something else is refused by the shipped hold rules.
 */
export namespace HumanMusketDrill {
  /** Shoulder arms: take the musket up by its butt. */
  export const shoulderArms = HumanActionRow.of("shoulderArms", pickUp, {
    handle: "butt",
  });

  /** Order arms: set the butt down by the foot. */
  export const orderArms = HumanActionRow.of("orderArms", putDown, {});

  /** Handle cartridge: take one from the pouch. */
  export const handleCartridge = HumanActionRow.of("handleCartridge", pickUp, {
    handle: "body",
  });

  /** Bite the cartridge: its end brought to the mouth. */
  export const biteCartridge = HumanActionRow.of("biteCartridge", touch, {
    target: { kind: "self", region: "mouth" },
    point: "end",
  });

  /** Prime: the cartridge brought to the pan. */
  export const prime = HumanActionRow.of("prime", touch, {});

  /** Shut the pan: the frizzen closed. */
  export const shutPan = HumanActionRow.of("shutPan", operate, {});

  /** Cast about: the musket brought before the body, the muzzle up. */
  export const castAbout = HumanActionRow.of(
    "castAbout",
    HumanWeaponPresent.present,
    { carriage: "highReady" },
  );

  /** Charge with cartridge: the cartridge set into the muzzle. */
  export const charge = HumanActionRow.of("charge", putDown, {});

  /** Draw the rammer from its pipe. */
  export const drawRammer = HumanActionRow.of("drawRammer", operate, {});

  /** Ram down the cartridge: the rod inserted into the bore and withdrawn. */
  export const ramDown = HumanActionRow.of("ramDown", operate, {});

  /** Return the rammer to its pipe. */
  export const returnRammer = HumanActionRow.of("returnRammer", putDown, {});

  /**
   * Recover: the firelock brought from the shoulder upright before the body,
   * "the Butt close to the left breast, but not pressed, the Firelock
   * perpendicular, opposite the left Side of the Face" (the 1764 Manual
   * Exercise, Make Ready: "SPRING the firelock briskly to the recover").
   */
  export const recover = HumanActionRow.of(
    "recover",
    HumanWeaponPresent.present,
    { carriage: "recover" },
  );

  /** Make ready: the cock drawn to full cock, over `recover` (`HumanChain.over`). */
  export const makeReady = HumanActionRow.of("makeReady", operate, {});

  /** Present: the musket to the cheek on the line. */
  export const presentMusket = HumanActionRow.of(
    "presentMusket",
    HumanWeaponPresent.present,
    {},
  );

  /** Fire: the trigger pulled, the lock falling. */
  export const fireMusket = HumanActionRow.of(
    "fireMusket",
    HumanWeaponPresent.fire,
    {},
  );
}
