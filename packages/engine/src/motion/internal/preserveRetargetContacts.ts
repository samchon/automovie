import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePlantChain,
  IAutoMoviePose,
  IAutoMoviePreserveRetargetContacts,
  IAutoMovieResolvedBone,
  IAutoMovieRestFrame,
  IAutoMovieRetargetContactProps,
  IAutoMovieRetargetHandContact,
  IAutoMovieSkeleton,
  IAutoMovieSkeletonTopology,
  IAutoMovieVector3,
} from "@automovie/interface";

import { indexSkeletonTopology } from "../../kinematics/indexSkeletonTopology";
import { AutoMovieEngineKinematics } from "../../kinematics/AutoMovieEngineKinematics";
import { reachableBoneNames } from "../../kinematics/internal/reachableBoneNames";
import { resolvePose } from "../../kinematics/internal/resolvePose";
import { Vector3 } from "../../math/Vector3";
import { groundFunction } from "../../space/internal/groundFunction";
import { HUMANOID_LEG_CHAINS } from "../constants/HUMANOID_LEG_CHAINS";
import { contactMask } from "../contactMask";
import { fitSeededChainToTarget } from "../fitSeededChainToTarget";

/** Only the actual FK position is observed by contact classification/correction. */
type IPoint = Pick<IAutoMovieResolvedBone, "worldPosition">;

/** Contact tolerance above the source ground counted as a planted contact. */
const DEFAULT_TOLERANCE: number = 0.02;

/**
 * Target model-unit drift at or below this absolute threshold skips another
 * fit. Binary64 scaling and FK need not commute exactly, so this is a numerical
 * no-op policy rather than a zero-residual or scale-relative error proof.
 */
const NOOP_EPSILON: number = 1e-9;

/** A chain plus the frames on which its contact must be preserved. */
interface IAutoMovieContactWindow {
  chain: IAutoMoviePlantChain;

  /** `null` detects stance against the ground; a span declares it. */
  window: { start: number; end: number } | null;
}

/**
 * Correct a root-scaled retarget clip at its existing authored key times using
 * each source frame's foot/declared hand contact mapped by rootScale. Source
 * slides persist; ROM-limited residuals above tolerance*rootScale are collector
 * warnings, while dynamic nonfinite ground or callback exceptions throw. Inputs
 * have passed retarget admission and parallel source/target key times agree.
 */
export function preserveRetargetContacts(
  props: IAutoMoviePreserveRetargetContacts.IProps,
): IAutoMovieMotion {
  const contacts: IAutoMovieRetargetContactProps = props.contacts ?? {};
  const groundAt: (x: number, z: number) => number = groundFunction(
    contacts.groundY ?? props.sourceFloor,
  );
  const tolerance: number = contacts.tolerance ?? DEFAULT_TOLERANCE;

  const sourceTopology: IAutoMovieSkeletonTopology = indexSkeletonTopology(
    props.source,
  );
  const targetTopology: IAutoMovieSkeletonTopology = indexSkeletonTopology(
    props.target,
  );
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

  // Dynamic ground callbacks can edit borrowed rig or mapping values. Keep
  // complete live FK admission and share only its exact pure arithmetic.
  const sourceResolution: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution> =
    AutoMovieEngineKinematics.preparePoseResolution();
  const targetResolution: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution> =
    AutoMovieEngineKinematics.preparePoseResolution();
  const effectors: ReadonlySet<AutoMovieHumanoidBone> = new Set(
    windows.map(
      ({ chain }: IAutoMovieContactWindow): AutoMovieHumanoidBone =>
        chain.effector,
    ),
  );

  const frames: IAutoMovieKeyframe[] = props.retargeted.keyframes;
  const sourceResolved: ReturnType<typeof resolveEffectors>[] =
    props.sourceMotion.keyframes.map(
      (kf: IAutoMovieKeyframe): ReturnType<typeof resolveEffectors> =>
        resolveEffectors(
          props.source,
          kf.pose,
          sourceTopology,
          props.sourceJointAxes,
          props.sourceRestFrames,
          sourceResolution,
          effectors,
        ),
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
}

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
  topology: IAutoMovieSkeletonTopology;
  jointAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  restFrames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
  worst: Map<AutoMovieHumanoidBone, { residual: number; index: number }>;
  referencePose?: IAutoMoviePose;
  resolution: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>;
}) => IAutoMovieKeyframe = (props: {
  keyframe: IAutoMovieKeyframe;
  index: number;
  pins: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>;
  chains: ReadonlyMap<AutoMovieHumanoidBone, IAutoMoviePlantChain>;

  /** Rig whose unchanged topology and ROM constrain correction. */
  skeleton: IAutoMovieSkeleton;
  topology: IAutoMovieSkeletonTopology;
  jointAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  restFrames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
  worst: Map<AutoMovieHumanoidBone, { residual: number; index: number }>;
  referencePose?: IAutoMoviePose;
  resolution: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>;
}): IAutoMovieKeyframe => {
  if (props.pins.size === 0) return props.keyframe;

  const demanded: ReadonlySet<AutoMovieHumanoidBone> = new Set(
    props.pins.keys(),
  );

  let pose: IAutoMoviePose = props.keyframe.pose;
  let resolved: ReturnType<typeof resolveEffectors> = readFrameEffectors(
    props,
    pose,
    demanded,
  );
  for (const [effector, target] of props.pins) {
    const current: IAutoMovieVector3 = resolved.get(effector)!.worldPosition;
    if (drift(current, target) <= NOOP_EPSILON) continue;
    const chain: IAutoMoviePlantChain = props.chains.get(effector)!;
    const fitted: IAutoMoviePose = fitSeededChainToTarget
      .prepare(
        {
          skeleton: props.skeleton,
          pose,
          chain,
          topology: props.topology,
          jointAxes: props.jointAxes,
          restFrames: props.restFrames,
          referencePose: props.referencePose,
        },
        undefined,
        props.resolution,
      )
      .fit(target).pose;
    if (fitted === pose) continue;
    pose = fitted;
    resolved = readFrameEffectors(props, pose, demanded);
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

/**
 * Read the same current frame inputs at actual FK sites without a per-frame
 * resolver closure.
 */
function readFrameEffectors(
  props: Parameters<typeof correctFrame>[0],
  pose: IAutoMoviePose,
  requested: ReadonlySet<AutoMovieHumanoidBone>,
): ReturnType<typeof resolveEffectors> {
  return resolveEffectors(
    props.skeleton,
    pose,
    props.topology,
    props.jointAxes,
    props.restFrames,
    props.resolution,
    requested,
  );
}

/**
 * Preserve complete raw admission, retaining only the owned positions this
 * contact pass reads.
 */
function resolveEffectors(
  skeleton: IAutoMovieSkeleton,
  pose: IAutoMoviePose,
  topology: ReturnType<typeof indexSkeletonTopology>,
  axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  frames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  resolution: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>,
  requested: ReadonlySet<AutoMovieHumanoidBone>,
): Map<AutoMovieHumanoidBone, IPoint> {
  const map: Map<AutoMovieHumanoidBone, IPoint> = new Map();
  for (const bone of resolvePose(
    pose,
    skeleton,
    axes,
    frames,
    topology,
    resolution,
  ))
    if (requested.has(bone.bone))
      map.set(bone.bone, { worldPosition: bone.worldPosition });
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
