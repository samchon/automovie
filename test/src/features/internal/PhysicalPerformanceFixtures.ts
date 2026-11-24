import {
  AutoMovieStepPlanner as Planner,
  Quaternion,
  Vector3,
  physicalSupportPoint,
  planPhysicalSupportTargets,
  projectPhysicalJointRotation,
} from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { PhysicalFixtures } from "./PhysicalFixtures";

/** Literal slow-walk acceptance inputs, shared across actual providers without a new archetype or gait preset. */
export namespace PhysicalPerformanceFixtures {
  /** Whether the profile has the canonical Human's foot and toes bones. */
  export function footed(profile: P): boolean {
    return profile.segments.some(
      (segment: (typeof profile.segments)[number]): boolean =>
        segment.bone === "leftToes",
    );
  }

  /** Support each shank at the provider's ankle anchor, or at its capsule endpoint where it has no foot bone. */
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
          const bone: string = `${side}LowerLeg`;
          const segment: IAutoMoviePhysicalSegment = profile.segments.find(
            (candidate: (typeof profile.segments)[number]): boolean =>
              candidate.bone === bone,
          )!;
          let localPoint: IAutoMovieVector3 | undefined;
          if (footed(profile))
            // The ankle: the shank's anchor of its foot joint.
            localPoint = {
              ...profile.joints.find(
                (joint: (typeof profile.joints)[number]): boolean =>
                  joint.child === `${side}Foot`,
              )!.parentFrame.position,
            };
          else {
            const shape: IAutoMoviePhysicalShape = segment.shapes[0]!;
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
            // A footed leg reaches with hip and knee; walk() keeps the foot's attitude.
            chain: [`${side}UpperLeg`, `${side}LowerLeg`],
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

  /**
   * Precompute drift-triggered steps and bounded profile-coordinate targets at the native cache rate.
   *
   * A footed Human needs a caller-supplied stance already standing on the
   * floor at y = 0, such as its fitted Stand; its forward direction is read
   * from that stance's heel-to-toe line. Other bodies start from their
   * neutral pose lowered until their lowest support point meets the floor.
   */
  export function walk(
    profile: P,
    duration: number,
    peakPitch: number = 0,
    stance?: Readonly<Record<string, IAutoMovieRigidTransform>>,
  ): {
    body: IAutoMoviePhysicalSimulationInput.IBody;
    planner: IAutoMovieStepPlanner;
    pattern: IAutoMovieFootfallPattern;
  } {
    const pattern: IAutoMovieFootfallPattern = supports(profile);
    const human: boolean = footed(profile);
    if (human && stance === undefined)
      throw new Error(
        "A footed Human walk needs a standing stance on the floor",
      );
    const original: Record<string, IAutoMovieRigidTransform> = structuredClone(
      stance ??
        Object.fromEntries(
          profile.segments.map(
            (
              segment: (typeof profile.segments)[number],
            ): [string, IAutoMovieRigidTransform] => [
              segment.bone,
              segment.neutral,
            ],
          ),
        ),
    );
    const gap: number = human
      ? 0
      : Math.min(
          ...pattern.limbs.map(
            (limb: (typeof pattern.limbs)[number]): number =>
              physicalSupportPoint(original[limb.bone]!, limb.localPoint).y,
          ),
        );
    for (const pose of Object.values(original)) pose.position.y -= gap;
    const toes: IAutoMovieVector3 = human
      ? Vector3.subtract(
          original.leftToes!.position,
          original.leftFoot!.position,
        )
      : { x: 0, y: 0, z: 1 };
    const ground: number = Math.hypot(toes.x, toes.z);
    const forward: IAutoMovieVector3 = {
      x: toes.x / ground,
      y: 0,
      z: toes.z / ground,
    };
    const initial: Record<string, IAutoMovieVector3> = Object.fromEntries(
      pattern.limbs.map(
        (limb: (typeof pattern.limbs)[number]): [string, IAutoMovieVector3] => [
          limb.bone,
          physicalSupportPoint(original[limb.bone]!, limb.localPoint),
        ],
      ),
    );
    const planner: IAutoMovieStepPlanner = new Planner({
      pattern,
      start: 0,
      end: duration,
      rate: 120,
      desired: (
        seconds: number,
      ): Record<string, IAutoMovieStepPlanner.IPlacement> =>
        Object.fromEntries(
          pattern.limbs.map(
            (
              limb: (typeof pattern.limbs)[number],
            ): [string, IAutoMovieStepPlanner.IPlacement] => [
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
      heading: (): number => Math.atan2(-forward.z, forward.x),
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
    const body: IAutoMoviePhysicalSimulationInput.IBody = trackedBody(
      profile,
      duration,
    );
    body.supportTracking = {
      pattern,
      stiffness: 100 * profile.mass,
      damping: 10 * profile.mass,
      maximumForce: 12 * profile.mass,
      iterations: 0,
    };
    body.targets = body.targets.map(
      (
        _: IAutoMoviePhysicalSimulationInput.ITarget,
        step: number,
      ): IAutoMoviePhysicalSimulationInput.ITarget => {
        const seconds: number = step / 120;
        const targets: Record<string, IAutoMovieRigidTransform> =
          Object.fromEntries(
            Object.entries(original).map(
              ([bone, pose]: [string, IAutoMovieRigidTransform]): [
                string,
                IAutoMovieRigidTransform,
              ] => [
                bone,
                {
                  position: {
                    x: pose.position.x + forward.x * seconds * 0.12,
                    // A primitive walks 3 cm crouched. A Human's fitted Stand
                    // keeps its straight knees; planPhysicalSupportTargets
                    // lowers the root only as far as each reach requires.
                    y: pose.position.y - (human ? 0 : 0.03),
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
              const placement: IAutoMovieStepPlanner.IPlacement = planner.at(
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
        const segments: Record<string, IAutoMovieRigidTransform> =
          planPhysicalSupportTargets({
            profile,
            pattern,
            targets,
            goals,
            maximumRootDrop: 0.1,
            iterations: 32,
            tolerance: 0.0005,
          }).targets;
        // The ankle is the foot's origin, so the shank places the foot and
        // turning the foot about it keeps the ankle's anchor; the foot keeps
        // the stance attitude admitted to the ankle's range against the
        // shank, and the toes ride it rigidly.
        if (human)
          for (const side of ["left", "right"] as const) {
            const foot: IAutoMovieRigidTransform = segments[`${side}Foot`]!;
            const stanceFoot: IAutoMovieRigidTransform =
              original[`${side}Foot`]!;
            const stanceToes: IAutoMovieRigidTransform =
              original[`${side}Toes`]!;
            // The stance attitude admitted to the ankle's range against the
            // shank, as the solver admits it (projectPhysicalJointRotation):
            // a swinging shank leaves a level foot past plantar flexion.
            const ankle = profile.joints.find(
              (joint) => joint.child === `${side}Foot`,
            )!;
            const socket: IAutoMovieQuaternion = Quaternion.multiply(
              segments[ankle.parent]!.rotation,
              ankle.parentFrame.rotation,
            );
            const admitted: IAutoMovieQuaternion = projectPhysicalJointRotation(
              ankle,
              Quaternion.multiply(
                Quaternion.inverse(socket),
                Quaternion.multiply(
                  stanceFoot.rotation,
                  ankle.childFrame.rotation,
                ),
              ),
            );
            foot.rotation = Quaternion.multiply(
              Quaternion.multiply(socket, admitted),
              Quaternion.inverse(ankle.childFrame.rotation),
            );
            // The toes ride the foot rigidly.
            const carry: IAutoMovieQuaternion = Quaternion.multiply(
              foot.rotation,
              Quaternion.inverse(stanceFoot.rotation),
            );
            segments[`${side}Toes`] = {
              position: Vector3.add(
                foot.position,
                Quaternion.rotateVector(
                  carry,
                  Vector3.subtract(stanceToes.position, stanceFoot.position),
                ),
              ),
              rotation: Quaternion.multiply(carry, stanceToes.rotation),
            };
          }
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
          segments,
        };
      },
    );
    return { body, planner, pattern };
  }

  /** Declare finite physical actuator budgets with no endpoint teleports or fixed root. */
  export function trackedBody(
    profile: P,
    duration: number,
  ): IAutoMoviePhysicalSimulationInput.IBody {
    const body: IAutoMoviePhysicalSimulationInput.IBody = PhysicalFixtures.body(
      profile.id,
      profile,
      duration,
    );
    track(body);
    return body;
  }

  /** Apply the same explicit bounded actuator policy to a caller-positioned body. */
  export function track(body: IAutoMoviePhysicalSimulationInput.IBody): void {
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
