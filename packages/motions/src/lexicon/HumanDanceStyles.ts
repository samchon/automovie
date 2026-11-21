import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { balletStep } from "../exercise/balletStep";
import { tapDance } from "../exercise/tapDance";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * Dance styles beyond the social steps (#3991): tap and classical ballet,
 * each a row of its law on the dance law's beat clock, the step left open.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is and what it leaves open.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (`HumanActionRow`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per style.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own.
 */
export namespace HumanDanceStyles {
  /** Tap steps whose strikes sound on the beat's subdivisions. */
  export const tap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["tap"]
  > = HumanActionRow.of("tap", tapDance, {});

  /** A ballet position, pirouette or grand jeté. */
  export const ballet: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["sport"]["ballet"]
  > = HumanActionRow.of("ballet", balletStep, {});
}
