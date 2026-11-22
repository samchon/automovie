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
import { groundFunction } from "../space/groundFunction";
import { assemblePlantedFeet } from "./assemblePlantedFeet";
import { HUMANOID_LEG_CHAINS } from "./constants/HUMANOID_LEG_CHAINS";
import { pinStanceTargets } from "./pinStanceTargets";
import { rekeyPlantedFeet } from "./rekeyPlantedFeet";
import { resolveBoneMap } from "./resolveBoneMap";
import { sampleMotion } from "./sampleMotion";
import { sampleStanceTimes } from "./sampleStanceTimes";

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
 * Sample admitted motion on a fixed clock plus any authored support boundaries. Detect finite model-frame stance contacts, pin each run and fit targeted leg chains under the same clinical mappings and rig ROM. Unreachable or constrained pins retain the best allowed pose and may leave residual contact error. Opening plants resume authoritative targets during opening stance.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Shares one unchanged skeleton topology across detection and re-keying, uses inclusive ground+tolerance contact, then scores ROM-clamped chain FK through fitChainToTarget. The sampling clock includes clip endpoints and every admitted support boundary.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The coordinator separates dense sampling, run pinning, chain correction and result assembly through existing single-purpose helpers, all using identical topology and clinical axes/rest frames.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid sample rate, scalar ground or tolerance and nonfinite sampled/carried targets throw; absent/degenerate/unimprovable chains keep articulation rather than inventing contact success. Default legs and zero ground are explicit API defaults.
 * @evidence contracts/development/common.md#meaningful-documentation States model frame, dense clock, shared clinical semantics, opening pin precedence, input failure and residual limitations instead of promising exact contact for arbitrary rig constraints.
 * @evidence contracts/development/implementation.md#efficient-algorithms F samples require interpolation and ordered joint admission. Raw omission retains full B-bone FK with pure exact-angle factor reuse; an explicit immutable rig computes L feet's ancestry and writes fresh maps directly without F intermediate frame arrays, storing O(FL) FK outputs. Stance work stays O(FL) and actual pins keep bounded IK. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Completed poses/maps feed detection. One exact operation reader and topology serve detection/correction; a genuine immutable rig must match this skeleton/clinical tables and supplies target-chain preparation. Raw omission preserves full live admission. Each changed parent pose and target still receives its actual solve.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned frames/plants belong to the caller. Sample/FK/target arrays are call-local; raw factor workspaces and optional immutable-rig current dependency rows release with the synchronous reader on return or throw. A supplied immutable rig remains caller-owned, without continuing tasks or handles.
 */
export const plantStanceFeet: (
  props: plantStanceFeet.IProps,
) => IAutoMoviePlantedFeet = (
  props: plantStanceFeet.IProps,
): IAutoMoviePlantedFeet => {
  const groundAt: (x: number, z: number) => number = groundFunction(
    props.groundY ?? DEFAULT_GROUND_Y,
  );
  const tolerance: number = props.tolerance ?? DEFAULT_TOLERANCE;
  const legs: readonly IAutoMovieFootLeg[] = props.legs ?? DEFAULT_LEGS;
  if (!Number.isFinite(tolerance) || tolerance < 0)
    throw new Error("contact tolerance must be finite and non-negative");
  if (typeof props.groundY === "number" && !Number.isFinite(props.groundY))
    throw new Error("source ground height must be finite");
  if (
    props.sampleRate !== undefined &&
    (!Number.isFinite(props.sampleRate) || props.sampleRate <= 0)
  )
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
};

/**
 * Companion types of {@link plantStanceFeet}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the one engine-owned extension of the interface planting props and its absence rule.
 * @evidence contracts/development/design.md#principled-representation The canonical planting props stay in `IAutoMoviePlantStanceFeet.IProps`; this extension adds only the prepared rig, an engine object whose methods read `preparePoseResolution` operations, so it cannot live in the dependency-free interface.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `plantPerformShotStanceFeet` passes the prepared rig so detection and re-keying share one demanded-bone reader; every other caller keeps the interface props unchanged.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Extends the interface contract instead of copying it; the optional rig is the genuine `prepareSkeletonPoseResolution` product, never a structural stand-in.
 */
export namespace plantStanceFeet {
  /**
   * The planting props with an optional prepared rig.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The added member states what it is and what its absence keeps.
   * @evidence contracts/development/design.md#principled-representation The interface props plus one optional engine product; nothing of the interface record is repeated.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One optional member, passed by `plantPerformShotStanceFeet`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Extends the interface record instead of copying it; the rig is the genuine prepared product, not a flag.
   */
  export interface IProps extends IAutoMoviePlantStanceFeet.IProps {
    /** Explicit immutable snapshot of this exact rig and clinical tables; omitted keeps full raw FK admission. */
    poseResolution?: prepareSkeletonPoseResolution.IRig;
  }
}
