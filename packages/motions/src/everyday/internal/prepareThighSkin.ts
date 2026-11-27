import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";

/*
 * Prepare the seated palm's fixed ray against its own thigh in bone metres. The
 * same rigid bone transports both the collider and the authored ray, so their
 * intersection only needs to be found once. Each query places the hit on the
 * actual current thigh frame from the seated leg fit.
 */
export function prepareThighSkin(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
): (thigh: IAutoMovieResolvedBone) => IAutoMovieVector3 {
  const frame: IAutoMovieMotionHumanBody["surfaces"]["regions"]["thighFrontLeft"] =
    body.surfaces.regions[
      side === "left" ? "thighFrontLeft" : "thighFrontRight"
    ];
  const identity: IAutoMovieResolvedBone["worldRotation"] = {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  };
  const neutral: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    new Map([
      [
        frame.bone,
        {
          bone: frame.bone,
          localRotation: identity,
          worldPosition: { x: 0, y: 0, z: 0 },
          worldRotation: identity,
        },
      ],
    ]);
  const skin: IAutoMovieVector3 = prepareThighSkin.cast(
    body,
    neutral,
    frame.point,
    frame.normal,
  );
  return (thigh: IAutoMovieResolvedBone): IAutoMovieVector3 =>
    Vector3.add(
      thigh.worldPosition,
      Quaternion.rotateVector(thigh.worldRotation, skin),
    );
}

/*
 * The shared ray for local and current world thigh frames.
 */
export namespace prepareThighSkin {
  /*
   * Place this thigh's collider and trace the support ray in its current frame.
   */
  export function cast(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    point: IAutoMovieVector3,
    normal: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    let ball: number = 0;
    for (const segment of HumanColliders.placed(body, bones))
      for (const shape of segment.shapes)
        ball = Math.max(ball, HumanColliders.bound(shape).radius);
    return ball === 0
      ? point
      : (HumanColliders.cast(
          body,
          bones,
          Vector3.addScaled(point, normal, 2 * ball),
          Vector3.scale(normal, -1),
          4 * ball,
        )?.point ?? point);
  }
}
