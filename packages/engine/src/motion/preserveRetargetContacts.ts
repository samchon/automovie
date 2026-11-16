import {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { indexSkeletonTopology } from "../kinematics/indexSkeletonTopology";
import { reachableBoneNames } from "../kinematics/reachableBoneNames";
import { preparePoseResolution } from "../kinematics/preparePoseResolution";
import { prepareSkeletonPoseResolution } from "../kinematics/prepareSkeletonPoseResolution";
import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { groundFunction } from "../space/groundFunction";
import { ViolationCollector } from "../validation/ViolationCollector";
import { IAutoMoviePlantChain } from "./IAutoMoviePlantChain";
import { IAutoMovieRetargetContactProps } from "./IAutoMovieRetargetContactProps";
import { IAutoMovieRetargetHandContact } from "./IAutoMovieRetargetHandContact";
import { HUMANOID_LEG_CHAINS } from "./constants/HUMANOID_LEG_CHAINS";
import { contactMask } from "./contactMask";
import { fitSeededChainToTarget } from "./fitSeededChainToTarget";
import { resolveBoneMap } from "./resolveBoneMap";

/** Contact tolerance above the source ground counted as a planted contact. */
const DEFAULT_TOLERANCE: number = 0.02;

/**
 * Target model-unit drift at or below this absolute threshold skips another fit. Binary64 scaling and FK need not commute exactly, so this is a numerical no-op policy rather than a zero-residual or scale-relative error proof.
 */
const NOOP_EPSILON: number = 1e-9;

/** A chain plus the frames on which its contact must be preserved. */
interface IAutoMovieContactWindow {
  chain: IAutoMoviePlantChain;

  /** `null` detects stance against the ground; a span declares it. */
  window: { start: number; end: number } | null;
}

/**
 * Correct a root-scaled retarget clip at its existing authored key times using each source frame's foot/declared hand contact mapped by rootScale. Source slides persist; ROM-limited residuals above tolerance*rootScale are collector warnings, while dynamic nonfinite ground or callback exceptions throw. Inputs have passed retarget admission and parallel source/target key times agree.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Finds chains root-reachable on both rigs, FK-resolves source frames under source clinical tables, classifies foot stance or inclusive hand windows, and fits target chains to per-frame scaled source points under target ROM. Drift at or below absolute 1e-9 target model units skips another fit; prior corrected pose breaks equal-residual bend ties.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns source-contact mapping and worst-per-effector residual reporting; contactMask and fitSeededChainToTarget own classification and unchanged candidate choice. One immutable FK producer and operation reader per admitted side serve all frames and chain preparations.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unresolved chains are skipped whole, proportional already-on-pin frames keep authored articulation, and impossible residual remains warning data rather than fabricated success or a hidden target offset.
 * @evidence contracts/development/common.md#meaningful-documentation States authored-key correction, per-frame source slide preservation, rootScale mapping, warning budget, parallel-clock/admission premises and dynamic ground failure boundary.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each rig snapshots O(B) static prerequisites once. F source frames retain ordered O(J) joint admission and compute H effectors' ancestry, retaining O(FH) outputs instead of O(FB). Target reads request pinned effectors; actual corrections keep bounded solving while sharing static FK and exact changed dependencies. Runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The retarget gate admits fixed rigs/mappings before this stage. Immutable producers and per-side readers share static tables and exact local/ancestor/root work across distinct source, zeroed, reference and corrected poses. Source effector maps serve every contact chain; target FK refreshes only after accepted correction.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Source maps/pins scale with F and admitted contacts; exact dependency rows remain O(J+B) per side. Operation readers/producers release on return or throw. The returned clip owns new keyframes, unchanged records may be shared, and no task or handle persists.
 */
export const preserveRetargetContacts: (props: {
  /** Rig the clip was authored on. */ source: IAutoMovieSkeleton;
  /** Rig the clip now plays on. */ target: IAutoMovieSkeleton;
  /** The authored clip, read for source-space contact detection. */ sourceMotion: IAutoMovieMotion;
  /** The root-scaled clip this pass corrects. */ retargeted: IAutoMovieMotion;
  /** Root translation multiplier the contacts are mapped through. */ rootScale: number;
  /** Lowest world Y of the source rest pose; the default ground plane. */ sourceFloor: number;
  /** Source clinical axes. */ sourceJointAxes: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>
  >;
  /** Source clinical rest frames. */ sourceRestFrames: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  >;
  /** Target clinical axes. */ targetJointAxes: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>
  >;
  /** Target clinical rest frames. */ targetRestFrames: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  >;
  /** Caller policy; omitted means humanoid legs and no hand contact. */ contacts:
    | IAutoMovieRetargetContactProps
    | undefined;
  /** Sink the residual-slide warnings are reported on. */ collector: ViolationCollector;
}) => IAutoMovieMotion = (props: {
  /** Rig the clip was authored on. */
  source: IAutoMovieSkeleton;

  /** Rig the clip now plays on. */
  target: IAutoMovieSkeleton;

  /** The authored clip, read for source-space contact detection. */
  sourceMotion: IAutoMovieMotion;

  /** The root-scaled clip this pass corrects. */
  retargeted: IAutoMovieMotion;

  /** Root translation multiplier the contacts are mapped through. */
  rootScale: number;

  /** Lowest world Y of the source rest pose; the default ground plane. */
  sourceFloor: number;

  /** Source clinical axes. */
  sourceJointAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Source clinical rest frames. */
  sourceRestFrames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

  /** Target clinical axes. */
  targetJointAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Target clinical rest frames. */
  targetRestFrames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

  /** Caller policy; omitted means humanoid legs and no hand contact. */
  contacts: IAutoMovieRetargetContactProps | undefined;

  /** Sink the residual-slide warnings are reported on. */
  collector: ViolationCollector;
}): IAutoMovieMotion => {
  const contacts: IAutoMovieRetargetContactProps = props.contacts ?? {};
  const groundAt: ReturnType<typeof groundFunction> = groundFunction(
    contacts.groundY ?? props.sourceFloor,
  );
  const tolerance: number = contacts.tolerance ?? DEFAULT_TOLERANCE;

  const sourceTopology: ReturnType<typeof indexSkeletonTopology> =
    indexSkeletonTopology(props.source);
  const targetTopology: ReturnType<typeof indexSkeletonTopology> =
    indexSkeletonTopology(props.target);
  const sourceBones: ReadonlySet<AutoMovieHumanoidBone> = reachableBoneNames(
    props.source,
    sourceTopology,
  );
  const targetBones: ReadonlySet<AutoMovieHumanoidBone> = reachableBoneNames(
    props.target,
    targetTopology,
  );

  // Only a chain both rigs actually resolve can carry a contact; a rig missing
  // an arm (or a hand contact declared against bones it does not have) is
  // skipped rather than half-solved.
  const windows: IAutoMovieContactWindow[] = [
    ...HUMANOID_LEG_CHAINS.map(
      (chain: IAutoMoviePlantChain): IAutoMovieContactWindow => ({
        chain,
        window: null,
      }),
    ),
    ...(contacts.hands ?? []).map(
      (hand: IAutoMovieRetargetHandContact): IAutoMovieContactWindow => ({
        chain: {
          effector: hand.hand,
          upper: hand.upper,
          lower: hand.lower,
        },
        window: { start: hand.start, end: hand.end },
      }),
    ),
  ].filter(({ chain }: IAutoMovieContactWindow): boolean =>
    [sourceBones, targetBones].every(
      (bones: ReadonlySet<AutoMovieHumanoidBone>): boolean =>
        resolvable(chain, bones),
    ),
  );
  if (windows.length === 0) return props.retargeted;

  // The retarget gate has admitted these unchanged rigs and clinical tables.
  // Source contacts and target correction each own only their last FK rows.
  const sourceRig: prepareSkeletonPoseResolution.IRig = prepareSkeletonPoseResolution(
    props.source, props.sourceJointAxes, props.sourceRestFrames, sourceTopology,
  );
  const targetRig: prepareSkeletonPoseResolution.IRig = prepareSkeletonPoseResolution(
    props.target, props.targetJointAxes, props.targetRestFrames, targetTopology,
  );
  const sourceResolution: ReturnType<typeof preparePoseResolution> = preparePoseResolution();
  const targetResolution: ReturnType<typeof preparePoseResolution> = preparePoseResolution();
  const effectors: ReadonlySet<AutoMovieHumanoidBone> = new Set(
    windows.map(({ chain }: IAutoMovieContactWindow): AutoMovieHumanoidBone => chain.effector),
  );

  const frames: IAutoMovieKeyframe[] = props.retargeted.keyframes;
  const sourceResolved: ReturnType<typeof resolveBoneMap>[] =
    props.sourceMotion.keyframes.map(
      (kf: IAutoMovieKeyframe): ReturnType<typeof resolveBoneMap> =>
        resolvePrepared(sourceRig, kf.pose, sourceResolution, effectors),
    );

  // Per-frame contact pins, already mapped into target space.
  const pins: Array<Map<AutoMovieHumanoidBone, IAutoMovieVector3>> = frames.map(
    (): Map<AutoMovieHumanoidBone, IAutoMovieVector3> => new Map(),
  );
  const chains: Map<AutoMovieHumanoidBone, IAutoMoviePlantChain> = new Map();
  for (const { chain, window } of windows) {
    chains.set(chain.effector, chain);
    const mask: boolean[] =
      window === null
        ? contactMask({
            effector: chain.effector,
            resolved: sourceResolved,
            groundAt,
            tolerance,
          })
        : frames.map(
            (kf: IAutoMovieKeyframe): boolean =>
              kf.time >= window.start && kf.time <= window.end,
          );
    mask.forEach((inContact: boolean, index: number): void => {
      if (inContact === false) return;
      pins[index]!.set(
        chain.effector,
        Vector3.scale(
          sourceResolved[index]!.get(chain.effector)!.worldPosition,
          props.rootScale,
        ),
      );
    });
  }

  const worst: Map<AutoMovieHumanoidBone, { residual: number; index: number }> =
    new Map<AutoMovieHumanoidBone, { residual: number; index: number }>();
  const keyframes: IAutoMovieKeyframe[] = [];
  let referencePose: IAutoMoviePose | undefined;
  frames.forEach((keyframe: IAutoMovieKeyframe, index: number): void => {
    const corrected: IAutoMovieKeyframe = correctFrame({
      keyframe,
      index,
      pins: pins[index]!,
      chains,
      skeleton: props.target,
      topology: targetTopology,
      jointAxes: props.targetJointAxes,
      restFrames: props.targetRestFrames,
      worst,
      referencePose,
      poseResolution: targetRig,
      resolution: targetResolution,
    });
    keyframes.push(corrected);
    referencePose = corrected.pose;
  });

  const budget: number = tolerance * props.rootScale;
  for (const [effector, entry] of worst)
    if (entry.residual > budget)
      props.collector.warn(
        "physics",
        `$input.motion.keyframes[${entry.index}].pose.joints["${effector}"]`,
        `${effector} could not hold its retargeted contact: the target rig's proportions leave it ${round(entry.residual)} from the mapped source contact, beyond the ${round(budget)} contact budget (residual slide is implausible, not impossible, retune the rig proportions or the contact tolerance)`,
        entry.residual,
        entry.residual - budget,
      );

  return { ...props.retargeted, keyframes };
};

/** Every bone of the chain resolves on the rig's FK walk. */
const resolvable: (
  chain: IAutoMoviePlantChain,
  bones: ReadonlySet<AutoMovieHumanoidBone>,
) => boolean = (
  chain: IAutoMoviePlantChain,
  bones: ReadonlySet<AutoMovieHumanoidBone>,
): boolean =>
  [chain.effector, chain.upper, chain.lower].every(
    (bone: AutoMovieHumanoidBone): boolean => bones.has(bone),
  );

/**
 * Re-solve one keyframe's pinned limbs and record each effector's worst
 * residual. A limb already on its pin, or one whose chain is geometrically
 * degenerate, is left exactly as authored.
 */
const correctFrame: (props: {
  keyframe: IAutoMovieKeyframe;
  index: number;
  pins: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>;
  chains: ReadonlyMap<AutoMovieHumanoidBone, IAutoMoviePlantChain>;
  /** Rig whose unchanged topology and ROM constrain correction. */ skeleton: IAutoMovieSkeleton;
  topology: ReturnType<typeof indexSkeletonTopology>;
  jointAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  restFrames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
  worst: Map<AutoMovieHumanoidBone, { residual: number; index: number }>;
  referencePose?: IAutoMoviePose;
  poseResolution: prepareSkeletonPoseResolution.IRig;
  resolution: ReturnType<typeof preparePoseResolution>;
}) => IAutoMovieKeyframe = (props: {
  keyframe: IAutoMovieKeyframe;
  index: number;
  pins: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>;
  chains: ReadonlyMap<AutoMovieHumanoidBone, IAutoMoviePlantChain>;

  /** Rig whose unchanged topology and ROM constrain correction. */
  skeleton: IAutoMovieSkeleton;
  topology: ReturnType<typeof indexSkeletonTopology>;
  jointAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  restFrames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
  worst: Map<AutoMovieHumanoidBone, { residual: number; index: number }>;
  referencePose?: IAutoMoviePose;
  poseResolution: prepareSkeletonPoseResolution.IRig;
  resolution: ReturnType<typeof preparePoseResolution>;
}): IAutoMovieKeyframe => {
  if (props.pins.size === 0) return props.keyframe;

  const effectors: ReadonlySet<AutoMovieHumanoidBone> = new Set(props.pins.keys());

  const resolve: (pose: IAutoMoviePose) => ReturnType<typeof resolveBoneMap> = (
    pose: IAutoMoviePose,
  ): ReturnType<typeof resolveBoneMap> =>
    resolvePrepared(props.poseResolution, pose, props.resolution, effectors);

  let pose: IAutoMoviePose = props.keyframe.pose;
  let resolved: ReturnType<typeof resolve> = resolve(pose);
  for (const [effector, target] of props.pins) {
    const current: IAutoMovieVector3 = resolved.get(effector)!.worldPosition;
    if (drift(current, target) <= NOOP_EPSILON) continue;
    const chain: IAutoMoviePlantChain = props.chains.get(effector)!;
    const fitted: IAutoMoviePose = fitSeededChainToTarget.prepare({
      skeleton: props.skeleton,
      pose,
      chain,
      topology: props.topology,
      jointAxes: props.jointAxes,
      restFrames: props.restFrames,
      referencePose: props.referencePose,
    }, undefined, props.resolution, props.poseResolution).fit(target).pose;
    if (fitted === pose) continue;
    pose = fitted;
    resolved = resolve(pose);
  }

  for (const [effector, target] of props.pins) {
    const residual: number = drift(
      resolved.get(effector)!.worldPosition,
      target,
    );
    const prior: { residual: number; index: number } | undefined =
      props.worst.get(effector);
    if (prior === undefined || residual > prior.residual)
      props.worst.set(effector, { residual, index: props.index });
  }

  return pose === props.keyframe.pose
    ? props.keyframe
    : { ...props.keyframe, pose };
};

/** Index only demanded fresh outputs from one admitted immutable retarget rig. */
function resolvePrepared(
  rig: prepareSkeletonPoseResolution.IRig,
  pose: IAutoMoviePose,
  resolution: ReturnType<typeof preparePoseResolution>,
  requested: ReadonlySet<AutoMovieHumanoidBone>,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
  for (const bone of rig.resolve(pose, resolution, requested)) map.set(bone.bone, bone);
  return map;
}

/** Distance between a resolved effector and the contact it must hold. */
const drift: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number => Vector3.length(Vector3.subtract(a, b));

/** Six-decimal rounding so a warning message stays readable and stable. */
const round: (value: number) => number = (value: number): number =>
  Math.round(value * 1e6) / 1e6;
