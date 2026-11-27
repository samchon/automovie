import { Quaternion, Vector3, AutoMovieEngineMath, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeatedReach,
  IAutoMovieMotionMeetingRole,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readHumanBone } from "../../body/internal/readHumanBone";
import { AutoMovieMotionHumanLean } from "../../compose/internal/AutoMovieMotionHumanLean";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";

/** The record of `IGoal`'s site. */
type IGoal = { shoulder: IAutoMovieVector3 };

/** The alternatives of `PrepareLeanRole`'s site. */
type PrepareLeanRole = "bones" | "posture";

/** The alternatives of `LeanRole`'s site. */
type LeanRole = "bones" | "posture";

/** The alternatives of `RoomsRole`'s site. */
type RoomsRole = "body" | "posture" | "bones" | "seated";

/**
 * A seated reach with the trunk below the arm in task priority: the hand's
 * target first, and when the arm alone falls short, a lean of the trunk
 * forward, which the seat bears: the hips flex the trunk over the seat and the
 * spine's three joints flex above them, each within the flexion room its range
 * leaves. The joints share the lean in one share of each one's room, and two
 * seated partners in one share of each one's chain, the joint-limit-weighted
 * least-norm resolution of the redundancy (Chan and Dubey 1995, "A weighted
 * least-norm solution based scheme for avoiding joint limits for redundant
 * joint manipulators", IEEE Trans. Robot. Autom. 11(2)): each joint's motion
 * weighted by its range, so none reaches its limit before another.
 *
 * A standing body leans none here: its reach stays its arm's, as the standing
 * laws already plan it.
 */
export namespace HumanSeatedReach {
  /**
   * The trunk's joints above the hips that flex a seated lean, from the lowest;
   * a rig without one leans by the others.
   */
  export const SPINE: readonly AutoMovieHumanoidBone[] = [
    "spine",
    "chest",
    "upperChest",
  ];

  /**
   * The joints a seated role's trunk can still lean forward by: the hips, their
   * flexion range less the flexion the thigh and the trunk hold, and each spine
   * joint, its range less the flexion its two segments hold; none for a
   * standing role.
   *
   * @param role The role, its body, its posture, its bones and whether a seat
   *   bears it.
   * @returns The joints from the lowest, each with its room.
   */
  export function rooms(
    role: Pick<IAutoMovieMotionMeetingRole, RoomsRole>,
  ): IAutoMovieMotionHumanSeatedReach.IJoint[] {
    if (role.seated !== true) return [];
    const range = (bone: AutoMovieHumanoidBone): number | null =>
      AutoMovieEngineKinematics.getConstraint(bone, readHumanBone(role.body, bone)?.constraint ?? null)
        ?.flexion?.max ?? null;
    const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      role.bones.get(bone)!.worldPosition;
    const down: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(at("hips"), at("chest")),
    );
    const thigh: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(at("leftLowerLeg"), at("leftUpperLeg")),
    );
    const hip: number =
      (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(down, thigh)))) * 180) /
      Math.PI;
    // A spine joint's flexion held: the signed turn about the body's left
    // from the segment below it to the segment above it.
    const yaw: number = (role.posture.yaw * Math.PI) / 180;
    const left: IAutoMovieVector3 = {
      x: Math.cos(yaw),
      y: 0,
      z: -Math.sin(yaw),
    };
    // The spine joints the rig has (an upper chest is optional).
    const spine: readonly AutoMovieHumanoidBone[] = SPINE.filter(
      (bone: AutoMovieHumanoidBone): boolean => role.bones.has(bone),
    );
    const chain: readonly AutoMovieHumanoidBone[] = ["hips", ...spine, "neck"];
    const flexion = (k: number): number => {
      const below: IAutoMovieVector3 = Vector3.subtract(
        at(chain[k]!),
        at(chain[k - 1]!),
      );
      const above: IAutoMovieVector3 = Vector3.subtract(
        at(chain[k + 1]!),
        at(chain[k]!),
      );
      return (
        (Math.atan2(
          Vector3.dot(Vector3.cross(below, above), left),
          Vector3.dot(below, above),
        ) *
          180) /
        Math.PI
      );
    };
    const joints: IAutoMovieMotionHumanSeatedReach.IJoint[] = [
      { bone: "hips", room: Math.max(0, (range("leftUpperLeg") ?? hip) - hip) },
      ...spine.map(
        (
          bone: AutoMovieHumanoidBone,
          k: number,
        ): IAutoMovieMotionHumanSeatedReach.IJoint => ({
          bone,
          room: Math.max(0, (range(bone) ?? 0) - flexion(k + 1)),
        }),
      ),
    ];
    return joints.filter(
      (j: IAutoMovieMotionHumanSeatedReach.IJoint): boolean => j.room > 0,
    );
  }

  /**
   * A point of the trunk leaned forward by a share of each joint's room: turned
   * about the body's left through each joint in turn, from the lowest, each
   * joint carried by the turns below it.
   *
   * @param role The role's bones and posture.
   * @param joints The joints and their rooms (`rooms`).
   * @param point The point, world metres.
   * @param share The share of each room, in [0, 1].
   * @returns The leaned point.
   */
  export function lean(
    role: Pick<IAutoMovieMotionMeetingRole, LeanRole>,
    joints: readonly IAutoMovieMotionHumanSeatedReach.IJoint[],
    point: IAutoMovieVector3,
    share: number,
  ): IAutoMovieVector3 {
    return prepareLean(role, joints, point)(share);
  }

  /**
   * Fixed role/chain geometry for one synchronous search; every share still
   * performs its actual ordered turns.
   */
  function prepareLean(
    role: Pick<IAutoMovieMotionMeetingRole, PrepareLeanRole>,
    joints: readonly IAutoMovieMotionHumanSeatedReach.IJoint[],
    point: IAutoMovieVector3,
  ): (share: number) => IAutoMovieVector3 {
    // The body's left on the floor, from its heading: +X when it faces +Z.
    const yaw: number = (role.posture.yaw * Math.PI) / 180;
    const left: IAutoMovieVector3 = {
      x: Math.cos(yaw),
      y: 0,
      z: -Math.sin(yaw),
    };
    const original: IAutoMovieVector3[] = joints.map(
      (j: IAutoMovieMotionHumanSeatedReach.IJoint): IAutoMovieVector3 =>
        role.bones.get(j.bone)!.worldPosition,
    );
    return (share: number): IAutoMovieVector3 => {
      let moved: IAutoMovieVector3 = point;
      const pivots: IAutoMovieVector3[] = [...original];
      joints.forEach(
        (j: IAutoMovieMotionHumanSeatedReach.IJoint, k: number): void => {
          const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
            left,
            share * j.room,
          );
          const about: IAutoMovieVector3 = pivots[k]!;
          const carry = (p: IAutoMovieVector3): IAutoMovieVector3 =>
            Vector3.add(
              about,
              Quaternion.rotateVector(turn, Vector3.subtract(p, about)),
            );
          moved = carry(moved);
          for (let above: number = k + 1; above < pivots.length; above++)
            pivots[above] = carry(pivots[above]!);
        },
      );
      return moved;
    };
  }

  /**
   * Use the placed body's actual flexion charts when the caller knows the
   * moving shoulder.
   */
  function shoulderAt(
    role: IAutoMovieMotionMeetingRole,
    joints: readonly IAutoMovieMotionHumanSeatedReach.IJoint[],
    original: IAutoMovieVector3,
    shoulder?: AutoMovieHumanoidBone,
  ): (share: number) => IAutoMovieVector3 {
    const entry: IAutoMovieMotionHumanPosture | undefined = role.entry?.posture;
    if (shoulder === undefined || entry === undefined || joints.length === 0)
      return prepareLean(role, joints, original);
    const read: ReturnType<typeof HumanTrunk.prepareResolve> =
      HumanTrunk.prepareResolve(
        role.body,
        new Set<AutoMovieHumanoidBone>([shoulder]),
      );
    const workspace: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    return (share: number): IAutoMovieVector3 =>
      share === 0
        ? original
        : read(posed(role.body, entry, joints, share), workspace).get(shoulder)!
            .worldPosition;
  }

  /**
   * A posture leaned forward by a share of each joint's room: the whole body
   * pitched about the hips for the hip joints, which keeps the hips on the seat
   * (`AutoMovieMotionHumanLean.pivot`), and each spine joint's flexion added.
   *
   * @param body The body.
   * @param posture The posture.
   * @param joints The joints and their rooms (`rooms`).
   * @param share The share of each room, in [0, 1].
   * @returns The leaned posture; the posture itself when no joint leans.
   */
  export function posed(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    joints: readonly IAutoMovieMotionHumanSeatedReach.IJoint[],
    share: number,
  ): IAutoMovieMotionHumanPosture {
    if (joints.length === 0 || share === 0) return posture;
    const hips: IAutoMovieMotionHumanSeatedReach.IJoint | undefined =
      joints.find(
        (j: IAutoMovieMotionHumanSeatedReach.IJoint): boolean =>
          j.bone === "hips",
      );
    const pitched: IAutoMovieMotionHumanPosture =
      hips === undefined
        ? posture
        : AutoMovieMotionHumanLean.pivot(body, posture, {
            pitch: share * hips.room,
            roll: 0,
          });
    const flexed: IAutoMovieMotionHumanPosture["joints"] = {
      ...pitched.joints,
    };
    for (const j of joints) {
      if (j.bone === "hips") continue;
      const held: readonly [number, number, number] = flexed[j.bone] ?? [
        0, 0, 0,
      ];
      flexed[j.bone] = [held[0] + share * j.room, held[1], held[2]];
    }
    return { ...pitched, joints: flexed };
  }

  /**
   * Where two roles' arms meet, with each seated role's trunk leaned by the
   * least common share of its joints' rooms that lets the arms meet.
   *
   * @param roles The two roles, in the meeting's order.
   * @param sides Their arms, each with its acting shoulder, unleaned, in the
   *   same order.
   * @param resolve The meeting's resolution of two arms, throwing when they
   *   cannot meet.
   * @param shoulder The acting joint when the authored body's exact shoulder
   *   path is needed.
   * @returns The resolution's answer for the leaned arms.
   * @throws {Error} The resolution's own error when even the full lean cannot
   *   bring the arms together.
   */
  export function goal<Side extends IGoal, Result = IAutoMovieVector3>(
    roles: readonly [IAutoMovieMotionMeetingRole, IAutoMovieMotionMeetingRole],
    sides: readonly [Side, Side],
    resolve: (a: Side, b: Side) => Result,
    shoulder?: AutoMovieHumanoidBone,
  ): Result {
    const chains: [
      IAutoMovieMotionHumanSeatedReach.IJoint[],
      IAutoMovieMotionHumanSeatedReach.IJoint[],
    ] = [rooms(roles[0]), rooms(roles[1])];
    const readers: readonly ((share: number) => IAutoMovieVector3)[] = [
      shoulderAt(roles[0], chains[0], sides[0].shoulder, shoulder),
      shoulderAt(roles[1], chains[1], sides[1].shoulder, shoulder),
    ];
    const leaned = (share: number): [Side, Side] =>
      [0, 1].map(
        (i: number): Side => ({
          ...sides[i]!,
          shoulder: readers[i]!(share),
        }),
      ) as [Side, Side];
    const at = (share: number): Result => {
      const pair: [Side, Side] = leaned(share);
      return resolve(pair[0], pair[1]);
    };
    const meets = (share: number): boolean => {
      try {
        at(share);
        return true;
      } catch {
        return false;
      }
    };

    // The arms alone first; a pair the full lean cannot bring together
    // throws the resolution's own error from the full lean.
    if (meets(0)) return at(0);
    if (!meets(1)) return at(1);
    const share: number = AutoMovieEngineMath.bracketedBisection(
      (s: number): boolean => !meets(s),
      0,
      1,
      resolution([
        [roles[0], chains[0], sides[0].shoulder],
        [roles[1], chains[1], sides[1].shoulder],
      ]),
    );
    return at(share);
  }

  /**
   * One seated role's own least share of its joints' rooms that brings a point
   * within its arm's limit: none when the arm reaches it, the closest shoulder
   * position when the full flexion arc falls short.
   *
   * @param role The role.
   * @param shoulder Its acting shoulder joint, world metres.
   * @param point The point, world metres.
   * @param limit The arm's full reach, metres.
   * @param joint The acting joint when the authored body's exact shoulder path
   *   is needed.
   * @returns The share and the joints it is a share of.
   */
  export function need(
    role: IAutoMovieMotionMeetingRole,
    shoulder: IAutoMovieVector3,
    point: IAutoMovieVector3,
    limit: number,
    joint?: AutoMovieHumanoidBone,
  ): IAutoMovieMotionHumanSeatedReach.INeedResult {
    const joints: IAutoMovieMotionHumanSeatedReach.IJoint[] = rooms(role);
    const read: (share: number) => IAutoMovieVector3 = shoulderAt(
      role,
      joints,
      shoulder,
      joint,
    );
    const distance = (share: number): number =>
      Vector3.distance(read(share), point);
    if (joints.length === 0 || distance(0) <= limit)
      return { share: 0, joints };
    const width: number = resolution([[role, joints, shoulder]]);
    let high: number = 1;
    if (distance(high) > limit) {
      // The shoulder follows an arc. A deep bend may carry it below and
      // away from a wrist it could reach earlier on that same arc.
      high = nearest(distance, width, limit);
      if (distance(high) > limit) return { share: high, joints };
    }
    return {
      share: AutoMovieEngineMath.bracketedBisection(
        (share: number): boolean => distance(share) > limit,
        0,
        high,
        width,
      ),
      joints,
    };
  }

  /**
   * The share step that moves no shoulder by more than the square root of
   * machine epsilon of its distance to the hips.
   */
  const resolution = (
    arms: readonly (readonly [
      Pick<IAutoMovieMotionMeetingRole, "bones">,
      readonly IAutoMovieMotionHumanSeatedReach.IJoint[],
      IAutoMovieVector3,
    ])[],
  ): number => {
    const swing: number = Math.max(
      ...arms.map(
        ([role, joints, shoulder]): number =>
          Vector3.length(
            Vector3.subtract(shoulder, role.bones.get("hips")!.worldPosition),
          ) *
          ((joints.reduce(
            (s: number, j: IAutoMovieMotionHumanSeatedReach.IJoint): number =>
              s + j.room,
            0,
          ) *
            Math.PI) /
            180),
      ),
    );
    return Number.EPSILON ** 0.5 / Math.max(swing, Number.MIN_VALUE);
  };
}

/**
 * Find a reachable witness on the flexion arc, or its closest approach if it
 * misses.
 */
function nearest(
  distance: (share: number) => number,
  width: number,
  limit: number,
): number {
  const golden: number = (Math.sqrt(5) - 1) / 2;
  let low: number = 0;
  let high: number = 1;
  let left: number = high - golden * (high - low);
  let right: number = low + golden * (high - low);
  let a: number = distance(left);
  let b: number = distance(right);
  while (high - low > width && Math.min(a, b) > limit) {
    if (a <= b) {
      high = right;
      right = left;
      b = a;
      left = high - golden * (high - low);
      a = distance(left);
    } else {
      low = left;
      left = right;
      a = b;
      right = low + golden * (high - low);
      b = distance(right);
    }
  }
  return a <= b ? left : right;
}
