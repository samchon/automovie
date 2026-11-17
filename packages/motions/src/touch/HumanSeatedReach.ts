import {
  Quaternion,
  Vector3,
  bracketedBisection,
  getConstraint,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeatedReach,
  IAutoMovieMotionMeetingRole,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";

/**
 * A seated reach with the trunk below the arm in task priority: the hand's
 * target first, and when the arm alone falls short, a lean of the trunk
 * forward, which the seat bears: the hips flex the trunk over the seat and
 * the spine's three joints flex above them, each within the flexion room
 * its range leaves. The joints share the lean in one share of each one's
 * room, and two seated partners in one share of each one's chain, the
 * joint-limit-weighted least-norm resolution of the redundancy (Chan and
 * Dubey 1995, "A weighted least-norm solution based scheme for avoiding
 * joint limits for redundant joint manipulators", IEEE Trans. Robot. Autom.
 * 11(2)): each joint's motion weighted by its range, so none reaches its
 * limit before another.
 *
 * A standing body leans none here: its reach stays its arm's, as the
 * standing laws already plan it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the priority, the joints that lean and their bound, the shared form with its source and what a standing body does.
 * @evidence contracts/development/design.md#principled-representation The lean is one share of each trunk joint's flexion room per seated role; the shared share is the weighted least-norm answer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The joints' rooms, the leaned point, the leaned posture, the shared meeting and one role's own share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A pair the full lean cannot bring together is refused by the meeting's own resolution, never stretched.
 */
export namespace HumanSeatedReach {
  /** The trunk's joints above the hips that flex a seated lean, from the lowest; a rig without one leans by the others. */
  export const SPINE: readonly AutoMovieHumanoidBone[] = [
    "spine",
    "chest",
    "upperChest",
  ];

  /**
   * The joints a seated role's trunk can still lean forward by: the hips,
   * their flexion range less the flexion the thigh and the trunk hold, and
   * each spine joint, its range less the flexion its two segments hold;
   * none for a standing role.
   *
   * @param role The role, its body, its posture, its bones and whether a seat bears it.
   * @returns The joints from the lowest, each with its room.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each joint's room and the standing case.
   * @evidence contracts/development/implementation.md#principled-implementation The hip flexion held is the angle between the thigh's line and the trunk's downward line; a spine joint's is the signed turn about the body's left from the segment below it to the one above; each room is the range table's flexion end less it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One angle per joint, one difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A joint past its range has no room, never a negative one.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The ranges are the engine's `getConstraint` on the body's rig.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function rooms(
    role: Pick<
      IAutoMovieMotionMeetingRole,
      "body" | "posture" | "bones" | "seated"
    >,
  ): IAutoMovieMotionHumanSeatedReach.IJoint[] {
    if (role.seated !== true) return [];
    const range = (bone: AutoMovieHumanoidBone): number | null =>
      getConstraint(
        bone,
        readHumanBone(role.body, bone)?.constraint ?? null,
      )?.flexion?.max ?? null;
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
        (bone: AutoMovieHumanoidBone, k: number): IAutoMovieMotionHumanSeatedReach.IJoint => ({
          bone,
          room: Math.max(0, (range(bone) ?? 0) - flexion(k + 1)),
        }),
      ),
    ];
    return joints.filter((j: IAutoMovieMotionHumanSeatedReach.IJoint): boolean => j.room > 0);
  }

  /**
   * A point of the trunk leaned forward by a share of each joint's room:
   * turned about the body's left through each joint in turn, from the
   * lowest, each joint carried by the turns below it.
   *
   * @param role The role's bones and posture.
   * @param joints The joints and their rooms (`rooms`).
   * @param point The point, world metres.
   * @param share The share of each room, in [0, 1].
   * @returns The leaned point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the turns, their order and sense.
   * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics of the trunk's flexion chain: each joint's turn about the body's left on the floor, from its heading, through the joint as the joints below have moved it, which turns the trunk's up toward its front.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One turn per joint.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the share is the caller's, in [0, 1].
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lean(
    role: Pick<IAutoMovieMotionMeetingRole, "bones" | "posture">,
    joints: readonly IAutoMovieMotionHumanSeatedReach.IJoint[],
    point: IAutoMovieVector3,
    share: number,
  ): IAutoMovieVector3 {
    return prepareLean(role, joints, point)(share);
  }

  /** Fixed role/chain geometry for one synchronous search; every share still performs its actual ordered turns. */
  function prepareLean(
    role: Pick<IAutoMovieMotionMeetingRole, "bones" | "posture">,
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
      (j: IAutoMovieMotionHumanSeatedReach.IJoint): IAutoMovieVector3 => role.bones.get(j.bone)!.worldPosition,
    );
    return (share: number): IAutoMovieVector3 => {
      let moved: IAutoMovieVector3 = point;
      const pivots: IAutoMovieVector3[] = [...original];
      joints.forEach((j: IAutoMovieMotionHumanSeatedReach.IJoint, k: number): void => {
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
      });
      return moved;
    };
  }

  /**
   * A posture leaned forward by a share of each joint's room: the whole
   * body pitched about the hips for the hip joints, which keeps the hips
   * on the seat (`AutoMovieMotionHumanLean.pivot`), and each spine joint's
   * flexion added.
   *
   * @param body The body.
   * @param posture The posture.
   * @param joints The joints and their rooms (`rooms`).
   * @param share The share of each room, in [0, 1].
   * @returns The leaned posture; the posture itself when no joint leans.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each joint does to the posture.
   * @evidence contracts/development/implementation.md#principled-implementation The same turns `lean` reads, written as the posture's pitch about the hips and its spine joints' clinical flexion.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pivot, one flexion per spine joint.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The rooms bound each joint, so no flexion passes its range.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `AutoMovieMotionHumanLean.pivot`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function posed(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    joints: readonly IAutoMovieMotionHumanSeatedReach.IJoint[],
    share: number,
  ): IAutoMovieMotionHumanPosture {
    if (joints.length === 0 || share === 0) return posture;
    const hips: IAutoMovieMotionHumanSeatedReach.IJoint | undefined = joints.find(
      (j: IAutoMovieMotionHumanSeatedReach.IJoint): boolean => j.bone === "hips",
    );
    const pitched: IAutoMovieMotionHumanPosture =
      hips === undefined
        ? posture
        : AutoMovieMotionHumanLean.pivot(body, posture, {
            pitch: share * hips.room,
            roll: 0,
          });
    const flexed: IAutoMovieMotionHumanPosture["joints"] = { ...pitched.joints };
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
   * @param sides Their arms, each with its acting shoulder, unleaned, in the same order.
   * @param resolve The meeting's resolution of two arms, throwing when they cannot meet.
   * @returns The resolution's answer for the leaned arms.
   * @throws {Error} The resolution's own error when even the full lean cannot bring the arms together.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the shared share and the error.
   * @evidence contracts/development/implementation.md#principled-implementation The arms alone first; failing that, the least share in [0, 1] of every seated joint's room by bisection on whether the arms leaned by it meet, the equal-share weighted least-norm resolution (Chan and Dubey 1995).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Try, test the full lean, bisect, resolve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pair the full lean cannot bring together rethrows the resolution's error; standing pairs never lean.
   * @evidence contracts/development/implementation.md#efficient-algorithms One resolution per bisection step, to a share whose lean moves a shoulder by less than the square root of machine epsilon of its distance to the hips.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The resolution and bisection remain their owners'; each role's fixed left axis and original joint pivots are prepared once for this synchronous search, while every share performs all actual ordered rotations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Prepared axes/pivots and rooms live only until goal returns or throws; only the caller's actual resolution result escapes, without a reader or pose history.
   */
  export function goal<
    Side extends { shoulder: IAutoMovieVector3 },
    Result = IAutoMovieVector3,
  >(
    roles: readonly [IAutoMovieMotionMeetingRole, IAutoMovieMotionMeetingRole],
    sides: readonly [Side, Side],
    resolve: (a: Side, b: Side) => Result,
  ): Result {
    const chains: [IAutoMovieMotionHumanSeatedReach.IJoint[], IAutoMovieMotionHumanSeatedReach.IJoint[]] = [rooms(roles[0]), rooms(roles[1])];
    const readers: readonly ((share: number) => IAutoMovieVector3)[] = [
      prepareLean(roles[0], chains[0], sides[0].shoulder),
      prepareLean(roles[1], chains[1], sides[1].shoulder),
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
    const share: number = bracketedBisection(
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
   * One seated role's own least share of its joints' rooms that brings a
   * point within its arm's limit: none when the arm reaches it, the whole
   * room when nothing less does.
   *
   * @param role The role.
   * @param shoulder Its acting shoulder joint, world metres.
   * @param point The point, world metres.
   * @param limit The arm's full reach, metres.
   * @returns The share and the joints it is a share of.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result's three cases.
   * @evidence contracts/development/implementation.md#principled-implementation The least share in [0, 1] at which the leaned shoulder's distance to the point is within the limit, by bisection; the distance falls as the trunk leans toward a point ahead.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two end tests and one bisection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A point beyond the full lean returns the whole room, and the arm's own fit reports the miss.
   * @evidence contracts/development/implementation.md#efficient-algorithms One distance per bisection step.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed role/chain axes and pivots are shared only within this synchronous bisection; every changed share retains the original actual turn sequence and distance measurement.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The fixed geometry reader ends with return or failure; returned room records and scalar share retain no frame reader or candidate history.
   */
  export function need(
    role: IAutoMovieMotionMeetingRole,
    shoulder: IAutoMovieVector3,
    point: IAutoMovieVector3,
    limit: number,
  ): IAutoMovieMotionHumanSeatedReach.INeedResult {
    const joints: IAutoMovieMotionHumanSeatedReach.IJoint[] = rooms(role);
    const read: (share: number) => IAutoMovieVector3 = prepareLean(role, joints, shoulder);
    const within = (share: number): boolean =>
      Vector3.length(
        Vector3.subtract(read(share), point),
      ) <= limit;
    if (joints.length === 0 || within(0)) return { share: 0, joints };
    if (!within(1)) return { share: 1, joints };
    return {
      share: bracketedBisection(
        (share: number): boolean => !within(share),
        0,
        1,
        resolution([[role, joints, shoulder]]),
      ),
      joints,
    };
  }

  /** The share step that moves no shoulder by more than the square root of machine epsilon of its distance to the hips. */
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
          ((joints.reduce((s: number, j: IAutoMovieMotionHumanSeatedReach.IJoint): number => s + j.room, 0) *
            Math.PI) /
            180),
      ),
    );
    return Number.EPSILON ** 0.5 / Math.max(swing, Number.MIN_VALUE);
  };
}
