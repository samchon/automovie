import {
  type IAutoMovieResolvedBone,
  type IAutoMovieSeededChainFit,
  type IAutoMovieSwivelNear,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanLegChain } from "./HumanLegChain";
import { HumanLimbFit } from "./HumanLimbFit";
import { poseBones } from "./poseBones";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

/**
 * Prepare only a fixed leg source pose and exact FK workspace while each
 * target/bend/rotation/near request still invokes the original remembered
 * limb fit. The body, pelvis rotation and hip point remain unchanged for
 * this synchronous piece; no fitted result or target is stored here.
 *
 * @param body The unchanged canonical body.
 * @param side The fixed leg.
 * @param pelvis Fixed model-frame pelvis rotation.
 * @param hip Fixed model-metre hip point.
 * @param readSwivel The existing leg reader applied to each actual fitted four-frame map.
 * @returns A reader of actual model-metre target/bend, model rotation and optional unchanged-law near seed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed body/root scope, changing goal/near meanings, actual fit/read delegation and no-answer-retention lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation One fixed pelvis/hip determines the same hips-only root by hip minus rotated rest-hip offset. Each query still calls HumanLimbFit.remembered with its actual point/bend/rotation/near, preserving that owner's mirror, floor/grid, LRU and disabled-memory behavior.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This producer owns fixed source/root construction and one operation reader; HumanLimbFit owns every solve/memory query and the supplied existing leg reader owns branch/swivel extraction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No request is replaced by achieved coordinates or a previous seed, no fit/memory policy changes, and no target or callback result is cached by this preparation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed root construction and lazy reader creation occur once for a piece's repeated probes. Each query retains its full actual fit/memory query, ordered FK admission and only the hips/thigh/shank/foot ancestor read; exact unchanged reader dependencies can share completed math. Runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Explicit unchanged body/pelvis/hip prove source equivalence. The bounded operation reader checks every current pose dependency across actual varying fitted outputs; goal and near inputs remain live per query, and no result crosses another preparation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned closure owns one hips-only pose, fixed four-name demand and lazy bounded FK state plus borrowed body/reader callback until the piece releases it. Each actual result/temporary map ends with its query; only swivel/seed data escape, with no target history or handles.
 */
export function prepareHumanLegSeededFit(
  body: IHumanBody,
  side: "left" | "right",
  pelvis: IAutoMovieQuaternion,
  hip: IAutoMovieVector3,
  readSwivel: (bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>) => HumanLegChain.ISwivel,
): (
  target: IAutoMovieVector3,
  bend: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  near?: IAutoMovieSwivelNear,
) => ReturnType<typeof HumanLegChain.seeded> {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
  const restHip: IAutoMovieVector3 = body.rest.get(`${side}UpperLeg`)!;
  const hips: IAutoMoviePose = {
    skeleton: body.skeleton.id,
    root: {
      translation: Vector3.subtract(hip, Quaternion.rotateVector(pelvis, restHip)),
      rotation: pelvis,
      scale: { x: 1, y: 1, z: 1 },
    },
    joints: [],
  };
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
    "hips", `${side}UpperLeg`, `${side}LowerLeg`, `${side}Foot`,
  ]);
  return (
    target: IAutoMovieVector3,
    bend: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
    near?: IAutoMovieSwivelNear,
  ): ReturnType<typeof HumanLegChain.seeded> => {
    const fitted: IAutoMovieSeededChainFit = HumanLimbFit.remembered(
      body, hips, side === "left" ? "leftLeg" : "rightLeg",
      { point: target, bend, rotation }, [], undefined, near, resolution,
    );
    return {
      swivel: readSwivel(poseBones(body, fitted.pose, resolution(), requested)),
      seed: fitted.seed,
    };
  };
}
