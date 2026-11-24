import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLegChain,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLegChain } from "./HumanLegChain";
import { applyHumanLimbFit } from "./applyHumanLimbFit";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

/**
 * Prepare only a fixed leg source pose and exact FK workspace while each
 * target/bend/rotation/near request still invokes the limb fit, solved
 * directly. The body, pelvis rotation and hip point remain unchanged for this
 * synchronous piece; no fitted result or target is stored here.
 *
 * @param body The unchanged canonical body.
 * @param side The fixed leg.
 * @param pelvis Fixed model-frame pelvis rotation.
 * @param hip Fixed model-metre hip point.
 * @param readSwivel The existing leg reader applied to each actual fitted
 *   four-frame map.
 * @returns A reader of actual model-metre target/bend, model rotation and
 *   optional unchanged-law near seed.
 */
export function prepareHumanLegSeededFit(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  pelvis: IAutoMovieQuaternion,
  hip: IAutoMovieVector3,
  readSwivel: (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ) => IAutoMovieMotionHumanLegChain.ISwivel,
): (
  target: IAutoMovieVector3,
  bend: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  near?: IAutoMovieSwivelNear,
) => ReturnType<typeof HumanLegChain.seeded> {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const restHip: IAutoMovieVector3 = body.rest.get(`${side}UpperLeg`)!;
  const hips: IAutoMoviePose = {
    skeleton: body.skeleton.id,
    root: {
      translation: Vector3.subtract(
        hip,
        Quaternion.rotateVector(pelvis, restHip),
      ),
      rotation: pelvis,
      scale: { x: 1, y: 1, z: 1 },
    },
    joints: [],
  };
  const requested: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([
      "hips",
      `${side}UpperLeg`,
      `${side}LowerLeg`,
      `${side}Foot`,
    ]);
  return (
    target: IAutoMovieVector3,
    bend: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
    near?: IAutoMovieSwivelNear,
  ): ReturnType<typeof HumanLegChain.seeded> => {
    const fitted: IAutoMovieSeededChainFit = applyHumanLimbFit(
      body,
      hips,
      side === "left" ? "leftLeg" : "rightLeg",
      { point: target, bend, rotation },
      [],
      undefined,
      near,
      resolution,
    );
    return {
      swivel: readSwivel(poseBones(body, fitted.pose, resolution(), requested)),
      seed: fitted.seed,
    };
  };
}
