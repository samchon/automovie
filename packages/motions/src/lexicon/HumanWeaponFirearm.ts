import type { IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanLexiconParams, IAutoMovieMotionHumanWeaponPresent } from "@automovie/interface";

import { pickUp } from "../handling/pickUp";
import { putDown } from "../handling/putDown";
import { HumanActionRow } from "../law/HumanActionRow";
import { HumanWeaponPresent } from "./HumanWeaponPresent";

/**
 * Handling a firearm with the weapon as the effector: presenting it to an
 * aim or a ready position, the shot's recoil, and the draw and the return
 * to a holster.
 *
 * The firearm is a prop the hand holds (`HumanObject.prop` of a handgun or a
 * long gun, taken by its `grip`); presenting and firing are the generalised
 * launcher laws of `HumanWeaponPresent` under the firearm's names, reading
 * the gun's `muzzle` and `sight` and aiming from the eye (a handgun) or the
 * cheek (a long gun) unless a row names another tip, edge or anchor.
 *
 * A shot is three actions in a chain: `draw` (a pick up of the holstered
 * pistol by its grip), `present` (the muzzle brought onto the line from the
 * eye to the target and held) and `fire` (the trigger's press, the muzzle's
 * rise about the hand and its return onto the line). `present` with a ready
 * position lowers the weapon, and `holster` puts it back.
 *
 * A handgun is held in both hands unless one is asked, the support hand
 * wrapped beside the shooting hand; a long gun (a prop that declares a
 * `foreEnd`) takes the support hand on its fore-end and is refused in one
 * hand. A target more than `TURN` degrees off the heading is refused: the
 * performer turns first.
 *
 * First pass: the target is read once at the action's start, the holster is
 * a prop where the scene stands it and does not ride the body, and no
 * reload is planned. The recoil's size and times are provisional: no
 * recoil-recovery study was read (#3348 lists it as research to do).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the effector, how the firearm is given, how a shot is composed, the two-hand rules with their refusals and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation Two law records of the launcher laws under the firearm's names and two rows of the shipped pick up and put down.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The laws, their parameters, the rows and the constants the lexicon rows and a production read, the latter `HumanWeaponPresent`'s own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No law is copied: present and fire are `HumanWeaponPresent`'s plans under the names films already compose.
 */
export namespace HumanWeaponFirearm {

  /** The widest presenting angle off the heading, degrees (`HumanWeaponPresent.TURN`). */
  export const TURN: number = HumanWeaponPresent.TURN;

  /** The declared dispersion, degrees (`HumanWeaponPresent.DISPERSION`). */
  export const DISPERSION: number = HumanWeaponPresent.DISPERSION;

  /** The cheek's share down the head (`HumanWeaponPresent.CHEEK`). */
  export const CHEEK: number = HumanWeaponPresent.CHEEK;

  /** The bladed trunk turn, degrees (`HumanWeaponPresent.BLADED`). */
  export const BLADED: number = HumanWeaponPresent.BLADED;

  /** Present a firearm: `HumanWeaponPresent.present` under its firearm name. */
  export const present: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanWeaponPresent.IPresent> = {
    ...HumanWeaponPresent.present,
    name: "presentFirearm",
  };

  /** Fire one shot: `HumanWeaponPresent.fire` under its firearm name. */
  export const fire: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanWeaponPresent.IWield> = {
    ...HumanWeaponPresent.fire,
    name: "fireFirearm",
  };

  /** Draw: take the holstered firearm by its grip, the bore continuing the forearm, and lift it clear. The composition gives the firearm (`prop`). */
  export const draw: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["weaponFirearm"]["draw"]> = HumanActionRow.of("drawFirearm", pickUp, {
    handle: "grip",
    lift: 0.15,
    use: { tip: "muzzle", line: "forearm" },
  });

  /** Holster: put the firearm back where the composition says its holster holds it (`prop` and `at`). */
  export const holster: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["weaponFirearm"]["holster"]> = HumanActionRow.of("holsterFirearm", putDown, {});
}
