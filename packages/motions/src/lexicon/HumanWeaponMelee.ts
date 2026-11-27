import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";
import { HUMAN_BLADE_CLUB_STRIKE } from "../next/presets/HUMAN_BLADE_CLUB_STRIKE";
import { HUMAN_BLADE_CLUB_SWING } from "../next/presets/HUMAN_BLADE_CLUB_SWING";
import { HUMAN_BLADE_RELOAD } from "../next/presets/HUMAN_BLADE_RELOAD";
import { touch } from "../touch/internal/touch";
import { HumanSword } from "./HumanSword";
import { HumanSwordThrust } from "./HumanSwordThrust";

/**
 * One-handed melee weapons and the firearm's reload under film names, each a
 * blade row with the blade timing of `IAutoMovieMotionHumanSword` (a cut's edge
 * at 6 to 10 m/s, a thrust's point at 2.6 to 3.2 m/s, by skill), and each a row
 * of a blade law or of the touch. The composition gives the weapon the hand
 * holds (`blade`; a club's striking contact is `tip: "strike"`, fixed here) and
 * the target; with neither, the row is a shadow stroke of the empty hand. The
 * receiver's part is its own row (`HumanStageFight`).
 *
 * First pass: a blow is the arm's stroke with the advance the cut offers; a
 * body does not stop it. The reload brings the support hand's palm to the place
 * the composition names (the pistol's `magazine` contact); no magazine is
 * exchanged.
 */
export namespace HumanWeaponMelee {
  /** A club or a bat swung level at a person or a thing. */
  export const clubSwing: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["weaponMelee"]["clubSwing"]
  > = AutoMovieMotionHumanActionRow.of(
    "clubSwing",
    HumanSword.cut,
    HUMAN_BLADE_CLUB_SWING,
  );

  /** A club or a baton brought down from overhead. */
  export const clubStrike: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["weaponMelee"]["clubStrike"]
  > = AutoMovieMotionHumanActionRow.of(
    "clubStrike",
    HumanSword.cut,
    HUMAN_BLADE_CLUB_STRIKE,
  );

  /** A knife slashed across from the knife hand's side. */
  export const knifeSlash: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["weaponMelee"]["knifeSlash"]
  > = AutoMovieMotionHumanActionRow.of("knifeSlash", HumanSword.cut, {
    from: "forehand",
  });

  /** A knife slashed back across from the off side. */
  export const knifeBackslash: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["weaponMelee"]["knifeBackslash"]
  > = AutoMovieMotionHumanActionRow.of("knifeBackslash", HumanSword.cut, {
    from: "backhand",
  });

  /**
   * A knife driven forward, the point first, with the least advance that
   * reaches.
   */
  export const knifeStab: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["weaponMelee"]["knifeStab"]
  > = AutoMovieMotionHumanActionRow.of(
    "knifeStab",
    HumanSwordThrust.thrust,
    {},
  );

  /**
   * A knife held point down (taken by its `reverseGrip`) and driven down from
   * overhead.
   */
  export const stabOverhand: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["weaponMelee"]["stabOverhand"]
  > = AutoMovieMotionHumanActionRow.of("stabOverhand", HumanSword.cut, {
    from: "above",
  });

  /**
   * A reload: the support hand's palm pressed once to the magazine well the
   * composition names.
   */
  export const reload: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["weaponMelee"]["reload"]
  > = AutoMovieMotionHumanActionRow.of(
    "reloadFirearm",
    touch,
    HUMAN_BLADE_RELOAD,
  );
}
