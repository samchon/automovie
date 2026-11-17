import type { IAutoMovieMotionHumanHandToFace } from "../daily/IAutoMovieMotionHumanHandToFace";

/**
 * Open parameters of the upperFace lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The upperFace family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the upperFace row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconUpperFaceParams {
  /** `handToFace` doing `drink`. */
  faceDrink: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;

  /** `handToFace` doing `sip`. */
  faceSip: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;

  /** `handToFace` doing `eat`. */
  faceEat: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;

  /** `handToFace` doing `bite`. */
  faceBite: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;

  /** `handToFace` doing `phone`. */
  facePhone: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;

  /** `handToFace` doing `read`. */
  faceRead: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;

  /** `handToFace` doing `brushTeeth`. */
  faceBrushTeeth: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;

  /** `handToFace` doing `comb`. */
  faceComb: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;

  /** `handToFace` doing `washFace`. */
  faceWashFace: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;

  /** `handToFace` doing `wipeMouth`. */
  faceWipeMouth: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;
}
