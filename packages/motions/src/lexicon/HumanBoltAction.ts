import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { operate } from "../affordance/operate";
import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";
import { release } from "../throwing/release";

/**
 * A bolt-action rifle's and a pistol's magazine handling, each a row of a
 * shipped law: `liftBolt` and `lowerBolt` turn the `bolt` hinge, `drawBolt` and
 * `closeBolt` run the `boltSlide` slider back and forward (the four motions of
 * cycling the bolt, composed in that order); `seatMagazine` inserts a magazine
 * into the gun's `magazine` socket (`operate`'s `insert`); `pressRelease`
 * presses the magazine release button and `dropMagazine` lets the empty
 * magazine fall (`release`). The composition gives the contacts; the timings
 * are `operate`'s paces, provisional: the bolt handle's hinge moves at 0.6 m/s
 * along its arc, the bolt slide and the inserted magazine at 0.4 m/s and the
 * release button press takes 0.25 s (`operate.PACE`).
 */
export namespace HumanBoltAction {
  /** Lift the bolt handle. */
  export const liftBolt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["boltAction"]["liftBolt"]
  > = AutoMovieMotionHumanActionRow.of("liftBolt", operate, {});

  /** Draw the bolt back. */
  export const drawBolt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["boltAction"]["drawBolt"]
  > = AutoMovieMotionHumanActionRow.of("drawBolt", operate, {});

  /** Run the bolt forward. */
  export const closeBolt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["boltAction"]["closeBolt"]
  > = AutoMovieMotionHumanActionRow.of("closeBolt", operate, {});

  /** Turn the bolt handle down. */
  export const lowerBolt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["boltAction"]["lowerBolt"]
  > = AutoMovieMotionHumanActionRow.of("lowerBolt", operate, {});

  /** Seat a magazine in its well. */
  export const seatMagazine: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["boltAction"]["seatMagazine"]
  > = AutoMovieMotionHumanActionRow.of("seatMagazine", operate, {});

  /** Press the magazine release. */
  export const pressRelease: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["boltAction"]["pressRelease"]
  > = AutoMovieMotionHumanActionRow.of("pressRelease", operate, {});

  /** Let the empty magazine drop. */
  export const dropMagazine: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["boltAction"]["dropMagazine"]
  > = AutoMovieMotionHumanActionRow.of("dropMagazine", release, {});
}
