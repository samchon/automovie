import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { balletStep } from "../exercise/balletStep";
import { groupDance } from "../exercise/groupDance";
import { streetDance } from "../exercise/streetDance";
import { tapDance } from "../exercise/tapDance";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * Dance styles beyond the social steps: tap, classical ballet, street grooves
 * and social group dances, each a row of its law on the dance law's beat clock,
 * the step left open. The clock keeps 120 beats a minute, 0.5 s a beat
 * (`dance.BPM`), unless `bpm` or a cue track sets it; `beats` counts the beats
 * of a street groove and of ballet's position. No tempo by style (a waltz, a
 * hip-hop groove) is defined: choose `bpm` (provisional, missing).
 */
export namespace HumanDanceStyles {
  /** Tap steps whose strikes sound on the beat's subdivisions. */
  export const tap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["tap"]
  > = HumanActionRow("tap", tapDance, {});

  /** A ballet position, pirouette or grand jeté. */
  export const ballet: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["ballet"]
  > = HumanActionRow("ballet", balletStep, {});

  /** A street groove: the rock with its hits, or the moonwalk. */
  export const streetGroove: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["streetGroove"]
  > = HumanActionRow("streetGroove", streetDance, {});

  /** A social group dance: a line, a circle or a conga. */
  export const socialDance: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["socialDance"]
  > = HumanActionRow("socialDance", groupDance, {});
}
