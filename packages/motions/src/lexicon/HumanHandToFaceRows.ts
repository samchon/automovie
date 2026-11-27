import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { handToFace } from "../daily/internal/handToFace";
import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";

/**
 * The tasks that bring a hand, or what it holds, to the face as rows: each task
 * of `handToFace` under a name of its own, the side, the count, the time and
 * the held prop open.
 *
 * Each row writes no motion: its law plans it, so it fits any body, refuses and
 * is checked as the law is, and its draws are keyed by its own name. The rows
 * over the arm's phrases themselves are `HumanUpperRows`.
 */
export namespace HumanHandToFaceRows {
  /**
   * `handToFace` doing `drink`: held 1.71 s at the mouth (Alt Murphy et al.
   * 2006, healthy controls); drinking a glass or a cup
   * ({@link handToFaceRows.ROWS}; the hand's travel to the face comes before).
   */
  export const faceDrink: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceDrink"]
  > = AutoMovieMotionHumanActionRow.of("faceDrink", handToFace, {
    kind: "drink",
  });

  /**
   * `handToFace` doing `sip`: held 0.5 s at the mouth, provisional; a taste, a
   * small sip ({@link handToFaceRows.ROWS}; the hand's travel to the face comes
   * before).
   */
  export const faceSip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceSip"]
  > = AutoMovieMotionHumanActionRow.of("faceSip", handToFace, {
    kind: "sip",
  });

  /**
   * `handToFace` doing `eat`: held 0.3 s at the mouth, provisional; a mouthful
   * by hand ({@link handToFaceRows.ROWS}; the hand's travel to the face comes
   * before).
   */
  export const faceEat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceEat"]
  > = AutoMovieMotionHumanActionRow.of("faceEat", handToFace, {
    kind: "eat",
  });

  /**
   * `handToFace` doing `bite`: held 0.4 s at the mouth, provisional; a bite of
   * something held ({@link handToFaceRows.ROWS}; the hand's travel to the face
   * comes before).
   */
  export const faceBite: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceBite"]
  > = AutoMovieMotionHumanActionRow.of("faceBite", handToFace, {
    kind: "bite",
  });

  /**
   * `handToFace` doing `phone`: held 3 s at the ear, provisional; a phone call
   * ({@link handToFaceRows.ROWS}; the hand's travel to the face comes before).
   */
  export const facePhone: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["facePhone"]
  > = AutoMovieMotionHumanActionRow.of("facePhone", handToFace, {
    kind: "phone",
  });

  /**
   * `handToFace` doing `read`: held 3 s at the reading distance, provisional; a
   * glance at a sheet or a screen ({@link handToFaceRows.ROWS}; the hand's
   * travel to the face comes before).
   */
  export const faceRead: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceRead"]
  > = AutoMovieMotionHumanActionRow.of("faceRead", handToFace, {
    kind: "read",
  });

  /**
   * `handToFace` doing `brushTeeth`: 8 strokes at the mouth, then 0.2 s,
   * provisional; brushing the teeth ({@link handToFaceRows.ROWS}; the hand's
   * travel to the face comes before).
   */
  export const faceBrushTeeth: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceBrushTeeth"]
  > = AutoMovieMotionHumanActionRow.of("faceBrushTeeth", handToFace, {
    kind: "brushTeeth",
  });

  /**
   * `handToFace` doing `comb`: 3 strokes at the temple, then 0.2 s,
   * provisional; combing the hair ({@link handToFaceRows.ROWS}; the hand's
   * travel to the face comes before).
   */
  export const faceComb: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceComb"]
  > = AutoMovieMotionHumanActionRow.of("faceComb", handToFace, {
    kind: "comb",
  });

  /**
   * `handToFace` doing `washFace`: 3 strokes on the cheeks with both palms,
   * then 0.2 s, provisional; washing the face ({@link handToFaceRows.ROWS}; the
   * hand's travel to the face comes before).
   */
  export const faceWashFace: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceWashFace"]
  > = AutoMovieMotionHumanActionRow.of("faceWashFace", handToFace, {
    kind: "washFace",
  });

  /**
   * `handToFace` doing `wipeMouth`: 2 strokes across the mouth, then 0.2 s,
   * provisional; wiping the mouth ({@link handToFaceRows.ROWS}; the hand's
   * travel to the face comes before).
   */
  export const faceWipeMouth: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["faceWipeMouth"]
  > = AutoMovieMotionHumanActionRow.of("faceWipeMouth", handToFace, {
    kind: "wipeMouth",
  });

  /**
   * `handToFace` doing `pinchNose`: held 1 s at the nose, provisional; a diver
   * equalizing ({@link handToFaceRows.ROWS}; the hand's travel to the face comes
   * before).
   */
  export const facePinchNose: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["upperFace"]["facePinchNose"]
  > = AutoMovieMotionHumanActionRow.of("facePinchNose", handToFace, {
    kind: "pinchNose",
  });
}
