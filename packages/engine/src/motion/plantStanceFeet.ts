import { AutoMovieHumanoidBone, IAutoMovieMotion, IAutoMovieSkeleton } from "@automovie/interface";
import { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { groundFunction } from "../space/ground";
import { pinStanceTargets } from "./pinStanceTargets";
import { assemblePlantedFeet } from "./assemblePlantedFeet";
import { rekeyPlantedFeet } from "./rekeyPlantedFeet";
import { resolveBoneMap } from "./resolveBoneMap";
import { sampleTimes } from "./sampleTimes";
import { sampleMotion } from "./sampleMotion";
import { IAutoMovieFootLeg } from "./IAutoMovieFootLeg";
import { IAutoMovieFootPlant } from "./IAutoMovieFootPlant";
import { IAutoMoviePlantedFeet } from "./IAutoMoviePlantedFeet";

/**
 * The deterministic ground-IK pass: plant each leg's stance foot so a baked
 * gait no longer skates or sinks. It samples the motion on a fixed clock,
 * detects each foot's **stance runs** (frames where the foot is at or below the
 * ground plane, mirroring {@link validateGroundContact}'s `y <= groundY +
 * tolerance`), pins the foot's world XZ to its stance-start contact, with `y`
 * snapped to the ground plane, across the whole run, and re-solves the leg
 * (thigh/shin via {@link solveTwoBoneIK}, ankle toward the pinned target) so the
 * foot holds still while the hip travels over it. The correction is lowered
 * into the leg's bone-local clinical angles the way {@link reachPose} lowers an
 * arm, rooted at the **current posed hip** (not rest) so it composes on top of
 * the gait's root travel and torso motion. An unreachable pin extends the leg
 * fully toward it (foot stops on the reachable shell) rather than producing
 * NaN.
 *
 * The corrected clip is re-keyed densely at the pass sample rate; sampled at
 * those times a stance foot's world XZ is constant, so it passes
 * {@link validateFootSkate} and {@link validateGroundContact} where the raw gait
 * failed. Swing frames and non-leg joints are carried through unchanged.
 * Imported or non-canonical rigs pass the same `jointAxes` and `restFrames`
 * used for playback: stance detection, IK decomposition, ROM clamping, and
 * residual FK then share one clinical contract.
 *
 * Ground is a scalar plane or a `(x, z) → y` source. Plug a space in via
 * {@link spaceGround} (#605). Path/turning locomotion is #599; the shared
 * two-bone lowering could be factored out of {@link reachPose} (follow-up).
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Detects stance against the declared ground and tolerance, then pins each run to its contact target.
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-refusal Bounds an unreachable stance correction at the limb's reachable shell instead of emitting non-finite motion.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Resolves planted support into ROM-bounded dense motion and an explicit contact record.
 * @author Samchon
 */
export const plantStanceFeet = (props: {
  /** Rig for forward kinematics. */
  skeleton: IAutoMovieSkeleton;
  /** The humanoid gait/motion to correct. */
  motion: IAutoMovieMotion;
  /** Ground height: plane scalar or `(x, z) → y` source. Defaults to `0`. */
  groundY?: number | ((x: number, z: number) => number);
  /** Contact tolerance above the plane counted as stance. Defaults to `0.02`. */
  tolerance?: number;
  /** Legs to plant. Defaults to both humanoid legs. */
  legs?: readonly IAutoMovieFootLeg[];
  /** Optional clinical-axis remap used consistently by detection and IK. */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  /** Optional clinical rest frames used consistently by detection and IK. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
  /** Samples/second for detection and re-keying. Defaults to `24`. */
  sampleRate?: number;
  /**
   * Prior beat plants expressed in this motion's model frame.
   *
   * When a detected stance begins at the opening sample, its first pin resumes
   * this authoritative position instead of deriving a nearby replacement.
   */
  openingPlants?: ReadonlyArray<Pick<IAutoMovieFootPlant, "foot" | "position">>;
}): IAutoMoviePlantedFeet => {
  const groundAt = groundFunction(props.groundY ?? DEFAULT_GROUND_Y);
  const tolerance = props.tolerance ?? DEFAULT_TOLERANCE;
  const legs = props.legs ?? DEFAULT_LEGS;
  const sampleRate = props.sampleRate ?? DEFAULT_SAMPLE_RATE;
  if (!Number.isFinite(sampleRate) || sampleRate <= 0)
    throw new Error(
      `sampleRate must be a finite number > 0, but was ${sampleRate}`,
    );

  const times = sampleTimes(props.motion.duration, sampleRate);
  const poses = times.map((time) => sampleMotion(props.motion, time));
  const resolved = poses.map((sampled) =>
    resolveBoneMap(
      props.skeleton,
      sampled.pose,
      undefined,
      props.jointAxes,
      props.restFrames,
    ),
  );

  // A stance run per leg pinned to its start contact; per-frame solve targets.
  const { plants, targets } = pinStanceTargets({
    legs,
    resolved,
    times,
    groundAt,
    tolerance,
    openingTargets: new Map(
      (props.openingPlants ?? []).map((plant) => [plant.foot, plant.position]),
    ),
  });

  const keyframes = rekeyPlantedFeet({
    skeleton: props.skeleton,
    times,
    poses,
    legs,
    targets,
    jointAxes: props.jointAxes,
    restFrames: props.restFrames,
  });

  return assemblePlantedFeet(props.motion, keyframes, plants);
};

const DEFAULT_SAMPLE_RATE = 24;

const DEFAULT_GROUND_Y = 0;

const DEFAULT_TOLERANCE = 0.02;
