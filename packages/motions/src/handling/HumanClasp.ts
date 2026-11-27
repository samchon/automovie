import { Quaternion, clampJointToSkeleton } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieCurlChainUntilContact,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanGrip,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePhysicalShape,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanHand } from "../posture/HumanHand";
import { placeHumanHandSurface } from "../posture/internal/placeHumanHandSurface";
import { poseBones } from "../posture/internal/poseBones";
import { HumanClaspCandidateFrames } from "./HumanClaspCandidateFrames";
import { HumanClaspClearance } from "./HumanClaspClearance";
import { HumanGraspSearch } from "./HumanGraspSearch";
import { HumanGrip } from "./HumanGrip";

/** The record of `IChooseBest`'s site. */
type IChooseBest = { i: number; j: number; clear: number; cost: number };

/**
 * Two people's hands clasping each other, palm on palm: the open hand each
 * offers, the turn each hand takes in its palm's plane, chosen for both
 * together, and the partner's hand as the colliders the fingers close on.
 *
 * The offered hand is flat with the thumb's three joints extended to the end of
 * their ranges, the first web space opened to take the partner's hand, the
 * thumb clear of the fingers and of the partner's wrist before it closes over
 * the partner's hand (Napier 1956, the power grip's thumb closing last).
 * Measured on the sweep's bodies, a thumb extended at its base alone lies 1 to
 * 2 mm inside the partner's wrist at the turn both low elbows take, and one at
 * its resting flexion 9 mm inside.
 *
 * The palms' contact fixes each hand only up to a turn about its palm's normal,
 * and the two turns decide where each hand's fingers lie on the other: with
 * both hands along the line between the shoulders, each hand's fingers run past
 * the partner's palm onto the partner's wrist and forearm, where a closing
 * finger meets the forearm instead of wrapping the hand. The pair of turns is
 * therefore chosen as a grasp planner chooses a grasp: a candidate whose open
 * hand already intersects an obstacle is rejected before closing (Miller and
 * Allen 2004, IEEE Robot. Autom. Mag. 11(4):110), and among the rest the one
 * the arms reach best is taken (Miller et al. 2003, Automatic grasp planning
 * using shape primitives). A turn is a candidate for an arm only when the arm
 * reaches it at the clasp and at the pump's top and bottom (`REACHED`), and of
 * those only the turns in the lowest upper-arm band of the Rapid Upper Limb
 * Assessment the arm attains (`BANDS`), so no clearance is bought with a raised
 * elbow or a wrist the pump takes past its range. Here a pair is clear when no
 * phalanx of either open hand, the capsule the closing curl moves
 * (`HumanGrip.chain`), enters the other's forearm collider at the clasp; a
 * pair's error is the worse of the two arms' errors over the clasp and the
 * pump, the hand's miss plus the elbow's turn from its hanging hint
 * (`HumanGrasp.reachable`), so a clasp both arms take with the elbow low ranks
 * above one an arm reaches only by raising it; the smaller turns win ties by a
 * hundredth of a millimetre per degree. When no pair is clear, the pair with
 * the largest clearance is taken. Both partners compute the same choice from
 * the same two standing postures, enumerating the pairs in the order of their
 * subject ids, so each hand's fingers close on the hand the other actually
 * shows.
 *
 * The two hands then close one after the other in the same order, the second on
 * the first's closed digits, since two hands closing on each other at once have
 * no contact to stop on: each phalanx stops on the partner's hand, forearm or
 * digits (`HumanGrip.close`).
 */
export namespace HumanClasp {
  /** One partner's hand in the clasp. */
  export interface IHand {
    /** The person's subject id. */
    subject: string;

    /** The person's body. */
    body: IAutoMovieMotionHumanBody;

    /** The standing posture the arm is fitted in. */
    posture: IAutoMovieMotionHumanPosture;

    /** Where the palm faces, world unit vector. */
    palm: IAutoMovieVector3;

    /** Where the fingers point before the turn, world unit vector. */
    fingers: IAutoMovieVector3;
  }

  /** The clasp both partners take. */
  export interface IChoice {
    /** This person's grip: its turn, its wrist goal, its shown hand and its arm. */
    mine: IAutoMovieMotionHumanGrasp.IReach;

    /** The partner's grip, as the partner will take it. */
    theirs: IAutoMovieMotionHumanGrasp.IReach;

    /**
     * The least gap of either open hand's phalanges to the other's forearm,
     * metres.
     */
    clearance: number;
  }

  /**
   * The offered hand: flat, the thumb's three joints extended to the end of the
   * body's range.
   *
   * @param body The body.
   * @param side The hand.
   * @returns Clinical degrees of every digit bone of that hand.
   */
  export function open(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanPosture["joints"] {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
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
   * The upper limits of the upper-arm bands of the Rapid Upper Limb Assessment,
   * degrees of the upper arm from hanging: 20, 45 and 90 (McAtamney and Corlett
   * 1993, Applied Ergonomics 24(2):91). A higher band is a costlier posture, so
   * a turn an arm takes in a lower band outranks any it takes in a higher one.
   */
  export const BANDS: readonly number[] = [20, 45, 90];

  /**
   * The largest miss of a fit that still counts as reaching the clasp and the
   * pump's top and bottom, millimetres of the hand (the position's miss plus
   * the rotation's arc over the hand's length, `HumanGraspSearch`): the limb
   * solver's own place tolerance (`HumanArmTrajectoryTerms.TOLERANCE`), the
   * miss it accepts as feasible. A turn past it leaves the wrist short at one
   * end of the pump (the wrist's ulnar deviation ends at 30 degrees and the
   * pump takes about 5.5 more).
   */
  export const REACHED: number = HumanArmTrajectoryTerms.TOLERANCE;

  /**
   * Choose both hands' turns about their palms' normals, with each palm socket
   * on the meeting point.
   *
   * @param side The shaking hand of both.
   * @param meet The meeting point, world metres.
   * @param amplitude The pump's amplitude about the point, metres; its top and
   *   bottom are keys of every fit.
   * @param mine This person's hand.
   * @param theirs The partner's hand.
   * @returns Both grips and their clearance.
   */
  export function choose(
    side: AutoMovieHumanSide,
    meet: IAutoMovieVector3,
    amplitude: number,
    mine: IHand,
    theirs: IHand,
  ): IChoice {
    const fits: (hand: IHand) => IAutoMovieMotionHumanGrasp.IReach[] = (
      hand: IHand,
    ): IAutoMovieMotionHumanGrasp.IReach[] => {
      const posture: IAutoMovieMotionHumanPosture = {
        ...hand.posture,
        joints: { ...hand.posture.joints, ...open(hand.body, side) },
      };
      const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
        hand.body,
        posture,
        side,
      );
      const search: ReturnType<typeof HumanGraspSearch> = HumanGraspSearch(
        hand.body,
        posture,
        side,
        bend,
      );
      const facing: IAutoMovieQuaternion = HumanHand.rotation(side, {
        fingers: hand.fingers,
        palm: hand.palm,
      });
      const palm: IAutoMovieVector3 = HumanHand.offset(
        hand.body,
        side,
        "palm",
        "flat",
      ).point;
      return TURNS.map(
        (turn: number): IAutoMovieMotionHumanGrasp.IReach =>
          search(
            (angle: number): IAutoMovieMotionHumanHand.IWrist =>
              placeHumanHandSurface(
                palm,
                meet,
                Quaternion.normalize(
                  Quaternion.multiply(
                    Quaternion.fromAxisAngle(hand.palm, angle),
                    facing,
                  ),
                ),
              ),
            [0],
            (
              wrist: IAutoMovieMotionHumanHand.IWrist,
            ): IAutoMovieMotionHumanGrasp.IKey[] =>
              [-amplitude, amplitude].map(
                (lift: number): IAutoMovieMotionHumanGrasp.IKey => ({
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
    const a: IAutoMovieMotionHumanGrasp.IReach[] = fits(one);
    const b: IAutoMovieMotionHumanGrasp.IReach[] = fits(two);
    const aFrames: ReturnType<typeof HumanClaspCandidateFrames> =
      HumanClaspCandidateFrames(one.body, side, a, REACHED, BANDS);
    const bFrames: ReturnType<typeof HumanClaspCandidateFrames> =
      HumanClaspCandidateFrames(two.body, side, b, REACHED, BANDS);
    const aAdmitted: number[] = aFrames.indices;
    const bAdmitted: number[] = bFrames.indices;
    const digitsOne: ReturnType<typeof HumanClaspClearance.prepareDigits> =
      HumanClaspClearance.prepareDigits(one.body, side);
    const digitsTwo: ReturnType<typeof HumanClaspClearance.prepareDigits> =
      HumanClaspClearance.prepareDigits(two.body, side);
    const aDigits: Map<number, readonly HumanClaspClearance.IPhalanx[]> =
      new Map(
        aAdmitted.map(
          (
            index: number,
          ): [number, readonly HumanClaspClearance.IPhalanx[]] => [
            index,
            digitsOne(aFrames.bones.get(index)!),
          ],
        ),
      );
    const bDigits: Map<number, readonly HumanClaspClearance.IPhalanx[]> =
      new Map(
        bAdmitted.map(
          (
            index: number,
          ): [number, readonly HumanClaspClearance.IPhalanx[]] => [
            index,
            digitsTwo(bFrames.bones.get(index)!),
          ],
        ),
      );
    const aForearms: Map<
      number,
      ReturnType<typeof HumanClaspClearance.forearm>
    > = new Map(
      aAdmitted.map(
        (
          index: number,
        ): [number, ReturnType<typeof HumanClaspClearance.forearm>] => [
          index,
          HumanClaspClearance.forearm(
            one.body,
            aFrames.bones.get(index)!,
            side,
          ),
        ],
      ),
    );
    const bForearms: Map<
      number,
      ReturnType<typeof HumanClaspClearance.forearm>
    > = new Map(
      bAdmitted.map(
        (
          index: number,
        ): [number, ReturnType<typeof HumanClaspClearance.forearm>] => [
          index,
          HumanClaspClearance.forearm(
            two.body,
            bFrames.bones.get(index)!,
            side,
          ),
        ],
      ),
    );
    let best: IChooseBest | undefined;
    for (const i of aAdmitted)
      for (const j of bAdmitted) {
        const clear: number = Math.min(
          HumanClaspClearance.between(aDigits.get(i)!, bForearms.get(j)!),
          HumanClaspClearance.between(bDigits.get(j)!, aForearms.get(i)!),
        );
        // Each hand's miss, millimetres of the hand, with its elbow's
        // departure from the hint carried the same way, as the arc the elbow
        // swings on its upper arm; the turns break ties.
        const cost: number =
          Math.max(
            a[i]!.miss + arc(a[i]!.departure, one.body.measure.upperArm),
            b[j]!.miss + arc(b[j]!.departure, two.body.measure.upperArm),
          ) +
          0.01 * (Math.abs(a[i]!.turn) + Math.abs(b[j]!.turn));
        const better: boolean =
          best === undefined ||
          (clear >= 0 && best.clear < 0) ||
          (clear >= 0 && best.clear >= 0 && cost < best.cost) ||
          (clear < 0 && best.clear < 0 && clear > best.clear);
        if (better) best = { i, j, clear, cost };
      }
    const first: IAutoMovieMotionHumanGrasp.IReach = a[best!.i]!;
    const second: IAutoMovieMotionHumanGrasp.IReach = b[best!.j]!;
    return {
      mine: swapped ? second : first,
      theirs: swapped ? first : second,
      clearance: best!.clear,
    };
  }

  /**
   * Close one partner's digits round the other's hand at the clasp. The two
   * hands close in the order of their subject ids: the first closes from its
   * open hand on the second's open hand, and the second then closes on the
   * first's closed hand, so neither hand's digits end inside the other's (the
   * curl stops each phalanx on what it meets). Both partners compute both
   * closures from the same choice, so each shows the hand the other closed on.
   *
   * @param side The shaking hand of both.
   * @param choice The clasp.
   * @param mine This person's hand.
   * @param theirs The partner's hand.
   * @returns This person's closed digit angles, clinical degrees.
   */
  export function close(
    side: AutoMovieHumanSide,
    choice: IChoice,
    mine: IHand,
    theirs: IHand,
  ): IAutoMovieMotionHumanPosture["joints"] {
    const swapped: boolean = theirs.subject < mine.subject;
    const [one, two]: [IHand, IHand] = swapped
      ? [theirs, mine]
      : [mine, theirs];
    const [a, b]: [
      IAutoMovieMotionHumanGrasp.IReach,
      IAutoMovieMotionHumanGrasp.IReach,
    ] = swapped ? [choice.theirs, choice.mine] : [choice.mine, choice.theirs];
    const requested: ReadonlySet<AutoMovieHumanoidBone> =
      HumanClaspClearance.bones(side);
    const first: IAutoMovieMotionHumanPosture["joints"] = HumanGrip.close(
      one.body,
      side,
      "power",
      a.shown,
      colliders(
        two.body,
        poseBones(two.body, b.pose, undefined, requested),
        side,
      ),
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
      colliders(
        one.body,
        poseBones(one.body, closed, undefined, requested),
        side,
      ),
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
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: AutoMovieHumanSide,
  ): IAutoMovieCurlChainUntilContact.ICollider[] {
    const digits: Set<AutoMovieHumanoidBone> = new Set(
      HumanGrip.CLOSING.power.flatMap(
        (digit: IAutoMovieMotionHumanGrip.Digit): AutoMovieHumanoidBone[] =>
          HumanGrip.bones(side, digit),
      ),
    );
    return HumanColliders.placed(body, bones)
      .filter(
        (p: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          p.bone === `${side}Hand` ||
          p.bone === `${side}LowerArm` ||
          digits.has(p.bone),
      )
      .flatMap(
        (
          p: IAutoMovieMotionHumanColliders.IPlaced,
        ): IAutoMovieCurlChainUntilContact.ICollider[] =>
          p.shapes.map(
            (
              shape: IAutoMoviePhysicalShape,
            ): IAutoMovieCurlChainUntilContact.ICollider => ({
              shape,
              frame: { position: p.pose.position, rotation: p.pose.rotation },
            }),
          ),
      );
  }
}

/**
 * An angle in degrees carried as the arc it swings at a length in metres,
 * millimetres.
 */
function arc(degrees: number, length: number): number {
  return ((degrees * Math.PI) / 180) * 1000 * length;
}
