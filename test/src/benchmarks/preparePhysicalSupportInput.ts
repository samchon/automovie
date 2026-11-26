import { Quaternion, Vector3, physicalShapeBounds, validatePoseResult, AutoMovieEnginePhysics } from "@automovie/engine";
import { AutoMovieHumanPhysicalStandingPose } from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain } from "@automovie/motions";

import { PhysicalSupportFixtures } from "../features/internal/PhysicalSupportFixtures";
import { createPhysicalBalanceInput } from "../features/internal/createPhysicalBalanceInput";
import { motionHumanLaw } from "../features/internal/motionHumanLaw";
import { tracePhysicalSupportOnset } from "./tracePhysicalSupportOnset";

/** A declared starting stance. The canonical neutral pose is an onset control. */
type Stance = "authored-stand" | "canonical-neutral" | "four-support";

/** Independent world-space readings of the authored or fitted physical targets. */
interface IPhysicalPoseObservation {
  /** Exact world transform of the physical root. */
  root: IAutoMovieRigidTransform;
  /** Whole-body mass center, recomputed from the supplied targets. */
  center: IAutoMovieVector3;
  /** Greatest paired joint anchor gap in metres, with its joint identity. */
  anchor: { joint: string; error: number };
  /** Greatest native angular excess in radians, with its joint and coordinate. */
  rom: { joint: string; axis: "x" | "y" | "z"; violation: number };
  /** Signed minimum collider height at the unchanged floor, in metres per shape. */
  carrierGaps: Record<string, Record<string, number>>;
}

/**
 * Prepare the same bounded native controller over each declared starting
 * stance.
 */
export function preparePhysicalSupportInput(
  profile: IAutoMoviePhysicalProfile,
  stance: Stance,
  duration: number,
  impulse: number,
  stand?: preparePhysicalSupportInput.IStand,
): preparePhysicalSupportInput.IResult {
  const body: IAutoMoviePhysicalSimulationInput.IBody =
    stance === "four-support"
      ? PhysicalSupportFixtures.body(profile, duration)
      : PhysicalSupportFixtures.canonical(profile, duration);
  const initial: IAutoMoviePhysicalSimulationInput.ITarget = body.targets[0]!;
  let floorOffset: number = 0;
  if (stance === "authored-stand") {
    if (!stand || stand.profile !== profile)
      throw new Error("Missing settled public Stand for this physical profile");
    if (!stand.projected)
      throw new Error(
        `Stand preflight failed: ${JSON.stringify(stand.observation)}`,
      );
    for (const target of body.targets)
      target.segments = structuredClone(stand.projected);
  } else {
    floorOffset = Math.min(
      ...body.balance!.pattern.limbs.map((limb): number =>
        tracePhysicalSupportOnset.patchHeight(profile, limb, initial.segments),
      ),
    );
    for (const target of body.targets)
      for (const pose of Object.values(target.segments))
        pose.position.y -= floorOffset;
  }

  const rootBone: string = findRoot(profile);
  const center: IAutoMovieVector3 = centerOfMass(profile, initial.segments);
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    createPhysicalBalanceInput(profile, "internal", impulse, duration, body);
  if (impulse === 0) {
    input.impulses.length = 0;
  } else {
    const perturbation: IAutoMoviePhysicalSimulationInput.IInput["impulses"][number] =
      input.impulses[0]!;
    perturbation.bone = rootBone;
    perturbation.point = center;
  }
  return {
    input,
    body,
    floorOffset,
    start: {
      stance,
      rootBone,
      root: initial.segments[rootBone]!,
      center,
      stand: stand?.observation,
    },
  };
}

/**
 * Read the source pose through the public Motions performer before native
 * integration.
 */
export namespace preparePhysicalSupportInput {
  /** Public Stand observation and successful physical handoff, when admitted. */
  export interface IStand {
    /**
     * Canonical profile owned by the public performer and borrowed by
     * simulation.
     */
    profile: IAutoMoviePhysicalProfile;
    /**
     * Strict physical targets in world metres. Target arrays clone them when
     * present.
     */
    projected?: Record<string, IAutoMovieRigidTransform>;
    /**
     * Public clinical result and independently measured source and strict
     * target poses.
     */
    observation: {
      /** Film second after the public settled event. */
      seconds: number;
      /** Film second of the actual authored settled event. */
      settled: number;
      /** Source film duration in seconds. */
      duration: number;
      /** Ordinary clinical schema and motion limits of the public pose. */
      clinical: IAutoMovieValidation;
      /**
       * Physical measurements before the handoff, including any native
       * disagreement.
       */
      authored: IPhysicalPoseObservation;
      /**
       * Independent measurements of the projected pose, when the fitter
       * returned one.
       */
      strictPhysical?: IPhysicalPoseObservation;
      /** Final fit residual in metres, when the handoff reached the solver. */
      residual?: number;
      /** Reason no pose was admitted to native qualification. */
      rejection?: string;
    };
  }

  /** Fixed-step native input and its independent, world-space initial reference. */
  export interface IResult {
    /** Fresh simulation input using the admitted fixed-step fixture. */
    input: IAutoMoviePhysicalSimulationInput.IInput;
    /** Subject within that input. */
    body: IAutoMoviePhysicalSimulationInput.IBody;
    /** Subtracted minimum support height in metres, zero for the public Stand. */
    floorOffset: number;
    /**
     * Initial position from which drift, loads and the explicit impulse are
     * evaluated.
     */
    start: {
      /** Actual fixture or authored pose producer. */
      stance: Stance;
      /** Root identified from the profile's joint graph. */
      rootBone: string;
      /** Root transform from the supplied pose, before native integration. */
      root: IAutoMovieRigidTransform;
      /** Whole-body mass center in metres at the supplied pose. */
      center: IAutoMovieVector3;
      /** Extra authored pose observations for the canonical Stand. */
      stand?: IStand["observation"];
    };
  }

  /**
   * Fit the public settled Stand once using the Human provider, retaining both
   * pose observations.
   */
  export function stand(human: IAutoMovieMotionHumanBody): IStand {
    const { profile }: IAutoMovieMotionHumanBody = human;
    const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
      "physical-support-geometry",
      [{ subject: profile.id, body: human }],
      HumanChain.subject(profile.id).stand({ hold: 1, sway: 0 }),
    );
    const settled: number = motionHumanLaw.event(film, "settled", profile.id);
    const seconds: number = settled + (film.duration - settled) / 2;
    if (!(seconds > settled && seconds < film.duration))
      throw new Error("Public Stand has no post-settle interval");
    const bones: motionHumanLaw.Bones = film.bones(profile.id, seconds);
    const poses: Record<string, IAutoMovieRigidTransform> = Object.fromEntries(
      profile.segments.map(
        (
          segment: IAutoMoviePhysicalSegment,
        ): [string, IAutoMovieRigidTransform] => {
          const bone: IAutoMovieResolvedBone | undefined = bones.get(
            segment.bone as AutoMovieHumanoidBone,
          );
          if (!bone) throw new Error(`Public Stand is missing ${segment.bone}`);
          return [
            segment.bone,
            { position: bone.worldPosition, rotation: bone.worldRotation },
          ];
        },
      ),
    );

    const observation: IStand["observation"] = {
      seconds,
      settled,
      duration: film.duration,
      clinical: validatePoseResult(
        film.performance.pose(profile.id, seconds),
        human.skeleton,
      ),
      authored: observePhysicalPose(profile, poses),
    };
    const fit: ReturnType<typeof AutoMovieHumanPhysicalStandingPose.fit> =
      AutoMovieHumanPhysicalStandingPose.fit({
        profile,
        targets: poses,
        floor: 0,
        iterations: 32,
        tolerance: 0.000025,
      });
    observation.residual = fit.residual;
    if (fit.kind === "unresolved") {
      observation.rejection = String(fit.reason);
      return { profile, observation };
    }
    const strict: IPhysicalPoseObservation = observePhysicalPose(
      profile,
      fit.targets,
    );
    observation.strictPhysical = strict;
    if (strict.anchor.error > 0.001 || strict.rom.violation > 0.0001) {
      observation.rejection =
        "Fitted Stand started outside physical anchor or ROM bounds";
      return { profile, observation };
    }
    return { profile, observation, projected: fit.targets };
  }
}

/**
 * Observe actual anchors, limits and signed carrier heights without changing a
 * pose.
 */
function observePhysicalPose(
  profile: IAutoMoviePhysicalProfile,
  poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
): IPhysicalPoseObservation {
  let anchor: IPhysicalPoseObservation["anchor"] = { joint: "", error: 0 };
  let rom: IPhysicalPoseObservation["rom"] = {
    joint: "",
    axis: "x",
    violation: 0,
  };
  for (const joint of profile.joints) {
    const parent: IAutoMovieRigidTransform = poses[joint.parent]!;
    const child: IAutoMovieRigidTransform = poses[joint.child]!;
    const error: number = Vector3.length(
      Vector3.subtract(
        AutoMovieEnginePhysics.physicalSupportPoint(parent, joint.parentFrame.position),
        AutoMovieEnginePhysics.physicalSupportPoint(child, joint.childFrame.position),
      ),
    );
    if (error > anchor.error) anchor = { joint: joint.id, error };
    for (const { axis, violation } of AutoMovieEnginePhysics.measurePhysicalJointLimits(
      joint,
      parent,
      child,
    ))
      if (violation > rom.violation) rom = { joint: joint.id, axis, violation };
  }
  const carrierGaps: IPhysicalPoseObservation["carrierGaps"] = {};
  for (const segment of profile.segments)
    if (/^(left|right)(Foot|Toes)$/.test(segment.bone))
      carrierGaps[segment.bone] = Object.fromEntries(
        segment.shapes.map(
          (shape: (typeof segment.shapes)[number]): [string, number] => [
            shape.id,
            physicalShapeBounds(poses[segment.bone]!, shape).min.y,
          ],
        ),
      );
  return {
    root: poses[findRoot(profile)]!,
    center: centerOfMass(profile, poses),
    anchor,
    rom,
    carrierGaps,
  };
}

/** Require the unique physical segment that is not a joint child. */
function findRoot(profile: IAutoMoviePhysicalProfile): string {
  const children: Set<string> = new Set(
    profile.joints.map((joint): string => joint.child),
  );
  const roots: IAutoMoviePhysicalSegment[] = profile.segments.filter(
    (segment: IAutoMoviePhysicalSegment): boolean =>
      !children.has(segment.bone),
  );
  if (roots.length !== 1)
    throw new Error(`Ambiguous support root for ${profile.id}`);
  return roots[0]!.bone;
}

/**
 * Recompute the physical mass center from each segment's actual initial
 * transform.
 */
function centerOfMass(
  profile: IAutoMoviePhysicalProfile,
  poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
): IAutoMovieVector3 {
  let center: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const segment of profile.segments) {
    const pose: IAutoMovieRigidTransform = poses[segment.bone]!;
    center = Vector3.add(
      center,
      Vector3.scale(
        Vector3.add(
          pose.position,
          Quaternion.rotateVector(pose.rotation, segment.centerOfMass),
        ),
        segment.mass / profile.mass,
      ),
    );
  }
  return center;
}
