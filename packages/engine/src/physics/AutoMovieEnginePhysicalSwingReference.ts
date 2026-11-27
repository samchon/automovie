import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieSolvePhysicalArticulationTargets,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../math/AutoMovieEngineVector3";
import { physicalShapeBoundsImplementation } from "./internal/physicalShapeBoundsImplementation";
import { AutoMovieEnginePhysicalStanceBalance } from "./AutoMovieEnginePhysicalStanceBalance";
import { physicalSupportFootprint } from "./internal/physicalSupportFootprint";
import { physicalSupportPoint } from "./internal/physicalSupportPoint";
import { projectPhysicalJointRotation } from "./internal/projectPhysicalJointRotation";
import { solvePhysicalArticulationTargets } from "./internal/solvePhysicalArticulationTargets";


/** The swing reference's rates near lift-off. */
export namespace AutoMovieEnginePhysicalSwingReference {
  /**
   * A swinging limb's references near its lift-off: each of its chain's joints
   * drawn by a share from the relative rotation it actually stands at toward the
   * one fit to the swing's path, and the chain recomposed outward from its
   * parent's reference, so at share zero every joint's reference is its actual
   * angle and the swing's references are continuous at lift. A swing task's
   * reference starts at the foot's present placement when its contact is removed
   * (TSID, `remove_contact`), and a contact change is ramped rather than switched
   * (Kim, Jorgensen and Sentis 2018).
   *
   * @param input The chain's joints, proximal first; the reference pose of the
   *   first joint's parent, world; the chain's and that parent's actual poses and
   *   fitted poses, world; and the share in [0, 1].
   * @returns The chain's reference poses, world.
   */
  export function compute(
    input: Parameters<typeof computeSwingReference>[0],
  ): ReturnType<typeof computeSwingReference> {
    return computeSwingReference(input);
  }
  /**
   * A lifted swing joint's reference rate: drawn from the joint's actual rate
   * toward the path's over `AutoMovieEnginePhysicalStanceBalance.FADE` after lift-off, as its
   * angle is, so the swing starts from the leg's present state, position and
   * velocity (design-4017-edge, S1; Khadiv et al. 2017, Section III-B: the
   * swing planned from the foot's present state; TSID `remove_contact`).
   *
   * @param input The joint's actual and path rates, radians per second in one
   *   frame, and the seconds since lift-off.
   * @returns The reference rate, radians per second, in that frame.
   */
  export function rate(input: {
    actual: IAutoMovieVector3;
    path: IAutoMovieVector3;
    elapsed: number;
  }): IAutoMovieVector3 {
    const share: number = Math.max(
      0,
      Math.min(1, input.elapsed / AutoMovieEnginePhysicalStanceBalance.FADE),
    );
    return AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.scale(input.actual, 1 - share),
      AutoMovieEngineVector3.scale(input.path, share),
    );
  }

  /**
   * A lifted swing chain fitted to a full foot pose, its endpoint at the goal
   * and its foot at the planned attitude, as the swing-foot task of whole-body
   * controllers is a pose (TSID `ex_4_walking`, an SE(3) swing task), the
   * height and the orientation specified apart (Pratt et al., M2V2, Section
   * VII-D1), by the analytical inverse kinematics of a leg (Kajita et al.,
   * Introduction to Humanoid Robotics, Section 2.5): the planned foot pose
   * places the ankle's centre; the joints above the ankle reach that point, the
   * knee's angle following from the hip-to-ankle distance alone, unique, the
   * hip's swivel continuing from the seed (design-4017-edge, S1); and the ankle
   * takes the foot's remaining rotation relative to the shank, admitted to its
   * axes and limits, the turn it cannot take carried by the hip above it. The
   * chain starts from the seed's joint angles on the base's present pose;
   * contact carriers below the foot, a Human's toes, are held at their authored
   * angles to it.
   *
   * @param input The profile; the chain, first joint's child to the foot; the
   *   pose of the chain's parent, world; the seed poses whose joint angles
   *   start the fit; the authored poses whose joint angles hold the carriers
   *   below the foot; the endpoint goal, world metres, and the foot's local
   *   endpoint, metres; the planned foot rotation, world; the iteration budget
   *   and the metre tolerance.
   * @returns The fitted poses of the chain and of the carriers below it, world,
   *   and the residual, metres.
   */
  export function pose(input: {
    profile: IAutoMoviePhysicalProfile;
    chain: readonly string[];
    base: IAutoMovieRigidTransform;
    seed: Readonly<Record<string, IAutoMovieRigidTransform>>;
    authored: Readonly<Record<string, IAutoMovieRigidTransform>>;
    goal: IAutoMovieVector3;
    localPoint?: IAutoMovieVector3;
    rotation: IAutoMovieQuaternion;
    iterations: number;
    tolerance: number;
  }): { targets: Record<string, IAutoMovieRigidTransform>; residual: number } {
    const foot: string = input.chain[input.chain.length - 1]!;
    const subtree: Set<string> = new Set([input.chain[0]!]);
    const joints: IAutoMoviePhysicalJoint[] = [];
    for (const joint of input.profile.joints)
      if (subtree.has(joint.child) || subtree.has(joint.parent)) {
        subtree.add(joint.child);
        joints.push(joint);
      }
    const parent: string = joints[0]!.parent;
    // Each joint's world pose from its parent's and a relative rotation: the
    // seed's on the chain, the authored one below the foot.
    const compose = (
      poses: Record<string, IAutoMovieRigidTransform>,
      chain: boolean,
    ): void => {
      for (const joint of joints) {
        const onChain: boolean = input.chain.includes(joint.child);
        if (onChain !== chain) continue;
        const source: Readonly<Record<string, IAutoMovieRigidTransform>> =
          onChain ? input.seed : input.authored;
        const above: IAutoMovieRigidTransform | undefined = poses[joint.parent];
        if (!above || !source[joint.parent] || !source[joint.child]) continue;
        poses[joint.child] = AutoMovieEnginePhysicalSwingReference.compute({
          joints: [joint],
          base: above,
          actual: source,
          fit: source,
          share: 0,
        })[joint.child]!;
      }
    };
    const start: Record<string, IAutoMovieRigidTransform> = {
      ...input.seed,
      [parent]: input.base,
    };
    compose(start, true);
    compose(start, false);
    // The ankle's centre at the planned foot pose, the foot's endpoint on the
    // goal.
    const ankle: IAutoMoviePhysicalJoint = joints.find(
      (joint: IAutoMoviePhysicalJoint): boolean => joint.child === foot,
    )!;
    const footAt: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      input.goal,
      AutoMovieEngineQuaternion.rotateVector(
        input.rotation,
        input.localPoint ?? { x: 0, y: 0, z: 0 },
      ),
    );
    const centre: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      footAt,
      AutoMovieEngineQuaternion.rotateVector(input.rotation, ankle.childFrame.position),
    );
    // The joints above the ankle bring the shank's ankle anchor to it.
    const solved: IAutoMovieSolvePhysicalArticulationTargets.IResult =
      solvePhysicalArticulationTargets({
        profile: input.profile,
        bones: input.chain.slice(0, -1),
        targets: start,
        measure: (
          poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
        ): number[] => {
          const anchor: IAutoMovieVector3 = physicalSupportPoint(
            poses[ankle.parent]!,
            ankle.parentFrame.position,
          );
          return [
            anchor.x - centre.x,
            anchor.y - centre.y,
            anchor.z - centre.z,
          ];
        },
        iterations: input.iterations,
        tolerance: input.tolerance,
      });
    const out: Record<string, IAutoMovieRigidTransform> = {
      ...solved.targets,
    };
    // The leg's swivel about the hip-to-ankle line leaves the ankle's centre
    // where it is and turns the shank about it: the hip's orientation follows
    // from the foot's (Kajita et al., Section 2.5), so the swivel is the one,
    // nearest the seed's, at which the foot's rotation relative to the shank
    // has no part about an axis the ankle lacks.
    const hip: IAutoMovieVector3 = physicalSupportPoint(
      out[parent] ?? input.base,
      joints[0]!.parentFrame.position,
    );
    const line: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(centre, hip);
    const lacked: ("x" | "y" | "z")[] = (["x", "y", "z"] as const).filter(
      (axis: "x" | "y" | "z"): boolean =>
        !ankle.axes.some((entry): boolean => entry.axis === axis),
    );
    const above: string[] = input.chain.slice(0, -1);
    const swivel = (
      angle: number,
    ): Record<string, IAutoMovieRigidTransform> => {
      const turn: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
        AutoMovieEngineVector3.normalize(line),
        (angle * 180) / Math.PI,
      );
      const poses: Record<string, IAutoMovieRigidTransform> = { ...out };
      for (const bone of above)
        poses[bone] = {
          position: AutoMovieEngineVector3.add(
            hip,
            AutoMovieEngineQuaternion.rotateVector(
              turn,
              AutoMovieEngineVector3.subtract(out[bone]!.position, hip),
            ),
          ),
          rotation: AutoMovieEngineQuaternion.normalize(
            AutoMovieEngineQuaternion.multiply(turn, out[bone]!.rotation),
          ),
        };
      return poses;
    };
    const wanted = (
      poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
    ): IAutoMovieQuaternion =>
      AutoMovieEngineQuaternion.multiply(
        AutoMovieEngineQuaternion.inverse(
          AutoMovieEngineQuaternion.multiply(
            poses[ankle.parent]!.rotation,
            ankle.parentFrame.rotation,
          ),
        ),
        AutoMovieEngineQuaternion.multiply(input.rotation, ankle.childFrame.rotation),
      );
    const missing = (angle: number): number => {
      const q: IAutoMovieQuaternion = wanted(swivel(angle));
      const sign: number = q.w < 0 ? -1 : 1;
      return lacked.length === 1 ? sign * q[lacked[0]!] : 0;
    };
    if (lacked.length === 1 && AutoMovieEngineVector3.length(line) > 1e-9) {
      // The secant method from the seed's swivel, zero.
      let a: number = 0;
      let b: number = 0.05;
      let fa: number = missing(a);
      let fb: number = missing(b);
      for (let i: number = 0; i < 12 && Math.abs(fb) > 1e-12; i++) {
        if (!(Math.abs(fb - fa) > 1e-15)) break;
        const next: number = b - (fb * (b - a)) / (fb - fa);
        [a, fa] = [b, fb];
        b = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, next));
        fb = missing(b);
      }
      if (Math.abs(fb) < Math.abs(missing(0))) Object.assign(out, swivel(b));
    }
    // The ankle takes the planned foot's rotation relative to the shank,
    // admitted to its axes and limits; the foot hangs from the anchor.
    const shank: IAutoMovieRigidTransform = out[ankle.parent]!;
    const socket: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      shank.rotation,
      ankle.parentFrame.rotation,
    );
    const relative: IAutoMovieQuaternion = projectPhysicalJointRotation(
      ankle,
      wanted(out),
    );
    const turned: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(
      AutoMovieEngineQuaternion.multiply(
        AutoMovieEngineQuaternion.multiply(socket, relative),
        AutoMovieEngineQuaternion.inverse(ankle.childFrame.rotation),
      ),
    );
    out[foot] = {
      position: AutoMovieEngineVector3.subtract(
        physicalSupportPoint(shank, ankle.parentFrame.position),
        AutoMovieEngineQuaternion.rotateVector(turned, ankle.childFrame.position),
      ),
      rotation: turned,
    };
    compose(out, false);
    const result: Record<string, IAutoMovieRigidTransform> = {};
    for (const bone of subtree) if (out[bone]) result[bone] = out[bone]!;
    const reached: IAutoMovieVector3 = physicalSupportPoint(
      out[foot]!,
      input.localPoint,
    );
    return {
      targets: result,
      residual: Math.hypot(
        reached.x - input.goal.x,
        reached.y - input.goal.y,
        reached.z - input.goal.z,
      ),
    };
  }

  /**
   * How much further a swinging limb's lowest contact point hangs below its
   * endpoint at its planned attitude than when planted, metres, never negative:
   * the clearance a planned toe or heel would take, which the endpoint's goal
   * is raised by. The attitude is the plan's, not the foot's own, since a
   * swing's height and its foot's orientation are specified apart (Pratt et
   * al., M2V2, Section VII-D1): a foot pitched off its plan would otherwise
   * raise its own goal and chase it (design-4017-edge, Q2). A level swing foot,
   * planned at its planted attitude, hangs nothing.
   *
   * @param input The profile; the limb's contact carriers; their planned and
   *   planted world poses; and the limb's endpoint at each, world metres.
   * @returns The hang, metres.
   */
  export function hang(input: {
    profile: Pick<IAutoMoviePhysicalProfile, "segments" | "joints">;
    carriers: readonly string[];
    planned: (bone: string) => IAutoMovieRigidTransform | undefined;
    endpoint: IAutoMovieVector3;
    planted: (bone: string) => IAutoMovieRigidTransform | undefined;
    rest: IAutoMovieVector3;
  }): number {
    const below = (
      pose: (bone: string) => IAutoMovieRigidTransform | undefined,
      endpoint: IAutoMovieVector3,
    ): number => {
      let lowest: number = Infinity;
      for (const carrier of input.carriers) {
        const segment: IAutoMoviePhysicalSegment | undefined =
          input.profile.segments.find(
            (candidate: IAutoMoviePhysicalSegment): boolean =>
              candidate.bone === carrier,
          );
        const at: IAutoMovieRigidTransform | undefined = pose(carrier);
        if (!segment || !at) continue;
        for (const shape of physicalSupportFootprint.colliders(segment))
          lowest = Math.min(lowest, physicalShapeBoundsImplementation.physicalShapeBoundsLowest(at, shape));
      }
      return lowest === Infinity ? 0 : endpoint.y - lowest;
    };
    return Math.max(
      0,
      below(input.planned, input.endpoint) - below(input.planted, input.rest),
    );
  }
}

function computeSwingReference(input: {
  joints: readonly IAutoMoviePhysicalJoint[];
  base: IAutoMovieRigidTransform;
  actual: Readonly<Record<string, IAutoMovieRigidTransform>>;
  fit: Readonly<Record<string, IAutoMovieRigidTransform>>;
  share: number;
}): Record<string, IAutoMovieRigidTransform> {
  const share: number = Math.max(0, Math.min(1, input.share));
  const out: Record<string, IAutoMovieRigidTransform> = Object.create(null);
  const relative = (
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
    joint: IAutoMoviePhysicalJoint,
  ): IAutoMovieQuaternion =>
    AutoMovieEngineQuaternion.multiply(
      AutoMovieEngineQuaternion.inverse(
        AutoMovieEngineQuaternion.multiply(
          poses[joint.parent]!.rotation,
          joint.parentFrame.rotation,
        ),
      ),
      AutoMovieEngineQuaternion.multiply(
        poses[joint.child]!.rotation,
        joint.childFrame.rotation,
      ),
    );
  for (const joint of input.joints) {
    const parent: IAutoMovieRigidTransform = out[joint.parent] ?? input.base;
    const turn: IAutoMovieQuaternion = AutoMovieEngineQuaternion.slerp(
      relative(input.actual, joint),
      relative(input.fit, joint),
      share,
    );
    const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(
      AutoMovieEngineQuaternion.multiply(
        AutoMovieEngineQuaternion.multiply(
          AutoMovieEngineQuaternion.multiply(parent.rotation, joint.parentFrame.rotation),
          turn,
        ),
        AutoMovieEngineQuaternion.inverse(joint.childFrame.rotation),
      ),
    );
    const pivot: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      parent.position,
      AutoMovieEngineQuaternion.rotateVector(parent.rotation, joint.parentFrame.position),
    );
    out[joint.child] = {
      position: AutoMovieEngineVector3.subtract(
        pivot,
        AutoMovieEngineQuaternion.rotateVector(rotation, joint.childFrame.position),
      ),
      rotation,
    };
  }
  return out;
}
