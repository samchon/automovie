import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";
import { HUMAN_ARCHERY_THROW_JAVELIN } from "../next/presets/HUMAN_ARCHERY_THROW_JAVELIN";
import { HUMAN_ARCHERY_THROW_KNIFE } from "../next/presets/HUMAN_ARCHERY_THROW_KNIFE";
import { throwObject } from "../throwing/throwObject";

/**
 * Thrown weapons as rows of `throwObject`, each throwing the held prop the
 * composition names (`prop`), which rides the hand to the release and then
 * flies. Every row throws overarm with the style's 0.5 s windup, at a release
 * angle of 20 degrees but the javelin and the spear's 33.9, and the speed that
 * range equation gives for the stand-off
 * (`IAutoMovieMotionHumanThrowObjectForm.Style`): a farther target is a faster
 * throw, and no row fixes a speed.
 *
 * - `throwJavelin` and `throwSpear`: overarm, the shaft along its velocity,
 *   released at the middle of the release angles Campos, Brizuela and Ramón
 *   (2004) measured in elite men at the 1999 World Championships (27.7 to 40.1
 *   degrees), 33.9 degrees; a soldier's lower speed follows from the range
 *   equation to the target. The athletes' run-up is not planned here.
 * - `throwKnife`: overarm, spinning at the throwing arm's rate rounded to a whole
 *   number of half turns over the flight to the target, so the stand-off
 *   decides the turns (`throwObjectLever.spin`).
 * - `throwGrenade`, `hurlStone` and `hurlBottle`: overarm at the style's angle,
 *   the body tumbling as it was released.
 * - `sling` and `castAtlatl`: overarm from the implement the composition names
 *   (`implement`, a sling's pouch, an atlatl's spur), which lengthens the lever
 *   the launch leaves from (`throwObjectLever`).
 */
export namespace HumanThrownWeapon {
  /** Throw a javelin overarm, its shaft along its flight. */
  export const throwJavelin: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["thrownWeapon"]["throwJavelin"]
  > = AutoMovieMotionHumanActionRow.of(
    "throwJavelin",
    throwObject,
    HUMAN_ARCHERY_THROW_JAVELIN,
  );

  /** Throw a spear overarm, its shaft along its flight. */
  export const throwSpear: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["thrownWeapon"]["throwSpear"]
  > = AutoMovieMotionHumanActionRow.of(
    "throwSpear",
    throwObject,
    HUMAN_ARCHERY_THROW_JAVELIN,
  );

  /** Throw a knife overarm, spinning whole half turns to the target. */
  export const throwKnife: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["thrownWeapon"]["throwKnife"]
  > = AutoMovieMotionHumanActionRow.of(
    "throwKnife",
    throwObject,
    HUMAN_ARCHERY_THROW_KNIFE,
  );

  /** Lob a grenade overarm. */
  export const throwGrenade: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["thrownWeapon"]["throwGrenade"]
  > = AutoMovieMotionHumanActionRow.of("throwGrenade", throwObject, {
    style: "overarm",
  });

  /** Hurl a stone overarm. */
  export const hurlStone: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["thrownWeapon"]["hurlStone"]
  > = AutoMovieMotionHumanActionRow.of("hurlStone", throwObject, {
    style: "overarm",
  });

  /** Hurl a bottle overarm. */
  export const hurlBottle: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["thrownWeapon"]["hurlBottle"]
  > = AutoMovieMotionHumanActionRow.of("hurlBottle", throwObject, {
    style: "overarm",
  });

  /** Sling a stone from the sling the composition names (`implement`). */
  export const sling: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["thrownWeapon"]["sling"]
  > = AutoMovieMotionHumanActionRow.of("sling", throwObject, {
    style: "overarm",
  });

  /** Cast a dart with the atlatl the composition names (`implement`). */
  export const castAtlatl: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["thrownWeapon"]["castAtlatl"]
  > = AutoMovieMotionHumanActionRow.of("castAtlatl", throwObject, {
    style: "overarm",
  });
}
