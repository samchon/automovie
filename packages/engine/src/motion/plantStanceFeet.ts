import { type IAutoMovieFootLeg, type IAutoMovieFootPlant, type IAutoMoviePlantedFeet, type IAutoMovieSkeletonTopology, type IAutoMovieMotionSample, type IAutoMoviePinStanceTargets, type IAutoMoviePlantStanceFeet, type IAutoMovieResolvedBone, AutoMovieHumanoidBone, IAutoMovieKeyframe, IAutoMovieVector3 } from "@automovie/interface";


import { indexSkeletonTopology } from "../kinematics/indexSkeletonTopology";
import { groundFunction } from "../space/groundFunction";
import { assemblePlantedFeet } from "./assemblePlantedFeet";
import { HUMANOID_LEG_CHAINS } from "./constants/HUMANOID_LEG_CHAINS";
import { pinStanceTargets } from "./pinStanceTargets";
import { rekeyPlantedFeet } from "./rekeyPlantedFeet";
import { resolveBoneMap } from "./resolveBoneMap";
import { sampleMotion } from "./sampleMotion";
import { sampleTimes } from "./sampleTimes";

const DEFAULT_SAMPLE_RATE: number = 24;

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
 * Sample admitted motion on a fixed clock, detect finite model-frame stance contacts, pin each run and fit targeted leg chains under the same clinical mappings and rig ROM. Unreachable/constrained pins retain the best allowed pose and may leave residual; the result does not guarantee exact no-skate contact. Opening plants resume authoritative targets only for opening stance.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Shares one unchanged skeleton topology across detection and re-keying, uses inclusive ground+tolerance masks and maximal-run pins, then scores ROM-clamped chain FK through fitChainToTarget. Sample times include clip endpoints; ground/tolerance inputs are finite and tolerance nonnegative.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The coordinator separates dense sampling, run pinning, chain correction and result assembly through existing single-purpose helpers, all using identical topology and clinical axes/rest frames.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid sample rate, scalar ground or tolerance and nonfinite sampled/carried targets throw; absent/degenerate/unimprovable chains keep articulation rather than inventing contact success. Default legs and zero ground are explicit API defaults.
 * @evidence contracts/development/common.md#meaningful-documentation States model frame, dense clock, shared clinical semantics, opening pin precedence, input failure and residual limitations instead of promising exact contact for arbitrary rig constraints.
 * @evidence contracts/development/implementation.md#efficient-algorithms F samples require motion interpolation and O(FB) FK for B bones, then O(FL) stance work and bounded solves for pinned legs L; topology is built once and reused across all detection/correction frames.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Completed sampled poses/FK maps feed run detection directly; one topology and each run's fixed target are reused while changing parent poses still need per-frame chain preparation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned dense frames and plants belong to the caller; sample/FK/target arrays are call-local, bounded by frame/leg/bone populations, and no renderer/native handles or continuing tasks are retained.
 */
export const plantStanceFeet: (props: IAutoMoviePlantStanceFeet.IProps) => IAutoMoviePlantedFeet = (props: IAutoMoviePlantStanceFeet.IProps): IAutoMoviePlantedFeet => {
  const groundAt: ((x: number, z: number) => number) = groundFunction(
    props.groundY ?? DEFAULT_GROUND_Y,
  );
  const tolerance: number = props.tolerance ?? DEFAULT_TOLERANCE;
  const legs: readonly IAutoMovieFootLeg[] = props.legs ?? DEFAULT_LEGS;
  const sampleRate: number = props.sampleRate ?? DEFAULT_SAMPLE_RATE;
  if (!Number.isFinite(tolerance) || tolerance < 0)
    throw new Error("contact tolerance must be finite and non-negative");
  if (typeof props.groundY === "number" && !Number.isFinite(props.groundY))
    throw new Error("source ground height must be finite");
  if (!Number.isFinite(sampleRate) || sampleRate <= 0)
    throw new Error(
      `sampleRate must be a finite number > 0, but was ${sampleRate}`,
    );

  const topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(
    props.skeleton,
  );
  const times: number[] = sampleTimes(props.motion.duration, sampleRate);
  const poses: IAutoMovieMotionSample[] = times.map(
    (time: number): IAutoMovieMotionSample =>
      sampleMotion(props.motion, time),
  );
  const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>[] = poses.map(
    (
      sampled: IAutoMovieMotionSample,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      resolveBoneMap(
        props.skeleton,
        sampled.pose,
        topology,
        props.jointAxes,
        props.restFrames,
      ),
  );

  // A stance run per leg pinned to its start contact; per-frame solve targets.
  const { plants, targets }: IAutoMoviePinStanceTargets.IResult =
    pinStanceTargets({
      legs,
      resolved,
      times,
      groundAt,
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
  });

  return assemblePlantedFeet(props.motion, keyframes, plants);
};
