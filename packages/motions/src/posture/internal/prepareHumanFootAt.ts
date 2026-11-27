import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "./HumanFoot";

/*
 * Prepare a foot's fixed articulation while its sole contact moves in space.
 * Parameter body: The fixed body and sole socket owner.
 * Parameter side: The foot.
 * Parameter pivot: The socket whose position varies.
 * Parameter heading: The fixed heading, degrees about +Y.
 * Parameter pitch: The fixed pitch, degrees, positive toes up.
 * Parameter toes: The fixed toe flexion, degrees; zero when absent.
 * Parameter roll: The fixed foot roll, degrees; zero when absent.
 * Returns: A reader of the contact in world metres with `HumanFoot.pivot`'s
 * placement.
 */
export function prepareHumanFootAt(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  pivot: PrepareHumanFootAtPivot,
  heading: number,
  pitch: number,
  toes: number = 0,
  roll: number = 0,
): (at: IAutoMovieVector3) => IAutoMovieMotionHumanFoot.IPlacement {
  const rotation: IAutoMovieQuaternion = HumanFoot.rotation(
    heading,
    pitch,
    roll,
  );
  const offset: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    rotation,
    HumanFoot.offset(body, side, pivot, toes),
  );
  return (at: IAutoMovieVector3): IAutoMovieMotionHumanFoot.IPlacement => ({
    ankle: AutoMovieEngineVector3.subtract(at, offset),
    rotation: { ...rotation },
  });
}

/*
 * The alternatives of `PrepareHumanFootAtPivot`'s site.
 */
type PrepareHumanFootAtPivot = "heel" | "ball" | "toe" | "sole" | "mtp";
