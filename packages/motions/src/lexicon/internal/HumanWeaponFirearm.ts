import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
  IAutoMovieMotionHumanWeaponPresent,
} from "@automovie/interface";

import { pickUp } from "../../handling/internal/pickUp";
import { putDown } from "../../handling/internal/putDown";
import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { HUMAN_FIREARM_DRAW } from "../../next/presets/HUMAN_FIREARM_DRAW";
import { HumanWeaponPresent } from "./HumanWeaponPresent";

/**
 * Handling a firearm with the weapon as the effector: presenting it to an aim
 * or a ready position, the shot's recoil, and the draw and the return to a
 * holster.
 *
 * The firearm is a prop the hand holds (`HumanObject.prop` of a handgun or a
 * long gun, taken by its `grip`); presenting and firing are the generalised
 * launcher laws of `HumanWeaponPresent` under the firearm's names, reading the
 * gun's `muzzle` and `sight` and aiming from the eye (a handgun) or the cheek
 * (a long gun) unless a row names another tip, edge or anchor.
 *
 * A shot is three actions in a chain: `draw` (a pick up of the holstered pistol
 * by its grip), `present` (the muzzle brought onto the line from the eye to the
 * target and held) and `fire` (the trigger's press, the muzzle's rise about the
 * hand and its return onto the line). `present` with a ready position lowers
 * the weapon, and `holster` puts it back.
 *
 * Timing (`IAutoMovieMotionHumanWeaponPresent`): `present` takes 0.9 s at
 * novice to 0.5 s at elite, `fire` 0.42 s (press 0.1, rise 0.07, return 0.25),
 * all provisional. The two-hand rules, the refusal of a target past `TURN` and
 * what the first pass leaves out are `HumanWeaponPresent`'s, whose laws these
 * are.
 */
export namespace HumanWeaponFirearm {
  /** Present a firearm: `HumanWeaponPresent.present` under its firearm name. */
  export const present: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanWeaponPresent.IPresent> =
    {
      ...HumanWeaponPresent.present,
      name: "presentFirearm",
    };

  /** Fire one shot: `HumanWeaponPresent.fire` under its firearm name. */
  export const fire: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanWeaponPresent.IWield> =
    {
      ...HumanWeaponPresent.fire,
      name: "fireFirearm",
    };

  /**
   * Draw: take the holstered firearm by its grip, the bore continuing the
   * forearm, and lift it clear. The composition gives the firearm (`prop`).
   */
  export const draw: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["weaponFirearm"]["draw"]
  > = AutoMovieMotionHumanActionRow.of(
    "drawFirearm",
    pickUp,
    HUMAN_FIREARM_DRAW,
  );

  /**
   * Holster: put the firearm back where the composition says its holster holds
   * it (`prop` and `at`).
   */
  export const holster: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["weaponFirearm"]["holster"]
  > = AutoMovieMotionHumanActionRow.of("holsterFirearm", putDown, {});
}
