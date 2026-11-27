import type {
  AutoMovieHumanoidBone,
  IAutoMovieFootLeg,
  IAutoMovieFootPlant,
  IAutoMovieKeyframe,
  IAutoMovieMotionSample,
  IAutoMoviePinStanceTargets,
  IAutoMoviePlantStanceFeet,
  IAutoMoviePlantedFeet,
  IAutoMovieResolvedBone,
  IAutoMovieSkeletonTopology,
  IAutoMovieVector3,
} from "@automovie/interface";

import { indexSkeletonTopology } from "../kinematics/indexSkeletonTopology";
import { preparePoseResolution } from "../kinematics/preparePoseResolution";
import type { prepareSkeletonPoseResolution } from "../kinematics/prepareSkeletonPoseResolution";
import { groundFunction } from "../space/internal/groundFunction";
import { assemblePlantedFeet } from "./assemblePlantedFeet";
import { HUMANOID_LEG_CHAINS } from "./constants/HUMANOID_LEG_CHAINS";
import { pinStanceTargets } from "./pinStanceTargets";
import { rekeyPlantedFeet } from "./rekeyPlantedFeet";
import { resolveBoneMap } from "./resolveBoneMap";
import { sampleMotion } from "./sampleMotion";
import { sampleStanceTimes } from "./internal/sampleStanceTimes";

const DEFAULT_GROUND_Y: number = 0;

const DEFAULT_TOLERANCE: number = 0.02;

/**
 * The humanoid legs, named from the shared chain table so the ground-IK pass
 * and the retarget contact pass cannot disagree about which bones a leg is.
 */
const DEFAULT_LEGS: readonly IAutoMovieFootLeg[] = HUMANOID_LEG_CHAINS.map(
  (chain: (typeof HUMANOID_LEG_CHAINS)[number]): IAutoMovieFootLeg => ({
    foot: chain.effector,
    upper: chain.upper,
    lower: chain.lower,
  }),
);

/**
 * Sample admitted motion on a fixed clock plus any authored support boundaries.
 * Detect finite model-frame stance contacts, pin each run and fit targeted leg
 * chains under the same clinical mappings and rig ROM. Unreachable or
 * constrained pins retain the best allowed pose and may leave residual contact
 * error. Opening plants resume authoritative targets during opening stance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States model frame, dense clock, shared clinical semantics, opening pin precedence, input failure and residual limitations instead of promising exact contact for arbitrary rig constraints.
 */
export function plantStanceFeet(
  props: plantStanceFeet.IProps,
): IAutoMoviePlantedFeet {
  const groundAt: (x: number, z: number) => number = groundFunction(
    props.groundY ?? DEFAULT_GROUND_Y,
  );
  const tolerance: number = props.tolerance ?? DEFAULT_TOLERANCE;
  const legs: readonly IAutoMovieFootLeg[] = props.legs ?? DEFAULT_LEGS;
  if (tolerance < 0)
    throw new Error("contact tolerance must be finite and non-negative");

  if (props.sampleRate !== undefined && props.sampleRate <= 0)
    throw new Error(
      `sampleRate must be a finite number > 0, but was ${props.sampleRate}`,
    );

  const topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(
    props.skeleton,
  );
  const resolution: ReturnType<typeof preparePoseResolution> =
    preparePoseResolution();
  const demand: prepareSkeletonPoseResolution.IBoneDemand | undefined =
    props.poseResolution?.prepareBones(
      new Set(
        legs.map((leg: IAutoMovieFootLeg): AutoMovieHumanoidBone => leg.foot),
      ),
    );
  const support: typeof props.support = props.support;
  const times: number[] = sampleStanceTimes(
    props.motion.duration,
    props.sampleRate,
    support?.boundaries,
  );
  const poses: IAutoMovieMotionSample[] = times.map(
    (time: number): IAutoMovieMotionSample => sampleMotion(props.motion, time),
  );
  if (support !== undefined)
    poses.forEach((sampled: IAutoMovieMotionSample, i: number): void => {
      support.at(
        times[i]!,
        sampled.pose.root?.translation ?? { x: 0, y: 0, z: 0 },
        "root",
      );
    });
  const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>[] =
    poses.map(
      (
        sampled: IAutoMovieMotionSample,
      ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
        if (demand === undefined)
          return resolveBoneMap(
            props.skeleton,
            sampled.pose,
            topology,
            props.jointAxes,
            props.restFrames,
            resolution,
          );
        return demand.map(sampled.pose, resolution);
      },
    );

  // A stance run per leg pinned to its start contact; per-frame solve targets.
  const { plants, targets }: IAutoMoviePinStanceTargets.IResult =
    pinStanceTargets({
      legs,
      resolved,
      times,
      groundAt,
      support,
      tolerance,
      openingTargets: new Map(
        (props.openingPlants ?? []).map(
          (
            plant: Pick<IAutoMovieFootPlant, "foot" | "position">,
          ): [AutoMovieHumanoidBone, IAutoMovieVector3] => [
            plant.foot,
            plant.position,
          ],
        ),
      ),
    });

  const keyframes: IAutoMovieKeyframe[] = rekeyPlantedFeet({
    skeleton: props.skeleton,
    topology,
    times,
    poses,
    legs,
    targets,
    jointAxes: props.jointAxes,
    restFrames: props.restFrames,
    resolution,
    poseResolution: props.poseResolution,
  });

  return assemblePlantedFeet(props.motion, keyframes, plants);
}

/** Companion types of {@link plantStanceFeet}. */
export namespace plantStanceFeet {
  /** The planting props with an optional prepared rig. */
  export interface IProps extends IAutoMoviePlantStanceFeet.IProps {
    /**
     * Explicit immutable snapshot of this exact rig and clinical tables;
     * omitted keeps full raw FK admission.
     */
    poseResolution?: prepareSkeletonPoseResolution.IRig;
  }
}
