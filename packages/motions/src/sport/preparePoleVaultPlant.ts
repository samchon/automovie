import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { GymnasticsFlight } from "./GymnasticsFlight";

/**
 * Fit the pole end to the floor with the vault's original wrist-height
 * secant corrections. Every actual trial keeps its full source solve,
 * original frozen-view re-admission and actual grip observation.
 *
 * @param props The unchanged body/model, held hand, pole-end offset in its grip frame, initial wrist height, original correction count and synchronous raw writer of each tried height. The writer must not retain either borrowed workspace.
 * @returns The final frozen posture, actual pole tip/grip points and world COM, all in world metres except the posture's clinical degrees. No workspace or canonical trial pose escapes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States original secant scope, initial height/count, grip-frame end offset, synchronous writer loans, actual output provenance and units.
 * @evidence contracts/development/implementation.md#principled-implementation The actual solved pole-end height is the residual; the first or near-flat step uses slope one and later steps use the original difference quotient. Each correction changes only the original wrist-height demand before the full source solves again.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One real trial owner supplies original frozen raw joints, their actual canonical re-admission and requested grip FK; the unchanged secant loop then leaves its last trial for the same tip/grip and COM readers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the passed correction count, 1e-3 metre termination, 1e-9 slope guard, original fallback slope/order and every complete limb/digit/rotation solve. Achieved points never replace asked targets; only the original wrist-height scalar is corrected.
 * @evidence contracts/development/implementation.md#efficient-algorithms P corrections retain up to P+1 actual full source solves and frozen re-admissions. One scoped exact FK reader/genuine projector and fixed grip demand share prerequisites; final COM observes that same final canonical trial without another identical frozen re-admission. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The unchanged body and actual per-height raw writer establish one synchronous operation. Only exact FK dependencies, static ROM metadata and the final trial's actual canonical pose share work; no trial, target, residual, time or acceptance answer is cached across requests.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Operation getter/projector, fixed grip demand, bounded current/previous scalars and actual trial pose/maps release on return/throw. Only final raw posture and fresh numeric vectors escape; no reader, projection loan, history or external handle enters the retained law.
 */
export function preparePoleVaultPlant(props: {
  body: IHumanBody;
  model: GymnasticsFlight.Model;
  side: HumanHand.Side;
  end: IAutoMovieVector3;
  height: number;
  passes: number;
  posture: (
    height: number,
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
    projection: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IHumanPosture;
}): {
  posture: IHumanPosture;
  tip: IAutoMovieVector3;
  grip: IAutoMovieVector3;
  centre: IAutoMovieVector3;
} {
  const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
  const projection: ReturnType<typeof prepareHumanPostureProjection> = prepareHumanPostureProjection(props.body);
  const readGrip: ReturnType<typeof poseBones.prepare> = poseBones.prepare(props.body, HumanHand.frameBones(props.body, props.side, "grip"));
  const trial: (height: number) => ITrial = (height: number): ITrial => {
    const source: ReturnType<typeof GymnasticsFlight.freeze> = GymnasticsFlight.freeze(
      props.body, props.posture(height, read, projection), read, projection,
    );
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(
      props.body, source.posture, undefined, undefined, read, undefined, projection,
    ).pose;
    return { posture: source.posture, pose, bones: readGrip(pose, read()) };
  };
  const endOf: (bones: ITrial["bones"]) => IAutoMovieVector3 = (bones: ITrial["bones"]): IAutoMovieVector3 => Vector3.add(
    HumanHand.frame(props.body, bones, props.side, "grip").point,
    Quaternion.rotateVector(bones.get(`${props.side}Hand`)!.worldRotation, props.end),
  );
  let height: number = props.height;
  let shown: ITrial = trial(height);
  let last: { y: number; miss: number } | undefined;
  for (let pass: number = 0; pass < props.passes; pass++) {
    const miss: number = endOf(shown.bones).y;
    if (Math.abs(miss) <= 1e-3) break;
    const slope: number = last === undefined || Math.abs(miss - last.miss) < 1e-9
      ? 1 : (miss - last.miss) / (height - last.y);
    last = { y: height, miss };
    height = height - miss / slope;
    shown = trial(height);
  }
  const requested: Set<AutoMovieHumanoidBone> = new Set();
  for (const segment of props.model.segments) requested.add(segment.bone);
  const bones: ReturnType<typeof poseBones> = poseBones(props.body, shown.pose, read(), requested);
  return {
    posture: shown.posture,
    tip: endOf(shown.bones),
    grip: HumanHand.frame(props.body, shown.bones, props.side, "grip").point,
    centre: resolveAutoMovieCenterOfMass.place(props.model, bones),
  };
}

/** One actual frozen raw view, its independently admitted canonical pose and fresh grip frames. */
interface ITrial {
  /** The original limb-goal-free clinical view. */
  posture: IHumanPosture;
  /** Actual canonical re-admission of that view, preserving the original plant pipeline. */
  pose: IAutoMoviePose;
  /** Only actual grip/hand frames; canonical ancestry is handled by the body producer. */
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
}
