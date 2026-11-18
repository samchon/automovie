import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { operate } from "../affordance/operate";
import { HumanActionRow } from "../law/HumanActionRow";
import { release } from "../throwing/release";

/**
 * A bolt-action rifle's and a pistol's magazine handling (#3488), each a
 * row of a shipped law: `liftBolt` and `lowerBolt` turn the `bolt` hinge,
 * `drawBolt` and `closeBolt` run the `boltSlide` slider back and forward
 * (the four motions of cycling the bolt, composed in that order);
 * `seatMagazine` inserts a magazine into the gun's `magazine` socket
 * (`operate`'s `insert`); `pressRelease` presses the magazine release
 * button and `dropMagazine` lets the empty magazine fall (`release`).
 * The composition gives the contacts; the timings are the laws',
 * provisional.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row operates, the order of a cycle and what is provisional.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface #3488's bolt and magazine rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own.
 */
export namespace HumanBoltAction {
  /** Lift the bolt handle. */
  export const liftBolt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["boltAction"]["liftBolt"]
  > = HumanActionRow.of("liftBolt", operate, {});

  /** Draw the bolt back. */
  export const drawBolt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["boltAction"]["drawBolt"]
  > = HumanActionRow.of("drawBolt", operate, {});

  /** Run the bolt forward. */
  export const closeBolt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["boltAction"]["closeBolt"]
  > = HumanActionRow.of("closeBolt", operate, {});

  /** Turn the bolt handle down. */
  export const lowerBolt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["boltAction"]["lowerBolt"]
  > = HumanActionRow.of("lowerBolt", operate, {});

  /** Seat a magazine in its well. */
  export const seatMagazine: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["boltAction"]["seatMagazine"]
  > = HumanActionRow.of("seatMagazine", operate, {});

  /** Press the magazine release. */
  export const pressRelease: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["boltAction"]["pressRelease"]
  > = HumanActionRow.of("pressRelease", operate, {});

  /** Let the empty magazine drop. */
  export const dropMagazine: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["boltAction"]["dropMagazine"]
  > = HumanActionRow.of("dropMagazine", release, {});
}
