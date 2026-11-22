import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  physicalShapeBounds,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieFootfallPattern,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { PhysicalFixtures } from "./PhysicalFixtures";
import { PhysicalSupportFixtures } from "./PhysicalSupportFixtures";
import { motionHumanBody } from "./motionHumanBody";

/**
 * Three canonical Humans with active upper bodies on force-tracked feet: the
 * #3789 replay workload at 120 Hz, 32 substeps, 12 solver iterations and one
 * internal iteration, under world actuation with gravity compensation.
 */
export namespace PhysicalActiveHumans {
  /** Cache intervals per second and native integration updates per interval. */
  export const RATE: number = 120;
  const SUBSTEPS: number = 32;

  /** One second of authored arm and neck motion, sampled once per Human. */
  const CYCLE_STEPS: number = RATE;

  /**
   * Each Human starts a quarter cycle after the previous one, at 0, 90 and
   * 180 degrees of the wave. Every quarter-cycle window then sweeps one full
   * amplitude, so each elbow moves 10 degrees within any 0.25 s run.
   */
  const PHASE_STEPS: number = CYCLE_STEPS / 4;

  /** Current canonical providers in stable scene insertion order. */
  const SUBJECTS: readonly motionHumanBody.Name[] = [
    "m-average",
    "f-average",
    "m-tall",
  ];

  /**
   * Prepare the workload.
   *
   * @param duration Film seconds; a whole number of cache intervals.
   * @param checkpointEvery Cache intervals between native snapshots.
   */
  export function input(
    duration: number,
    checkpointEvery: number,
  ): IAutoMoviePhysicalSimulationInput.IInput {
    const bodies: IAutoMoviePhysicalSimulationInput.IBody[] = SUBJECTS.map(
      (
        subject: motionHumanBody.Name,
        index: number,
      ): IAutoMoviePhysicalSimulationInput.IBody =>
        body(motionHumanBody(subject), duration, index),
    );
    const result: IAutoMoviePhysicalSimulationInput.IInput =
      PhysicalFixtures.input(bodies, duration);
    result.gravity.y = -9.81;
    result.floor = 0;
    result.substeps = SUBSTEPS;
    result.checkpointEvery = checkpointEvery;
    result.yieldEvery = checkpointEvery;
    result.maximumSegments = bodies.reduce(
      (sum: number, body: IAutoMoviePhysicalSimulationInput.IBody): number =>
        sum + body.profile.segments.length,
      0,
    );
    return result;
  }

  /**
   * Halve the last Human's tracking strength from one late cache interval on.
   * Earlier targets and the other bodies stay the same objects.
   */
  export function lateEdit(
    input: IAutoMoviePhysicalSimulationInput.IInput,
    step: number,
  ): IAutoMoviePhysicalSimulationInput.IInput {
    const last: number = input.bodies.length - 1;
    return {
      ...input,
      bodies: input.bodies.map(
        (
          body: IAutoMoviePhysicalSimulationInput.IBody,
          index: number,
        ): IAutoMoviePhysicalSimulationInput.IBody =>
          index !== last
            ? body
            : {
                ...body,
                targets: body.targets.map(
                  (
                    target: IAutoMoviePhysicalSimulationInput.ITarget,
                    at: number,
                  ): IAutoMoviePhysicalSimulationInput.ITarget =>
                    at < step
                      ? target
                      : { ...target, strength: target.strength / 2 },
                ),
              },
      ),
    };
  }

  /**
   * Sample one complete authored cycle on the current skeleton and reuse its
   * transforms through the timeline from the Human's phase. Foot support is
   * force-only in world actuation.
   */
  function body(
    human: IAutoMovieMotionHumanBody,
    duration: number,
    index: number,
  ): IAutoMoviePhysicalSimulationInput.IBody {
    const { profile, skeleton }: IAutoMovieMotionHumanBody = human;
    const result: IAutoMoviePhysicalSimulationInput.IBody =
      PhysicalSupportFixtures.canonical(profile, 1 / RATE);
    const pattern: IAutoMovieFootfallPattern = result.balance!.pattern;
    const carriers: Set<string> = new Set(
      pattern.limbs.flatMap(
        (limb: IAutoMovieFootfallPattern["limbs"][number]): string[] =>
          limb.contacts ?? [limb.bone],
      ),
    );
    const floor: number = Math.min(
      ...profile.segments
        .filter((segment: IAutoMoviePhysicalSegment): boolean =>
          carriers.has(segment.bone),
        )
        .flatMap((segment: IAutoMoviePhysicalSegment): number[] =>
          segment.shapes.map(
            (shape: IAutoMoviePhysicalSegment["shapes"][number]): number =>
              physicalShapeBounds.lowest(segment.neutral, shape),
          ),
        ),
    );
    const supportStrength: Record<string, number> = Object.fromEntries(
      pattern.limbs.map(
        (
          limb: IAutoMovieFootfallPattern["limbs"][number],
        ): [string, number] => [limb.bone, 1],
      ),
    );
    const requested: Set<string> = new Set(
      profile.segments.map(
        (segment: IAutoMoviePhysicalSegment): string => segment.bone,
      ),
    );
    const cycle: IAutoMoviePhysicalSimulationInput.ITarget[] = Array.from(
      { length: CYCLE_STEPS },
      (
        _: unknown,
        sample: number,
      ): IAutoMoviePhysicalSimulationInput.ITarget => {
        const wave: number = Math.sin((2 * Math.PI * sample) / CYCLE_STEPS);
        const pose: IAutoMoviePose = {
          skeleton: skeleton.id,
          root: {
            translation: { x: 2 * (index - 1), y: -floor, z: 0 },
            rotation: Quaternion.identity(),
            scale: { x: 1, y: 1, z: 1 },
          },
          joints: [
            articulation("leftUpperArm", 55 + 5 * wave),
            articulation("rightUpperArm", 55 - 5 * wave),
            // A 100-degree elbow crossed the hands up to 42 mm; at 60 every
            // non-excluded pair keeps at least 10 mm over the whole cycle.
            articulation("leftLowerArm", 60 - 10 * wave),
            articulation("rightLowerArm", 60 + 10 * wave),
            articulation("neck", null, 2 * wave),
          ],
        };
        return {
          strength: 1,
          supportStrength,
          segments: Object.fromEntries(
            resolvePose(
              pose,
              skeleton,
              HUMANOID_JOINT_AXES,
              HUMANOID_REST_FRAME,
              undefined,
              undefined,
              requested,
            ).map(
              (
                bone: IAutoMovieResolvedBone,
              ): [string, IAutoMovieRigidTransform] => [
                bone.bone,
                { position: bone.worldPosition, rotation: bone.worldRotation },
              ],
            ),
          ),
        };
      },
    );
    result.targets = Array.from(
      { length: Math.round(duration * RATE) + 1 },
      (_: unknown, step: number): IAutoMoviePhysicalSimulationInput.ITarget =>
        cycle[(step + index * PHASE_STEPS) % CYCLE_STEPS]!,
    );
    result.actuation = "world";
    result.compensateGravity = true;
    result.supportTracking = {
      pattern,
      stiffness: 100 * profile.mass,
      damping: 10 * profile.mass,
      maximumForce: 12 * profile.mass,
      iterations: 0,
    };
    delete result.balance;
    return result;
  }

  /** A sparse clinical angle in authored degrees; the other axes stay neutral. */
  function articulation(
    bone: AutoMovieHumanoidBone,
    flexion: number | null,
    twist: number | null = null,
  ): IAutoMovieJointPose {
    return { bone, flexion, abduction: null, twist };
  }
}
