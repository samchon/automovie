import { AutoMovieExpressionPreset } from "../expression/AutoMovieExpressionPreset";
import { IAutoMovieActionBase } from "./IAutoMovieActionBase";

/** Play a facial expression; engine: blendshape/expression channels. */
export interface IAutoMovieEmoteAction extends IAutoMovieActionBase {
  /** Selects a facial expression as the action family. */
  verb: "emote";

  /** Named expression preset applied by the action. */
  preset: AutoMovieExpressionPreset;

  /** Strength `[0,1]`. */
  intensity: number;
}
