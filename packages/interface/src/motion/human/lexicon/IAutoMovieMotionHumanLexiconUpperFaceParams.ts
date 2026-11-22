import type { IAutoMovieMotionHumanHandToFace } from "../daily/IAutoMovieMotionHumanHandToFace";

/**
 * Open parameters of the upperFace lexicon family, keyed by each runtime export name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The upperFace family is a closed export-name map. Each key uses the law contract directly or projects its open parameters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the upperFace row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconUpperFaceParams {
  /** `handToFace` doing `drink`. */
  faceDrink: Omit<IAutoMovieMotionHumanHandToFace.IParams, "kind">;

  /** `handToFace` doing `sip`. */
  faceSip: Omit<IAutoMovieMotionHumanHandToFace.IParams, "kind">;

  /** `handToFace` doing `eat`. */
  faceEat: Omit<IAutoMovieMotionHumanHandToFace.IParams, "kind">;

  /** `handToFace` doing `bite`. */
  faceBite: Omit<IAutoMovieMotionHumanHandToFace.IParams, "kind">;

  /** `handToFace` doing `phone`. */
  facePhone: Omit<IAutoMovieMotionHumanHandToFace.IParams, "kind">;

  /** `handToFace` doing `read`. */
  faceRead: Omit<IAutoMovieMotionHumanHandToFace.IParams, "kind">;

  /** `handToFace` doing `brushTeeth`. */
  faceBrushTeeth: Omit<IAutoMovieMotionHumanHandToFace.IParams, "kind">;

  /** `handToFace` doing `comb`. */
  faceComb: Omit<IAutoMovieMotionHumanHandToFace.IParams, "kind">;

  /** `handToFace` doing `washFace`. */
  faceWashFace: Omit<IAutoMovieMotionHumanHandToFace.IParams, "kind">;

  /** `handToFace` doing `wipeMouth`. */
  faceWipeMouth: Omit<IAutoMovieMotionHumanHandToFace.IParams, "kind">;

  /** `handToFace` doing `pinchNose`. */
  facePinchNose: Omit<IAutoMovieMotionHumanHandToFace.IParams, "kind">;

  /** Cover the face with both hands. */
  coverFace: Pick<IAutoMovieMotionHumanHandToFace.IParams, "hold" | "manner">;

  /** Wipe one cheek with a hand or held tissue. */
  wipeTears: Omit<IAutoMovieMotionHumanHandToFace.IParams, "kind" | "other">;
}
