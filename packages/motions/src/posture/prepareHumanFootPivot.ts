import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFootRotation } from "./HumanFootRotation";
import { humanFootOffset } from "./humanFootOffset";

/** The alternatives of `PrepareHumanFootPivotPivot`'s site. */
type PrepareHumanFootPivotPivot = "heel" | "ball" | "toe" | "sole" | "mtp";

/**
 * Prepare rigid sole geometry for repeated pitch trials under one fixed
 * heading, toe flexion, roll and default contact. An explicit contact changes
 * only the translation under that same prepared geometry.
 *
 * @param body The body owning the sole socket.
 * @param side The foot.
 * @param pivot Which socket stays fixed.
 * @param at The socket's fixed world position, metres.
 * @param heading The fixed foot heading, degrees about +Y.
 * @param toes The fixed toe flexion, degrees; zero when absent.
 * @param roll The fixed foot roll, degrees; zero when absent.
 * @returns A reader of pitch in degrees, positive toes up, with pivot's
 *   placement; an explicit world contact replaces only the default at under
 *   the same fixed rotation/socket preparation.
 */
export function prepareHumanFootPivot(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  pivot: PrepareHumanFootPivotPivot,
  at: IAutoMovieVector3,
  heading: number,
  toes: number = 0,
  roll: number = 0,
): (
  pitch: number,
  contact?: IAutoMovieVector3,
) => IAutoMovieMotionHumanFoot.IPlacement {
  const turned: ReturnType<typeof HumanFootRotation.prepare> =
    HumanFootRotation.prepare(heading, roll);
  const local: IAutoMovieVector3 = humanFootOffset(body, side, pivot, toes);
  return (
    pitch: number,
    contact: IAutoMovieVector3 = at,
  ): IAutoMovieMotionHumanFoot.IPlacement => {
    const r: IAutoMovieQuaternion = turned(pitch);
    return {
      ankle: Vector3.subtract(contact, Quaternion.rotateVector(r, local)),
      rotation: r,
    };
  };
}
