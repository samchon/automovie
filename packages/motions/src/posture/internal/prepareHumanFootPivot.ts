import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanFoot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFootRotation } from "./HumanFootRotation";
import { humanFootOffset } from "./humanFootOffset";

/*
 * Prepare rigid sole geometry for repeated pitch trials under one fixed
 * heading, toe flexion, roll and default contact. An explicit contact changes
 * only the translation under that same prepared geometry.
 * Parameter body: The body owning the sole socket.
 * Parameter side: The foot.
 * Parameter pivot: Which socket stays fixed.
 * Parameter at: The socket's fixed world position, metres.
 * Parameter heading: The fixed foot heading, degrees about +Y.
 * Parameter toes: The fixed toe flexion, degrees; zero when absent.
 * Parameter roll: The fixed foot roll, degrees; zero when absent.
 * Returns: A reader of pitch in degrees, positive toes up, with pivot's
 * placement; an explicit world contact replaces only the default at under the
 * same fixed rotation/socket preparation.
 */
export function prepareHumanFootPivot(
  body: humanFootOffset.IBody,
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
      ankle: AutoMovieEngineVector3.subtract(contact, AutoMovieEngineQuaternion.rotateVector(r, local)),
      rotation: r,
    };
  };
}

/*
 * The alternatives of `PrepareHumanFootPivotPivot`'s site.
 */
type PrepareHumanFootPivotPivot = "heel" | "ball" | "toe" | "sole" | "mtp";
