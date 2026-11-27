import { AutoMovieEngineTransform } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";

import { typeText } from "../../../everyday/internal/typeText";

/*
 * A keyboard as a prop: a home row contact at its origin and a key field as
 * wide as the letter rows, the prop placed there and turned so its `+Z` side,
 * where a typist sits, faces the typist at the origin facing `+Z`.
 * Parameter at: The home row's middle, world metres.
 * Returns: The keyboard.
 */
export function everydayTypeCaseBoard(
  at: IAutoMovieVector3,
): IAutoMovieMotionHumanProp {
  return {
    subject: "keyboard",
    frame: { position: at, rotation: { x: 0, y: 1, z: 0, w: 0 } },
    points: {},
    affordances: [
      {
        id: "homeRow",
        kind: "surface",
        frame: AutoMovieEngineTransform.identity(),
        extent: null,
      },
      {
        id: "keys",
        kind: "surface",
        frame: AutoMovieEngineTransform.identity(),
        extent: null,
        width: typeText.WIDTH,
      },
    ],
  };
}
