import { AutoMovieEngineTransform } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * A ball as a prop: its `grip` at its centre with its diameter as the aperture,
 * the contact `createBall` declares.
 * Parameter centre: The ball's centre, world metres.
 * Parameter radius: Its radius, metres.
 * Returns: The ball.
 */
export function ballStrikeCaseBall(
  centre: IAutoMovieVector3,
  radius: number,
): IAutoMovieMotionHumanProp {
  return {
    subject: "ball",
    frame: { position: centre, rotation: { x: 0, y: 0, z: 0, w: 1 } },
    points: {},
    affordances: [
      {
        id: "grip",
        kind: "handle",
        frame: AutoMovieEngineTransform.identity(),
        extent: null,
        grip: "power",
        aperture: 2 * radius,
      },
    ],
  };
}
