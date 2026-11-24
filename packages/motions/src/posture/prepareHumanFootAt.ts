import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "./HumanFoot";

/** The alternatives of `PrepareHumanFootAtPivot`'s site. */
type PrepareHumanFootAtPivot = "heel" | "ball" | "toe" | "sole" | "mtp";

/**
 * Prepare a foot's fixed articulation while its sole contact moves in space.
 *
 * @param body The fixed body and sole socket owner.
 * @param side The foot.
 * @param pivot The socket whose position varies.
 * @param heading The fixed heading, degrees about +Y.
 * @param pitch The fixed pitch, degrees, positive toes up.
 * @param toes The fixed toe flexion, degrees; zero when absent.
 * @param roll The fixed foot roll, degrees; zero when absent.
 * @returns A reader of the contact in world metres with `HumanFoot.pivot`'s
 *   placement.
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
  const offset: IAutoMovieVector3 = Quaternion.rotateVector(
    rotation,
    HumanFoot.offset(body, side, pivot, toes),
  );
  return (at: IAutoMovieVector3): IAutoMovieMotionHumanFoot.IPlacement => ({
    ankle: Vector3.subtract(at, offset),
    rotation: { ...rotation },
  });
}
