import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { operate } from "../affordance/operate";
import { pickUp } from "../handling/pickUp";
import { putDown } from "../handling/putDown";
import { HumanActionRow } from "../law/HumanActionRow";
import { HUMAN_MILITARY_DRILL_BITE_CARTRIDGE } from "../next/presets/HUMAN_MILITARY_DRILL_BITE_CARTRIDGE";
import { HUMAN_MILITARY_DRILL_SEIZE } from "../next/presets/HUMAN_MILITARY_DRILL_SEIZE";
import { HUMAN_MILITARY_DRILL_SHOULDER_ARMS } from "../next/presets/HUMAN_MILITARY_DRILL_SHOULDER_ARMS";
import { HUMAN_MILITARY_DRILL_TAKE_FIRELOCK } from "../next/presets/HUMAN_MILITARY_DRILL_TAKE_FIRELOCK";
import { touch } from "../touch/touch";
import { HumanWeaponPresent } from "./HumanWeaponPresent";

/**
 * The musket's drill, the one musket lexicon: the 1764 Manual Exercise's carry
 * positions, its Prime and Load in its own order, and its firings, each a row
 * of a shipped law on the musket's, the cartridge's and the pouch's
 * affordances. One soldier's rows; the manual's three ranks are the crowds
 * campaign's to arrange.
 *
 * In the manual's order: `handleCartridge` (a pick up of a cartridge from the
 * pouch's slot), `biteCartridge` (a touch of the cartridge's `end` to the
 * mouth), `prime` (a touch of the cartridge to the `pan`), `shutPan` (an
 * operation of the `frizzen` hinge), `castAbout` (presenting at a high ready,
 * the muzzle up before the body), `charge` (a put down of the cartridge into
 * the `muzzle`), `drawRammer` (an operation of the `ramrod` slider, then a pick
 * up of the rod), `ramDown` (an operation inserting the rod into the `muzzle`,
 * withdrawn), `returnRammer` (a put down into the pipe), `seize` (the right
 * hand on the small of the stock, the left still under the butt), `recover`
 * (the left hand from the butt to above the lock, the firelock upright before
 * the body, its butt at the left breast, the manual's Make Ready beginning
 * "SPRING the firelock briskly to the recover"), `makeReady` over it (an
 * operation of the `cock` hinge to full cock), then `presentMusket` and
 * `fireMusket`. `takeFirelock` takes the musket by its `butt` in the left hand,
 * `shoulderArms` carries it shouldered against the left shoulder, its butt on
 * the hip, and `orderArms` sets its butt down by the foot.
 *
 * The manual gives the order and the count of motions, not their durations:
 * each row's timing is its law's, provisional, and the composed Prime and Load
 * is to fall inside a trained soldier's rate, which a primary source is still
 * to give (secondary sources give about three rounds a minute). Biting and
 * pouring are the hand brought to the place; the fingers' fine work is not yet
 * planned.
 */
export namespace HumanMusketDrill {
  /**
   * Take the firelock: the musket taken up by its butt in the left hand, the
   * hand that carries it shouldered ("Quit the left Hand and place it strong
   * Upon the Butt", the 1764 Manual Exercise, Shoulder your Firelocks).
   */
  export const takeFirelock: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["takeFirelock"]
  > = HumanActionRow(
    "takeFirelock",
    pickUp,
    HUMAN_MILITARY_DRILL_TAKE_FIRELOCK,
  );

  /**
   * Shoulder arms: the manual's Position of a Soldier under Arms, "the firelock
   * to be carried on the left Shoulder", "the Flat of the Butt, to be supported
   * against the hip-bone ... that it may stand before the Hollow of the
   * Shoulder ... the barrel almost perpendicular", in the left hand, "the right
   * Hand hanging straight down the Side" (a present at the `shoulder`
   * carriage).
   */
  export const shoulderArms: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["shoulderArms"]
  > = HumanActionRow(
    "shoulderArms",
    HumanWeaponPresent.present,
    HUMAN_MILITARY_DRILL_SHOULDER_ARMS,
  );

  /** Order arms: set the butt down by the foot. */
  export const orderArms: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["orderArms"]
  > = HumanActionRow("orderArms", putDown, {});

  /** Handle cartridge: take one from the pouch. */
  export const handleCartridge: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["handleCartridge"]
  > = HumanActionRow("handleCartridge", pickUp, {
    handle: "body",
  });

  /** Bite the cartridge: its end brought to the mouth. */
  export const biteCartridge: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["biteCartridge"]
  > = HumanActionRow(
    "biteCartridge",
    touch,
    HUMAN_MILITARY_DRILL_BITE_CARTRIDGE,
  );

  /** Prime: the cartridge brought to the pan. */
  export const prime: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["prime"]
  > = HumanActionRow("prime", touch, {});

  /** Shut the pan: the frizzen closed. */
  export const shutPan: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["shutPan"]
  > = HumanActionRow("shutPan", operate, {});

  /** Cast about: the musket brought before the body, the muzzle up. */
  export const castAbout: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["castAbout"]
  > = HumanActionRow("castAbout", HumanWeaponPresent.present, {
    carriage: "highReady",
  });

  /** Charge with cartridge: the cartridge set into the muzzle. */
  export const charge: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["charge"]
  > = HumanActionRow("charge", putDown, {});

  /** Draw the rammer from its pipe. */
  export const drawRammer: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["drawRammer"]
  > = HumanActionRow("drawRammer", operate, {});

  /** Ram down the cartridge: the rod inserted into the bore and withdrawn. */
  export const ramDown: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["ramDown"]
  > = HumanActionRow("ramDown", operate, {});

  /** Return the rammer to its pipe. */
  export const returnRammer: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["returnRammer"]
  > = HumanActionRow("returnRammer", putDown, {});

  /**
   * Seize: the right hand raised from the side to take the shouldered firelock
   * by the small of its stock, "the right hand is raised briskly from the right
   * Side, and seizes the Firelock across the breast" (the 1764 Manual Exercise,
   * Prime and Load, first motion; Poise, first motion: "Seize the firelock with
   * your right hand"), the left still under the butt.
   */
  export const seize: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["seize"]
  > = HumanActionRow("seize", pickUp, HUMAN_MILITARY_DRILL_SEIZE);

  /**
   * Recover: the firelock brought from the shoulder upright before the body,
   * "the Butt close to the left breast, but not pressed, the Firelock
   * perpendicular, opposite the left Side of the Face" (the 1764 Manual
   * Exercise, Make Ready: "SPRING the firelock briskly to the recover"), the
   * left hand coming "with a quick motion from the Butt" to seize "the Firelock
   * strong above the Lock" (Prime and Load, first motion), after `seize` has
   * the right hand on the stock.
   */
  export const recover: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["recover"]
  > = HumanActionRow("recover", HumanWeaponPresent.present, {
    carriage: "recover",
  });

  /**
   * Make ready: the cock drawn to full cock, over `recover`
   * (`HumanChain.over`).
   */
  export const makeReady: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["makeReady"]
  > = HumanActionRow("makeReady", operate, {});

  /** Present: the musket to the cheek on the line. */
  export const presentMusket: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["presentMusket"]
  > = HumanActionRow("presentMusket", HumanWeaponPresent.present, {});

  /** Fire: the trigger pulled, the lock falling. */
  export const fireMusket: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["musketDrill"]["fireMusket"]
  > = HumanActionRow("fireMusket", HumanWeaponPresent.fire, {});
}
