import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { HumanActionRow } from "../law/HumanActionRow";
import { touch } from "../touch/touch";

/**
 * The contact strokes as rows (#3361): each kind of `touch` under a name of its own, the site, the effector, the side and the target open, so one row serves every site (#3357).
 *
 * Each row writes no motion: its law plans it, so it fits any body, refuses and is checked as the law is, and its draws are keyed by its own name. The rows over the arm's phrases themselves are `HumanUpperRows`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row fixes and what it leaves open.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`), data over a law that already fits the body and refuses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per value of the law's closed union and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own or restates a value of the law.
 */
export namespace HumanTouchRows {
  /** `touch` of kind `tap`. */
  export const touchTap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["touchTap"]
  > = HumanActionRow.of("touchTap", touch, { kind: "tap" });

  /** `touch` of kind `pat`. */
  export const touchPat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["touchPat"]
  > = HumanActionRow.of("touchPat", touch, { kind: "pat" });

  /** `touch` of kind `stroke`. */
  export const touchStroke: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["touchStroke"]
  > = HumanActionRow.of("touchStroke", touch, {
    kind: "stroke",
  });

  /** `touch` of kind `rub`. */
  export const touchRub: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["touchRub"]
  > = HumanActionRow.of("touchRub", touch, { kind: "rub" });

  /** `touch` of kind `press`. */
  export const touchPress: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["touchPress"]
  > = HumanActionRow.of("touchPress", touch, {
    kind: "press",
  });

  /** `touch` of kind `squeeze`. */
  export const touchSqueeze: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["touchSqueeze"]
  > = HumanActionRow.of("touchSqueeze", touch, {
    kind: "squeeze",
  });

  /** `touch` of kind `hold`. */
  export const touchHold: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["touchHold"]
  > = HumanActionRow.of("touchHold", touch, {
    kind: "hold",
  });

  /** `touch` of kind `scratch`. */
  export const touchScratch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperTouch"]["touchScratch"]
  > = HumanActionRow.of("touchScratch", touch, {
    kind: "scratch",
  });
}
