import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";

import { toolCaseContact } from "./toolCaseContact";

/*
 * A pot standing on a counter: a 0.24 m wide, 0.2 m deep vessel whose `inside`
 * floor and `rim` are the contacts `createVessel` declares.
 * Parameter at: Where its base stands, world metres.
 * Returns: The pot.
 */
export function toolCasePot(at: IAutoMovieVector3): IAutoMovieMotionHumanProp {
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const x: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  return {
    subject: "pot",
    frame: { position: at, rotation: AutoMovieEngineQuaternion.identity() },
    points: {},
    affordances: [
      toolCaseContact("rim", "surface", { x: 0, y: 0.2, z: 0 }, up, x, {
        width: 0.24,
        depth: 0.24,
      }),
      toolCaseContact("inside", "surface", { x: 0, y: 0.005, z: 0 }, up, x, {
        width: 0.23,
        depth: 0.23,
      }),
    ],
  };
}
