import {
  AutoMovieStepPlanner as Planner,
  Quaternion,
  type AutoMoviePhysicalSimulation as Simulation,
  Vector3,
  physicalSupportPoint,
  planPhysicalSupportTargets,
} from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { PhysicalFixtures } from "./PhysicalFixtures";

/** Literal slow-walk acceptance inputs, shared across actual providers without a new archetype or gait preset. */
export namespace PhysicalPerformanceFixtures {
  /** Reuse the provider's own bone centres and capsule endpoint where it has no foot bone. */
  export function supports(profile: P): IAutoMovieFootfallPattern {
    return {
      id: "measured-provider-endpoints",
      minimumSupports: 1,
      limbs: (["left", "right"] as const).map(
        (
          side: "left" | "right",
          index: number,
        ): {
          bone: string;
          localPoint: IAutoMovieVector3 | undefined;
          chain: string[];
          phase: number;
          duty: number;
          offset: { forward: number; left: number };
          stride: { speed: number; length: number }[];
        } => {
          const human: boolean = profile.id === "human";
          const bone: string = `${side}${human ? "Midfoot" : "LowerLeg"}`;
          const segment: P.ISegment = profile.segments.find(
            (candidate: (typeof profile.segments)[number]): boolean =>
              candidate.bone === bone,
          )!;
          let localPoint: IAutoMovieVector3 | undefined;
          if (!human) {
            const shape: P.IShape = segment.shapes[0]!;
            if (shape.kind !== "capsule")
              throw new Error(
                "Stickman acceptance requires its existing actual shin capsule",
              );
            localPoint = Vector3.add(
              shape.transform.position,
              Quaternion.rotateVector(shape.transform.rotation, {
                x: 0,
                y: -shape.halfLength - shape.radius,
                z: 0,
              }),
            );
          }
          return {
            bone,
            localPoint,
            chain: human
              ? [
                  `${side}UpperLeg`,
                  `${side}LowerLeg`,
                  `${side}Foot`,
                  `${side}Subtalar`,
                  bone,
                ]
              : [`${side}UpperLeg`, bone],
            phase: index / 2,
            duty: 0.55,
            offset: { forward: 0, left: index === 0 ? 0.1 : -0.1 },
            stride: [
              { speed: 0, length: 0.35 },
              { speed: 0.5, length: 0.35 },
            ],
          };
        },
      ),
    };
  }

  /** Precompute drift-triggered steps and bounded profile-coordinate targets at the native cache rate. */
  export function walk(
    profile: P,
    duration: number,
    peakPitch: number = 0,
  ): {
    body: Simulation.IBody;
    planner: Planner;
    pattern: IAutoMovieFootfallPattern;
  } {
    const pattern: IAutoMovieFootfallPattern = supports(profile);
    const forward: IAutoMovieVector3 =
      profile.id === "human" ? { x: 1, y: 0, z: 0 } : { x: 0, y: 0, z: 1 };
    const original: Record<string, P.ITransform> = Object.fromEntries(
      profile.segments.map(
        (
          segment: (typeof profile.segments)[number],
        ): [string, P.ITransform] => [
          segment.bone,
          structuredClone(segment.neutral),
        ],
      ),
    );
    const gap: number =
      profile.id === "human"
        ? 0
        : Math.min(
            ...pattern.limbs.map(
              (limb: (typeof pattern.limbs)[number]): number =>
                physicalSupportPoint(original[limb.bone]!, limb.localPoint).y,
            ),
          );
    for (const pose of Object.values(original)) pose.position.y -= gap;
    const initial: Record<string, IAutoMovieVector3> = Object.fromEntries(
      pattern.limbs.map(
        (limb: (typeof pattern.limbs)[number]): [string, IAutoMovieVector3] => [
          limb.bone,
          physicalSupportPoint(original[limb.bone]!, limb.localPoint),
        ],
      ),
    );
    const planner: Planner = new Planner({
      pattern,
      start: 0,
      end: duration,
      rate: 120,
      desired: (seconds: number): Record<string, Planner.IPlacement> =>
        Object.fromEntries(
          pattern.limbs.map(
            (
              limb: (typeof pattern.limbs)[number],
            ): [string, Planner.IPlacement] => [
              limb.bone,
              {
                point: [
                  initial[limb.bone]!.x + forward.x * seconds * 0.12,
                  initial[limb.bone]!.z + forward.z * seconds * 0.12,
                ],
                yaw: 0,
                pitch: 0,
                clearance: 0,
              },
            ],
          ),
        ),
      heading: (): number => (profile.id === "human" ? 0 : -Math.PI / 2),
      reservations: [],
      duration: 0.35,
      threshold: 0.06,
      height: 0.04,
      peakPitch,
      overlap: 0,
      maximumStride: 0.35,
      reservationMargin: 0,
      margin: 0,
      yawLever: 0,
      pitchLever: 0,
      alternationWindow: 0.5,
    });
    const body: Simulation.IBody = trackedBody(profile, duration);
    body.supportTracking = {
      pattern,
      stiffness: 100 * profile.mass,
      damping: 10 * profile.mass,
      maximumForce: 12 * profile.mass,
      iterations: 0,
    };
    body.targets = body.targets.map(
      (_: Simulation.ITarget, step: number): Simulation.ITarget => {
        const seconds: number = step / 120;
        const targets: Record<string, P.ITransform> = Object.fromEntries(
          Object.entries(original).map(
            ([bone, pose]: [string, P.ITransform]): [string, P.ITransform] => [
              bone,
              {
                position: {
                  x: pose.position.x + forward.x * seconds * 0.12,
                  y: pose.position.y - 0.03,
                  z: pose.position.z + forward.z * seconds * 0.12,
                },
                rotation: { ...pose.rotation },
              },
            ],
          ),
        );
        const goals: Record<string, IAutoMovieVector3> = Object.fromEntries(
          pattern.limbs.map(
            (
              limb: (typeof pattern.limbs)[number],
            ): [string, IAutoMovieVector3] => {
              const placement: Planner.IPlacement = planner.at(
                limb.bone,
                seconds,
              ).placement;
              return [
                limb.bone,
                {
                  x: placement.point[0],
                  y: initial[limb.bone]!.y + placement.clearance,
                  z: placement.point[1],
                },
              ];
            },
          ),
        );
        return {
          strength: 1,
          supportStrength: Object.fromEntries(
            pattern.limbs.map(
              (limb: (typeof pattern.limbs)[number]): [string, number] => [
                limb.bone,
                1,
              ],
            ),
          ),
          segments: planPhysicalSupportTargets({
            profile,
            pattern,
            targets,
            goals,
            maximumRootDrop: 0.1,
            iterations: 32,
            tolerance: 0.0005,
          }).targets,
        };
      },
    );
    return { body, planner, pattern };
  }

  /** Declare finite physical actuator budgets with no endpoint teleports or fixed root. */
  export function trackedBody(profile: P, duration: number): Simulation.IBody {
    const body: Simulation.IBody = PhysicalFixtures.body(
      profile.id,
      profile,
      duration,
    );
    track(body);
    return body;
  }

  /** Apply the same explicit bounded actuator policy to a caller-positioned body. */
  export function track(body: Simulation.IBody): void {
    const profile: P = body.profile;
    Object.assign(body, {
      rootStiffness: 100 * profile.mass,
      rootDamping: 15 * profile.mass,
      maximumRootForce: 25 * profile.mass,
      rootTorque: {
        stiffness: 5 * profile.mass,
        damping: profile.mass,
        maximumTorque: 6 * profile.mass,
      },
      compensateGravity: true,
    });
    for (const target of body.targets) target.strength = 1;
  }
}
