import {
  AutoMovieEnvelope as Envelope,
  Quaternion,
  type AutoMoviePhysicalSimulation as Simulation,
  Vector3,
  projectPhysicalTargets,
} from "@automovie/engine";
import { AutoMovieHumanPhysicalBracing } from "@automovie/human";
import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { FilmVector as V } from "../motion/rig/FilmVector";
import { Strike } from "../motion/striking/Strike";
import { BoutScript } from "../shots/kickboxing/ring-bout/BoutScript";
import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import { BoutKinematicClip } from "./BoutKinematicClip";
import { BoutPhysicalSettings as Settings } from "./BoutPhysicalSettings";
import { BoutTargetSource } from "./BoutTargetSource";
import { boutContactBindings } from "./boutContactBindings";
import { boutDynamicSegments } from "./boutDynamicSegments";
import { boutGuardPointBounds } from "./boutGuardPointBounds";
import { boutSupportPattern } from "./boutSupportPattern";

/** Bake this screenplay's clinical intent; only the shared engine integrates contacts and dynamics. */
export function createBoutPhysicalInput(
  source: BoutTargetSource,
  duration: number,
  kind: "simulated" | "kinematic" = "simulated",
  startSeconds: number = 0,
  observe?: (
    seconds: number,
    samples: Readonly<Record<FilmPlan.ActorId, BoutTargetSource.ISample>>,
  ) => void,
): Simulation.IInput {
  const cacheRate: number = Settings.rate;
  const authoredRate: number = 30;
  const stride: number = cacheRate / authoredRate;
  const intervals: number = duration * cacheRate;
  if (
    !Number.isFinite(startSeconds) ||
    startSeconds < 0 ||
    !Number.isFinite(duration) ||
    duration <= 0 ||
    duration + startSeconds > 180 ||
    !Number.isInteger(intervals)
  )
    throw new Error(
      "Bout interval must fit the 120 Hz cache within 180 seconds",
    );
  source.configureResponses(
    kind === "kinematic" ? "kinematic" : "native",
    kind === "kinematic" ? source.formulaResponses : [],
  );
  const ids: readonly FilmPlan.ActorId[] = ["a", "b", "referee"];
  const coarse: Record<FilmPlan.ActorId, Record<string, P.ITransform>[]> = {
    a: [],
    b: [],
    referee: [],
  };
  const count: number = Math.ceil(duration * authoredRate);
  const finish: BoutTargetSource.ISample | undefined =
    kind === "kinematic" && startSeconds + duration > BoutScript.finish.at
      ? source.sample(BoutScript.finish.at).b
      : undefined;
  const clip: BoutKinematicClip | undefined = finish
    ? new BoutKinematicClip(
        finish.root,
        source.rigs.b.neutral.posed.find(
          (placement: (typeof source.rigs.b.neutral.posed)[number]): boolean =>
            placement.bone === "hips",
        )!.position,
      )
    : undefined;
  for (let step: number = 0; step <= count; step++) {
    const seconds: number =
      startSeconds + Math.min(duration, step / authoredRate);
    const sample: ReturnType<BoutTargetSource["sample"]> =
      source.sample(seconds);
    if (clip && seconds > BoutScript.finish.at) {
      const placed: ReturnType<BoutKinematicClip["at"]> = clip.at(seconds);
      const delta: P.ITransform["rotation"] = Quaternion.multiply(
        {
          x: placed.rotation[0],
          y: placed.rotation[1],
          z: placed.rotation[2],
          w: placed.rotation[3],
        },
        Quaternion.inverse({
          x: sample.b.root.rotation[0],
          y: sample.b.root.rotation[1],
          z: sample.b.root.rotation[2],
          w: sample.b.root.rotation[3],
        }),
      );
      sample.b.segments = Object.fromEntries(
        Object.entries(sample.b.segments).map(
          ([bone, pose]: [string, P.ITransform]): [string, P.ITransform] => [
            bone,
            {
              position: Vector3.add(
                V.vector(placed.position),
                Quaternion.rotateVector(
                  delta,
                  Vector3.subtract(
                    pose.position,
                    V.vector(sample.b.root.position),
                  ),
                ),
              ),
              rotation: Quaternion.multiply(delta, pose.rotation),
            },
          ],
        ),
      );
    }
    for (const id of ids) coarse[id].push(sample[id].segments);
    observe?.(seconds, sample);
    if (step % 300 === 0) console.log(`Clinical targets: ${step}/${count}`);
  }
  return {
    duration,
    rate: cacheRate,
    substeps: 32,
    iterations: 32,
    internalIterations: 4,
    contactTolerance: Settings.contactTolerance,
    gravity: { x: 0, y: -9.81, z: 0 },
    floor: Settings.floor,
    floorBounds: Settings.floorBounds,
    impulses: [],
    checkpointEvery: 120,
    yieldEvery: 120,
    maximumSteps: 21601,
    maximumSegments: 78,
    bodies: ids.map((id: FilmPlan.ActorId): Simulation.IBody => {
      const rig: BoutTargetSource["rigs"][FilmPlan.ActorId] = source.rigs[id];
      const profile: P = rig.profile;
      const pattern: IAutoMovieFootfallPattern = boutSupportPattern(rig, id);
      const schedule: typeof source.referee.steps =
        id === "referee" ? source.referee.steps : source.fighters[id].steps;
      const authoredFlight: number = Math.max(
        0,
        ...schedule.steps
          .filter(
            (step: (typeof schedule.steps)[number]): boolean =>
              step.kind === "swing",
          )
          .map(
            (step: (typeof schedule.steps)[number]): number =>
              step.end - step.start,
          ),
      );
      const window: readonly [number, number] = Strike.window(
        BoutScript.finish,
      );
      const side: "left" | "right" =
        BoutScript.specs[BoutScript.finish.technique].side;
      const releaseOnContact: Simulation.IBody["releaseOnContact"] =
        id === "b" &&
        kind === "simulated" &&
        startSeconds <= window[1] &&
        startSeconds + duration >= window[0]
          ? {
              earliest: Math.max(0, window[0] - startSeconds),
              latest: Math.min(duration, window[1] - startSeconds),
              shapes: profile.segments
                .filter(
                  (segment: P.ISegment): boolean => segment.bone === "head",
                )
                .flatMap((segment: P.ISegment): string[] =>
                  segment.shapes.map((shape: P.IShape): string => shape.id),
                ),
              otherBody: "a",
              otherShapes: source.rigs.a.profile.segments
                .filter((segment: P.ISegment): boolean =>
                  [
                    `${side}LowerLeg`,
                    `${side}Foot`,
                    `${side}Subtalar`,
                    `${side}Midfoot`,
                  ].includes(segment.bone),
                )
                .flatMap((segment: P.ISegment): string[] =>
                  segment.shapes.map((shape: P.IShape): string => shape.id),
                ),
            }
          : undefined;
      const targets: Simulation.ITarget[] = Array.from(
        { length: intervals + 1 },
        (_: unknown, step: number): Simulation.ITarget => {
          const seconds: number = startSeconds + step / cacheRate;
          const index: number = Math.min(count, Math.floor(step / stride));
          const next: number = Math.min(count, index + 1);
          // The final authored interval may contain fewer than four cache ticks.
          const fraction: number =
            next === index
              ? 0
              : (step - index * stride) /
                (Math.min(intervals, next * stride) - index * stride);
          const segments: Record<string, P.ITransform> = Object.fromEntries(
            profile.segments.map(
              (segment: P.ISegment): [string, P.ITransform] => {
                const a: P.ITransform = coarse[id][index]![segment.bone]!;
                const b: P.ITransform = coarse[id][next]![segment.bone]!;
                return [
                  segment.bone,
                  {
                    position: Vector3.add(
                      a.position,
                      Vector3.scale(
                        Vector3.subtract(b.position, a.position),
                        fraction,
                      ),
                    ),
                    rotation: Quaternion.slerp(
                      a.rotation,
                      b.rotation,
                      fraction,
                    ),
                  },
                ];
              },
            ),
          );
          const released: boolean =
            id === "b" && seconds >= BoutScript.finish.at;
          const brace: number = released
            ? Envelope.plateau(seconds, 158.7, 159.3, 163, 163.8)
            : 0;
          const head: number = released
            ? Envelope.plateau(seconds, 157.7, 158.2, 162.3, 163.2)
            : 0;
          const protective: Record<string, number> = {
            neck: 0.1 * head,
            atlas: 0.1 * head,
            chest: 0.08 * brace,
            leftUpperArm: 0.18 * brace,
            leftLowerArm: 0.18 * brace,
            leftHand: 0.1 * brace,
          };
          return {
            segments: projectPhysicalTargets(profile, segments).targets,
            strength: released && kind === "kinematic" ? 0 : 1,
            ...(released && releaseOnContact
              ? { releasedJointStrength: protective }
              : released && kind === "kinematic"
                ? { jointStrength: protective }
                : {}),
            unavailableSupports: (["left", "right"] as const)
              .filter(
                (side: "left" | "right"): boolean =>
                  (released && kind === "kinematic") ||
                  schedule.at(side, seconds).phase !== "planted",
              )
              .map((side: "left" | "right"): string => `${side}Midfoot`),
            supportStrength: Object.fromEntries(
              (["left", "right"] as const).map(
                (side: "left" | "right"): [string, number] => [
                  `${side}Midfoot`,
                  (released && kind === "kinematic") ||
                  schedule.at(side, seconds).phase === "busy"
                    ? 0
                    : 1,
                ],
              ),
            ),
          };
        },
      );
      for (const [step, target] of targets.entries()) {
        const seconds: number = startSeconds + step / cacheRate;
        target.bindings = boutContactBindings(source, id, seconds);
        target.pointBounds = boutGuardPointBounds(source, id, seconds);
        if (kind === "simulated")
          target.dynamicSegments = boutDynamicSegments(profile, id, seconds);
      }
      return {
        id,
        profile,
        mode: { kind },
        targets,
        ...(releaseOnContact ? { releaseOnContact } : {}),
        maximumBindings: Math.max(
          1,
          ...targets.map(
            (target: Simulation.ITarget): number =>
              (target.bindings?.length ?? 0) +
              (target.pointBounds?.length ?? 0),
          ),
        ),
        handoffSeconds: 0.2,
        handoffLimits: {
          maximumLinearError: Settings.contactTolerance,
          maximumJointViolation: Settings.jointTolerance,
        },
        selfAvoidance: {
          iterations: Settings.targetIterations,
          tolerance: Settings.targetTolerance,
        },
        actuation: "internal",
        rootStiffness: 100 * profile.mass,
        rootDamping: 15 * profile.mass,
        maximumRootForce: 25 * profile.mass,
        rootTorque: {
          stiffness: 5 * profile.mass,
          damping: profile.mass,
          maximumTorque: 6 * profile.mass,
        },
        compensateGravity: true,
        complianceSeconds: 0.12,
        complianceStrength: 0.15,
        releasedQuality: {
          iterations: 64,
          internalIterations: 64,
          duringReflex: true,
        },
        balance: {
          pattern,
          maximumStep: 0.6,
          duration: 0.25,
          height: 0.1,
          stiffness: 500,
          damping: 60,
          maximumForce: 500,
          margin: 0.01,
          reactionSeconds: authoredFlight + 0.07,
          bracing: AutoMovieHumanPhysicalBracing(profile),
        },
        supportTracking: {
          pattern,
          stiffness: 100 * profile.mass,
          damping: 10 * profile.mass,
          maximumForce: 12 * profile.mass,
          iterations: 0,
        },
      };
    }),
  };
}
