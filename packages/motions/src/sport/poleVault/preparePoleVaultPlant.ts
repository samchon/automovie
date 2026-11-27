import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMoviePose, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { GymnasticsFlight } from "../internal/GymnasticsFlight";

/*
 * Fit the pole end to the floor with the vault's original wrist-height secant
 * corrections. Every actual trial keeps its full source solve, original
 * frozen-view re-admission and actual grip observation.
 * Parameter props: The unchanged body/model, held hand, pole-end offset in its grip
 * frame, initial wrist height, original correction count and synchronous raw
 * writer of each tried height. The writer must not retain either borrowed
 * workspace.
 * Returns: The final frozen posture, actual pole tip/grip points and world COM,
 * all in world metres except the posture's clinical degrees. No workspace or
 * canonical trial pose escapes.
 */
export function preparePoleVaultPlant(
  props: IPreparePoleVaultPlantProps,
): IPreparePoleVaultPlantResult {
  const read: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const projection: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(props.body);
  const readGrip: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    props.body,
    HumanHand.frameBones(props.body, props.side, "grip"),
  );
  const trial: (height: number) => ITrial = (height: number): ITrial => {
    const posture: IAutoMovieMotionHumanPosture = GymnasticsFlight.frozen(
      props.body,
      props.posture(height, read, projection),
      read,
      projection,
    );
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(
      props.body,
      posture,
      undefined,
      undefined,
      read,
      undefined,
      projection,
    ).pose;
    return { posture, pose, bones: readGrip(pose, read()) };
  };
  const endOf: (bones: ITrial["bones"]) => IAutoMovieVector3 = (
    bones: ITrial["bones"],
  ): IAutoMovieVector3 =>
    Vector3.add(
      HumanHand.frame(props.body, bones, props.side, "grip").point,
      Quaternion.rotateVector(
        bones.get(`${props.side}Hand`)!.worldRotation,
        props.end,
      ),
    );
  let height: number = props.height;
  let shown: ITrial = trial(height);
  let last: IPreparePoleVaultPlantLast | undefined;
  for (let pass: number = 0; pass < props.passes; pass++) {
    const miss: number = endOf(shown.bones).y;
    if (Math.abs(miss) <= 1e-3) break;
    const slope: number =
      last === undefined || Math.abs(miss - last.miss) < 1e-9
        ? 1
        : (miss - last.miss) / (height - last.y);
    last = { y: height, miss };
    height = height - miss / slope;
    shown = trial(height);
  }
  const requested: Set<AutoMovieHumanoidBone> = new Set();
  for (const segment of props.model.segments) requested.add(segment.bone);
  const bones: ReturnType<typeof poseBones> = poseBones(
    props.body,
    shown.pose,
    read(),
    requested,
  );
  return {
    posture: shown.posture,
    tip: endOf(shown.bones),
    grip: HumanHand.frame(props.body, shown.bones, props.side, "grip").point,
    centre: AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(props.model, bones),
  };
}

/*
 * The record of `IPreparePoleVaultPlantLast`'s site.
 */
type IPreparePoleVaultPlantLast = { y: number; miss: number };

/*
 * The record of `IPreparePoleVaultPlantResult`'s site.
 */
type IPreparePoleVaultPlantResult = {
  posture: IAutoMovieMotionHumanPosture;
  tip: IAutoMovieVector3;
  grip: IAutoMovieVector3;
  centre: IAutoMovieVector3;
};

/*
 * The record of `IPreparePoleVaultPlantProps`'s site.
 */
type IPreparePoleVaultPlantProps = {
  body: IAutoMovieMotionHumanBody;
  model: IAutoMovieResolveCenterOfMass.IModel;
  side: AutoMovieHumanSide;
  end: IAutoMovieVector3;
  height: number;
  passes: number;
  posture: (
    height: number,
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
    projection: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IAutoMovieMotionHumanPosture;
};

/*
 * One actual frozen raw view, its independently admitted canonical pose and
 * fresh grip frames.
 */
interface ITrial {
  /*
   * The original limb-goal-free clinical view.
   */
  posture: IAutoMovieMotionHumanPosture;
  /*
   * Actual canonical re-admission of that view, preserving the original plant
   * pipeline.
   */
  pose: IAutoMoviePose;
  /*
   * Only actual grip/hand frames; canonical ancestry is handled by the body
   * producer.
   */
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
}
