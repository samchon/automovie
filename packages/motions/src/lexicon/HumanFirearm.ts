import { gesture } from "../everyday/gesture";
import { HumanActionRow } from "../law/HumanActionRow";
import { touch } from "../touch/touch";
import { HumanWeaponFirearm } from "./HumanWeaponFirearm";

/**
 * Firearm handling under film names. The rows of `HumanWeaponFirearm` take
 * the held firearm (`gun`, a handgun or long gun prop the hand picked up)
 * and aim its bore; with no gun named they are the same movements of the
 * empty hand. Register the ones a film uses.
 *
 * A shot from the holster is `HumanWeaponFirearm.draw`, then `takeAim`, then
 * `recoil`; `lowReady` lowers the weapon and `HumanWeaponFirearm.holster`
 * returns it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is a row of, what the composition gives and how a shot is composed.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped or registered law (`HumanActionRow`), so it is data over a law that fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the law.
 */
export namespace HumanFirearm {
  /** Reach for a holster at the right hip. */
  export const reachHolster = HumanActionRow.of("reachHolster", touch, {
    target: { kind: "self", region: "hipRight" },
    with: "palm",
    kind: "hold",
    side: "right",
    hold: 0.3,
  });

  /** Level the weapon at the target and hold the aim. */
  export const takeAim = HumanActionRow.of(
    "takeAim",
    HumanWeaponFirearm.present,
    { carriage: "aim" },
  );

  /** Low ready: the weapon before the body, the muzzle down ahead. */
  export const lowReady = HumanActionRow.of(
    "lowReady",
    HumanWeaponFirearm.present,
    { carriage: "lowReady" },
  );

  /** High ready: the weapon before the chest, the muzzle up. */
  export const highReady = HumanActionRow.of(
    "highReady",
    HumanWeaponFirearm.present,
    { carriage: "highReady" },
  );

  /** One shot: the trigger's press, the muzzle's rise and its return. */
  export const recoil = HumanActionRow.of(
    "recoil",
    HumanWeaponFirearm.fire,
    {},
  );

  /** Hands up at gunpoint. */
  export const surrender = HumanActionRow.of("surrender", gesture, {
    kind: "cheer",
    hold: 2,
  });
}
