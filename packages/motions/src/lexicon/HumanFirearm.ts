import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { gesture } from "../everyday/internal/gesture";
import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";
import { HUMAN_FIREARM_REACH_HOLSTER } from "../next/presets/HUMAN_FIREARM_REACH_HOLSTER";
import { HUMAN_FIREARM_SURRENDER } from "../next/presets/HUMAN_FIREARM_SURRENDER";
import { touch } from "../touch/internal/touch";
import { HumanWeaponFirearm } from "./HumanWeaponFirearm";

/**
 * Firearm handling under film names. The rows of `HumanWeaponFirearm` take the
 * held firearm (`gun`, a handgun or long gun prop the hand picked up) and aim
 * its bore; with no gun named they are the same movements of the empty hand.
 * Register the ones a film uses.
 *
 * `takeAim` and the ready rows take 0.9 s at novice to 0.5 s at elite and
 * `recoil` 0.42 s, provisional (`IAutoMovieMotionHumanWeaponPresent`). A shot
 * from the holster is `HumanWeaponFirearm.draw`, then `takeAim`, then `recoil`;
 * `lowReady` lowers the weapon and `HumanWeaponFirearm.holster` returns it.
 */
export namespace HumanFirearm {
  /** Reach for a holster at the right hip. */
  export const reachHolster: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["firearm"]["reachHolster"]
  > = AutoMovieMotionHumanActionRow.of(
    "reachHolster",
    touch,
    HUMAN_FIREARM_REACH_HOLSTER,
  );

  /** Level the weapon at the target and hold the aim. */
  export const takeAim: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["firearm"]["takeAim"]
  > = AutoMovieMotionHumanActionRow.of("takeAim", HumanWeaponFirearm.present, {
    carriage: "aim",
  });

  /** Low ready: the weapon before the body, the muzzle down ahead. */
  export const lowReady: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["firearm"]["lowReady"]
  > = AutoMovieMotionHumanActionRow.of("lowReady", HumanWeaponFirearm.present, {
    carriage: "lowReady",
  });

  /** High ready: the weapon before the chest, the muzzle up. */
  export const highReady: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["firearm"]["highReady"]
  > = AutoMovieMotionHumanActionRow.of(
    "highReady",
    HumanWeaponFirearm.present,
    {
      carriage: "highReady",
    },
  );

  /** One shot: the trigger's press, the muzzle's rise and its return. */
  export const recoil: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["firearm"]["recoil"]
  > = AutoMovieMotionHumanActionRow.of("recoil", HumanWeaponFirearm.fire, {});

  /** Hands up at gunpoint. */
  export const surrender: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["firearm"]["surrender"]
  > = AutoMovieMotionHumanActionRow.of(
    "surrender",
    gesture,
    HUMAN_FIREARM_SURRENDER,
  );
}
