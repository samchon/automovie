import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  clampJointToSkeleton,
  type curlChainUntilContact,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePhysicalProfile,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGrip } from "./HumanGrip";

/**
 * Two people's hands clasping each other, palm on palm: the open hand each
 * offers, the turn each hand takes in its palm's plane, chosen for both
 * together, and the partner's hand as the colliders the fingers close on.
 *
 * The offered hand is flat with the thumb's three joints extended to the end
 * of their ranges, the first web space opened to take the partner's hand,
 * the thumb clear of the fingers and of the partner's wrist before it closes
 * over the partner's hand (Napier 1956, the power grip's thumb closing
 * last). Measured on the sweep's bodies, a thumb extended at its base alone
 * lies 1 to 2 mm inside the partner's wrist at the turn both low elbows
 * take, and one at its resting flexion 9 mm inside.
 *
 * The palms' contact fixes each hand only up to a turn about its palm's
 * normal, and the two turns decide where each hand's fingers lie on the
 * other: with both hands along the line between the shoulders, each hand's
 * fingers run past the partner's palm onto the partner's wrist and forearm,
 * where a closing finger meets the forearm instead of wrapping the hand. The
 * pair of turns is therefore chosen as a grasp planner chooses a grasp: a
 * candidate whose open hand already intersects an obstacle is rejected before
 * closing (GraspIt!, Miller and Allen 2004, IEEE Robot. Autom. Mag.
 * 11(4):110), and among the rest the one the arms reach best is taken (Miller
 * et al. 2003, Automatic grasp planning using shape primitives). A turn is a
 * candidate for an arm only when the arm reaches it at the clasp and at the
 * pump's top and bottom (`REACHED`), and of those only the turns in the
 * lowest upper-arm band of the Rapid Upper Limb Assessment the arm attains
 * (`BANDS`), so no clearance is bought with a raised elbow or a wrist the
 * pump takes past its range. Here a pair
 * is clear when no phalanx of either open hand, the capsule the closing curl
 * moves (`HumanGrip.chain`), enters the other's forearm collider at the clasp;
 * a pair's error is the worse of the two arms' errors over the clasp and the
 * pump, the hand's miss plus the elbow's turn from its hanging hint
 * (`HumanGrasp.reachable`), so a clasp both arms take with the elbow low
 * ranks above one an arm reaches only by raising it; the smaller turns win
 * ties by a
 * hundredth of a degree per degree. When no pair is clear, the pair with the
 * largest clearance is taken. Both partners compute the same choice from the
 * same two standing postures, enumerating the pairs in the order of their
 * subject ids, so each hand's fingers close on the hand the other actually
 * shows.
 *
 * The two hands then close one after the other in the same order, the second
 * on the first's closed digits, since two hands closing on each other at once
 * have no contact to stop on: each phalanx stops on the partner's hand,
 * forearm or digits (`HumanGrip.close`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the open hand, why the turns are chosen together, the clearance test and its source, the ranking, the fallback and how both partners agree.
 * @evidence contracts/development/implementation.md#principled-implementation Collision-free grasp candidates ranked by reachability, the grasp planners' practice, on the body's own phalanx and forearm colliders.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The open shape, the joint choice, the ordered closure, the clearance and the colliders as five functions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pair is trusted without the clearance test; an unclear clasp is ranked by its clearance, not by a tolerance.
 * @evidence contracts/development/implementation.md#efficient-algorithms One arm fit per turn and person, then a constant clearance test per pair of turns, once per plan.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanGrasp.reachable` for every fit, `HumanGrip.chain` for the phalanges and `HumanColliders` for every distance and placement.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace HumanClasp {
  /** One partner's hand in the clasp. */
  export interface IHand {
    /** The person's subject id. */
    subject: string;

    /** The person's body. */
    body: IHumanBody;

    /** The standing posture the arm is fitted in. */
    posture: IHumanPosture;

    /** Where the palm faces, world unit vector. */
    palm: IAutoMovieVector3;

    /** Where the fingers point before the turn, world unit vector. */
    fingers: IAutoMovieVector3;
  }

  /** The clasp both partners take. */
  export interface IChoice {
    /** This person's grip: its turn, its wrist goal, its shown hand and its arm. */
    mine: HumanGrasp.IReach;

    /** The partner's grip, as the partner will take it. */
    theirs: HumanGrasp.IReach;

    /** The least gap of either open hand's phalanges to the other's forearm, metres. */
    clearance: number;
  }

  /**
   * The offered hand: flat, the thumb's three joints extended to the end of
   * the body's range.
   *
   * @param body The body.
   * @param side The hand.
   * @returns Clinical degrees of every digit bone of that hand.
   */
  export function open(
    body: IHumanBody,
    side: HumanHand.Side,
  ): IHumanPosture["joints"] {
    const joints: IHumanPosture["joints"] = {
      ...HumanHand.shape(side, "flat"),
    };
    for (const part of ["Metacarpal", "Proximal", "Distal"] as const) {
      const bone: AutoMovieHumanoidBone =
        `${side}Thumb${part}` as AutoMovieHumanoidBone;
      joints[bone] = [
        clampJointToSkeleton(
          { bone, flexion: -180, abduction: 0, twist: 0 },
          body.skeleton,
        ).flexion ?? 0,
        0,
        0,
      ];
    }
    return joints;
  }

  /**
   * The turns of a clasping hand about its palm's normal that {@link choose}
   * tries, degrees: half a quarter turn either way in steps of 7.5. A hand
   * turned farther than the wrist deviates is no longer offered along its
   * forearm, and the low elbow ends between two steps of 15 on the sweep's
   * bodies.
   */
  export const TURNS: readonly number[] = Array.from(
    { length: 13 },
    (_: unknown, i: number): number => -45 + 7.5 * i,
  );

  /**
   * The upper limits of the upper-arm bands of the Rapid Upper Limb
   * Assessment, degrees of the upper arm from hanging: 20, 45 and 90
   * (McAtamney and Corlett 1993, Applied Ergonomics 24(2):91). A higher band
   * is a costlier posture, so a turn an arm takes in a lower band outranks
   * any it takes in a higher one.
   */
  export const BANDS: readonly number[] = [20, 45, 90];

  /**
   * The largest miss of a fit that still counts as reaching the clasp and
   * the pump's top and bottom: 1, a degree of hand rotation plus a millimetre
   * of position, the bound the carried object's cases hold a grip to. A turn
   * past it leaves the wrist short at one end of the pump (the wrist's ulnar
   * deviation ends at 30 degrees and the pump takes about 5.5 more), where
   * the hand then swings 15 mm into the partner's forearm on the sweep's
   * bodies.
   */
  export const REACHED: number = 1;

  /**
   * Choose both hands' turns about their palms' normals, with each palm
   * socket on the meeting point.
   *
   * @param side The shaking hand of both.
   * @param meet The meeting point, world metres.
   * @param amplitude The pump's amplitude about the point, metres; its top and bottom are keys of every fit.
   * @param mine This person's hand.
   * @param theirs The partner's hand.
   * @returns Both grips and their clearance.
   */
  export function choose(
    side: HumanHand.Side,
    meet: IAutoMovieVector3,
    amplitude: number,
    mine: IHand,
    theirs: IHand,
  ): IChoice {
    const fits = (hand: IHand): HumanGrasp.IReach[] => {
      const posture: IHumanPosture = {
        ...hand.posture,
        joints: { ...hand.posture.joints, ...open(hand.body, side) },
      };
      const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
        hand.body,
        posture,
        side,
      );
      const facing: IAutoMovieQuaternion = HumanHand.rotation(side, {
        fingers: hand.fingers,
        palm: hand.palm,
      });
      return TURNS.map(
        (turn: number): HumanGrasp.IReach =>
          HumanGrasp.reachable(
            hand.body,
            posture,
            side,
            bend,
            (angle: number): HumanHand.IWrist =>
              HumanHand.place(
                hand.body,
                side,
                "palm",
                meet,
                Quaternion.normalize(
                  Quaternion.multiply(
                    Quaternion.fromAxisAngle(hand.palm, angle),
                    facing,
                  ),
                ),
                "flat",
              ),
            [0],
            (wrist: HumanHand.IWrist): HumanGrasp.IKey[] =>
              [-amplitude, amplitude].map(
                (lift: number): HumanGrasp.IKey => ({
                  posture,
                  wrist: {
                    point: { ...wrist.point, y: wrist.point.y + lift },
                    rotation: wrist.rotation,
                  },
                  bend,
                }),
              ),
            [turn],
          ),
      );
    };

    // Enumerate in subject order, so both partners walk the same pairs.
    const swapped: boolean = theirs.subject < mine.subject;
    const [one, two]: [IHand, IHand] = swapped
      ? [theirs, mine]
      : [mine, theirs];
    const a: HumanGrasp.IReach[] = fits(one);
    const b: HumanGrasp.IReach[] = fits(two);
    type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    const aBones: Bones[] = a.map(
      (r: HumanGrasp.IReach): Bones => poseBones(one.body, r.pose),
    );
    const bBones: Bones[] = b.map(
      (r: HumanGrasp.IReach): Bones => poseBones(two.body, r.pose),
    );
    // Each arm's admissible turns: those it reaches through the pump, and of
    // those the ones in the lowest upper-arm band any of them attains.
    const admitted = (
      reaches: HumanGrasp.IReach[],
      bones: Bones[],
    ): number[] => {
      const band = (index: number): number => {
        const upper: IAutoMovieVector3 = Vector3.subtract(
          bones[index]!.get(`${side}LowerArm`)!.worldPosition,
          bones[index]!.get(`${side}UpperArm`)!.worldPosition,
        );
        const raised: number =
          (Math.acos(
            Math.max(-1, Math.min(1, -upper.y / Vector3.length(upper))),
          ) *
            180) /
          Math.PI;
        const found: number = BANDS.findIndex(
          (limit: number): boolean => raised <= limit,
        );
        return found === -1 ? BANDS.length : found;
      };
      const all: number[] = reaches.map(
        (_: HumanGrasp.IReach, index: number): number => index,
      );
      const reached: number[] = all.filter(
        (index: number): boolean => reaches[index]!.miss <= REACHED,
      );
      if (reached.length === 0) return all;
      const lowest: number = Math.min(...reached.map(band));
      return reached.filter((index: number): boolean => band(index) === lowest);
    };
    const aAdmitted: number[] = admitted(a, aBones);
    const bAdmitted: number[] = admitted(b, bBones);
    let best: { i: number; j: number; clear: number; cost: number } | undefined;
    for (const i of aAdmitted)
      for (const j of bAdmitted) {
        const clear: number = Math.min(
          clearance(one.body, aBones[i]!, two.body, bBones[j]!, side),
          clearance(two.body, bBones[j]!, one.body, aBones[i]!, side),
        );
        const cost: number =
          Math.max(a[i]!.miss + a[i]!.departure, b[j]!.miss + b[j]!.departure) +
          0.01 * (Math.abs(a[i]!.turn) + Math.abs(b[j]!.turn));
        const better: boolean =
          best === undefined ||
          (clear >= 0 && best.clear < 0) ||
          (clear >= 0 && best.clear >= 0 && cost < best.cost) ||
          (clear < 0 && best.clear < 0 && clear > best.clear);
        if (better) best = { i, j, clear, cost };
      }
    const first: HumanGrasp.IReach = a[best!.i]!;
    const second: HumanGrasp.IReach = b[best!.j]!;
    return {
      mine: swapped ? second : first,
      theirs: swapped ? first : second,
      clearance: best!.clear,
    };
  }

  /**
   * The least gap from one hand's phalanges to another person's forearm
   * collider: each phalanx is the segment and radius the closing curl moves
   * (`HumanGrip.chain`), from its joint to the next, the last to the digit's
   * tip.
   *
   * @param body The hand's owner.
   * @param bones Their posed bones, world frame.
   * @param other The other person.
   * @param others The other person's posed bones, world frame.
   * @param side The hand, and the other person's forearm on the same side.
   * @returns Metres, negative inside.
   */
  export function clearance(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    other: IHumanBody,
    others: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: HumanHand.Side,
  ): number {
    const forearm: AutoMovieHumanoidBone = `${side}LowerArm`;
    const only: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      new Map([[forearm, others.get(forearm)!]]);
    let least: number = Infinity;
    for (const digit of HumanGrip.CLOSING.power) {
      const chain: curlChainUntilContact.IChain = HumanGrip.chain(
        body,
        side,
        digit,
      );
      chain.bones.forEach((bone: AutoMovieHumanoidBone, k: number): void => {
        const from: IAutoMovieResolvedBone = bones.get(bone)!;
        const next: AutoMovieHumanoidBone | undefined = chain.bones[k + 1];
        const to: IAutoMovieVector3 =
          next === undefined
            ? Vector3.add(
                from.worldPosition,
                Quaternion.rotateVector(from.worldRotation, chain.tip),
              )
            : bones.get(next)!.worldPosition;
        least = Math.min(
          least,
          HumanColliders.distanceToSegment(other, only, from.worldPosition, to)
            .distance - chain.radius,
        );
      });
    }
    return least;
  }

  /**
   * Close one partner's digits round the other's hand at the clasp. The two
   * hands close in the order of their subject ids: the first closes from its
   * open hand on the second's open hand, and the second then closes on the
   * first's closed hand, so neither hand's digits end inside the other's
   * (the curl stops each phalanx on what it meets). Both partners compute
   * both closures from the same choice, so each shows the hand the other
   * closed on.
   *
   * @param side The shaking hand of both.
   * @param choice The clasp.
   * @param mine This person's hand.
   * @param theirs The partner's hand.
   * @returns This person's closed digit angles, clinical degrees.
   */
  export function close(
    side: HumanHand.Side,
    choice: IChoice,
    mine: IHand,
    theirs: IHand,
  ): IHumanPosture["joints"] {
    const swapped: boolean = theirs.subject < mine.subject;
    const [one, two]: [IHand, IHand] = swapped
      ? [theirs, mine]
      : [mine, theirs];
    const [a, b]: [HumanGrasp.IReach, HumanGrasp.IReach] = swapped
      ? [choice.theirs, choice.mine]
      : [choice.mine, choice.theirs];
    const first: IHumanPosture["joints"] = HumanGrip.close(
      one.body,
      side,
      "power",
      a.shown,
      colliders(two.body, poseBones(two.body, b.pose), side),
      open(one.body, side),
    ).joints;
    if (!swapped) return first;
    const closed: IAutoMoviePose = {
      ...a.pose,
      joints: [
        ...a.pose.joints.filter(
          (j: IAutoMovieJointPose): boolean => first[j.bone] === undefined,
        ),
        ...(
          Object.entries(first) as [
            AutoMovieHumanoidBone,
            readonly [number, number, number],
          ][]
        ).map(
          ([bone, angles]): IAutoMovieJointPose => ({
            bone,
            flexion: angles[0],
            abduction: angles[1],
            twist: angles[2],
          }),
        ),
      ],
    };
    return HumanGrip.close(
      two.body,
      side,
      "power",
      b.shown,
      colliders(one.body, poseBones(one.body, closed), side),
      open(two.body, side),
    ).joints;
  }

  /**
   * A person's hand as the colliders another hand closes on: the hand, the
   * forearm and every digit on one side, placed by their posed bones.
   *
   * @param body The person.
   * @param bones Their posed bones, world frame.
   * @param side The hand.
   * @returns The placed colliders.
   */
  export function colliders(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: HumanHand.Side,
  ): curlChainUntilContact.ICollider[] {
    const digits: Set<AutoMovieHumanoidBone> = new Set(
      HumanGrip.CLOSING.power.flatMap(
        (digit: HumanGrip.Digit): AutoMovieHumanoidBone[] =>
          HumanGrip.bones(side, digit),
      ),
    );
    return HumanColliders.placed(body, bones)
      .filter(
        (p: HumanColliders.IPlaced): boolean =>
          p.bone === `${side}Hand` ||
          p.bone === `${side}LowerArm` ||
          digits.has(p.bone),
      )
      .flatMap((p: HumanColliders.IPlaced): curlChainUntilContact.ICollider[] =>
        p.shapes.map(
          (
            shape: IAutoMoviePhysicalProfile.IShape,
          ): curlChainUntilContact.ICollider => ({
            shape,
            frame: { position: p.pose.position, rotation: p.pose.rotation },
          }),
        ),
      );
  }
}
