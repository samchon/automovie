import type { IAutoMovieMotionHumanHandToFace } from "./IAutoMovieMotionHumanHandToFace";

/**
 * Open parameters of the upperFace lexicon family, keyed by each runtime export
 * name.
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
