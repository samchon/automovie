import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { handToFace } from "../daily/handToFace";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * The tasks that bring a hand, or what it holds, to the face as rows (#3361): each task of `handToFace` under a name of its own, the side, the count, the time and the held prop open.
 *
 * Each row writes no motion: its law plans it, so it fits any body, refuses and is checked as the law is, and its draws are keyed by its own name. The rows over the arm's phrases themselves are `HumanUpperRows`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row fixes and what it leaves open.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`), data over a law that already fits the body and refuses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per value of the law's closed union and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own or restates a value of the law.
 */
export namespace HumanHandToFaceRows {
  /** `handToFace` doing `drink`. */
  export const faceDrink: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceDrink"]
  > = HumanActionRow.of("faceDrink", handToFace, {
    task: "drink",
  });

  /** `handToFace` doing `sip`. */
  export const faceSip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceSip"]
  > = HumanActionRow.of("faceSip", handToFace, {
    task: "sip",
  });

  /** `handToFace` doing `eat`. */
  export const faceEat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceEat"]
  > = HumanActionRow.of("faceEat", handToFace, {
    task: "eat",
  });

  /** `handToFace` doing `bite`. */
  export const faceBite: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceBite"]
  > = HumanActionRow.of("faceBite", handToFace, {
    task: "bite",
  });

  /** `handToFace` doing `phone`. */
  export const facePhone: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["facePhone"]
  > = HumanActionRow.of("facePhone", handToFace, {
    task: "phone",
  });

  /** `handToFace` doing `read`. */
  export const faceRead: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceRead"]
  > = HumanActionRow.of("faceRead", handToFace, {
    task: "read",
  });

  /** `handToFace` doing `brushTeeth`. */
  export const faceBrushTeeth: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceBrushTeeth"]
  > = HumanActionRow.of("faceBrushTeeth", handToFace, { task: "brushTeeth" });

  /** `handToFace` doing `comb`. */
  export const faceComb: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceComb"]
  > = HumanActionRow.of("faceComb", handToFace, {
    task: "comb",
  });

  /** `handToFace` doing `washFace`. */
  export const faceWashFace: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceWashFace"]
  > = HumanActionRow.of("faceWashFace", handToFace, {
    task: "washFace",
  });

  /** `handToFace` doing `wipeMouth`. */
  export const faceWipeMouth: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceWipeMouth"]
  > = HumanActionRow.of("faceWipeMouth", handToFace, {
    task: "wipeMouth",
  });
}
