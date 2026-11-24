import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanLeanInto,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRange,
  IAutoMovieMotionHumanReach,
  IAutoMovieMotionHumanRise,
  IAutoMovieMotionHumanTouchStance,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanLeanInto } from "./AutoMovieMotionHumanLeanInto";
import { AutoMovieMotionHumanLeg } from "./AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanRange } from "./AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanReach } from "./AutoMovieMotionHumanReach";
import { AutoMovieMotionHumanRise } from "./AutoMovieMotionHumanRise";

/**
 * What the body behind the arm does so a hand reaches a region its arm alone
 * does not: the shoulder girdle lifted and a rise onto the toes for a region
 * above the shoulder, then a lean from the hips for what is still beyond the
 * arm.
 *
 * A person reaching up to a taller person's face, or to a shelf, lifts the
 * shoulder with the arm (the scapula turns up as the arm is raised, Inman,
 * Saunders and Abbott 1944) and then raises the heels, because leaning forward
 * lowers the shoulder and takes it away from a place above it. Each moves by
 * the least angle that brings the wrist within the kept share of the arm, and
 * no further than the shoulder needs to come level with the wrist or than its
 * limit (`GIRDLE`, `RAISE`). What remains is leaned into
 * (`AutoMovieMotionHumanLeanInto`). A region off to the side that the forward
 * lean leaves out of reach is turned toward first: the trunk twists about its
 * long axis by the heading's angle to the line from the shoulder to the wrist,
 * shared by the lumbar and thoracic spine within their twist ranges, as a
 * person turns the chest toward a hand reaching across the body. The lean,
 * solved again on the turned trunk, refuses a region still out of reach at its
 * limit. Two hands' regions off to one side (`faces`) are turned toward from
 * the start, the leaned trunk facing their middle from the shoulders, the turn
 * and the lean solved together to their fixed point, so both arms reach from
 * that side and neither crosses the body.
 */
export namespace AutoMovieMotionHumanTouchStance {
  /**
   * The most the heels rise, degrees (provisional, the kiss law's limit: past
   * it the foot stands on the toes' tips).
   */
  export const RAISE: number = 35;

  /**
   * The share of the shoulder girdle's range of elevation a reach lifts it by
   * at most (provisional: Inman, Saunders and Abbott 1944 give the scapula a
   * third of the arm's elevation; the share was not read from a source).
   */
  export const GIRDLE: IAutoMovieMotionHumanRange.Level = "half";

  /**
   * Solve the stance of a stroke.
   *
   * @param props The body, the standing posture, the feet, the hand, the share
   *   and the wrist's goal.
   * @returns The stance.
   * @throws {HumanRefusal} When the wrist is beyond the kept share at the
   *   lean's limit, on the first read of the lean.
   */
  export function solve(
    props: IAutoMovieMotionHumanTouchStance.IProps,
  ): IAutoMovieMotionHumanTouchStance.IStance {
    const { body, standing, feet } = props;
    const shoulder: "leftShoulder" | "rightShoulder" = `${props.side}Shoulder`;
    const checkReach: ReturnType<
      typeof AutoMovieMotionHumanReach.prepareCheck
    > = AutoMovieMotionHumanReach.prepareCheck(body, `${props.side}Arm`);

    // A posture with the working girdle lifted and the heels raised.
    const moved: (
      posture: IAutoMovieMotionHumanPosture,
      girdle: number,
      degrees: number,
      ankles?: IAutoMovieMotionHumanRise.Stance,
      share?: number,
    ) => IAutoMovieMotionHumanPosture = (
      posture: IAutoMovieMotionHumanPosture,
      girdle: number,
      degrees: number,
      ankles: IAutoMovieMotionHumanRise.Stance | undefined = feet,
      share: number = 1,
    ): IAutoMovieMotionHumanPosture => {
      posture = props.girdles?.(posture, share) ?? posture;
      const was: readonly [number, number, number] = posture.joints[
        shoulder
      ] ?? [0, 0, 0];
      return {
        ...posture,
        root:
          ankles === undefined || degrees === 0
            ? posture.root
            : Vector3.add(
                posture.root,
                AutoMovieMotionHumanRise.lift(body, ankles, degrees),
              ),
        joints:
          girdle === 0
            ? posture.joints
            : {
                ...posture.joints,
                [shoulder]: [was[0], was[1] + girdle, was[2]],
              },
      };
    };

    // The trunk turned about its long axis, the lumbar and the thoracic spine
    // each taking the share of the turn their own twist range holds.
    const twisted = (
      posture: IAutoMovieMotionHumanPosture,
      degrees: number,
    ): IAutoMovieMotionHumanPosture => {
      if (degrees === 0) return posture;
      const motion: IAutoMovieMotionHumanRange.Motion =
        degrees > 0 ? "external" : "internal";
      const spans: readonly number[] = TWISTED.map(
        (bone: TwistedBone): number =>
          AutoMovieMotionHumanRange.degrees(bone, motion, "full"),
      );
      const total: number = spans.reduce(
        (sum: number, span: number): number => sum + span,
        0,
      );
      const joints: IAutoMovieMotionHumanPosture["joints"] = {
        ...posture.joints,
      };
      TWISTED.forEach((bone: TwistedBone, k: number): void => {
        const was: readonly [number, number, number] = joints[bone] ?? [
          0, 0, 0,
        ];
        joints[bone] = [was[0], was[1], was[2] + (degrees * spans[k]!) / total];
      });
      return { ...posture, joints };
    };

    // The turn toward a wrist off to the side: the heading's angle to the
    // line from the shoulder to the wrist across the floor, positive toward
    // the left as the spine's twist is, within the two bones' whole range.
    const toward = (posture: IAutoMovieMotionHumanPosture): number => {
      const wrist: IAutoMovieVector3 = props.wrist(posture, 0);
      return angleTo(
        posture,
        checkReach(posture, wrist, prepareHumanPoseResolution()).root,
        wrist,
      );
    };

    // The heading's angle to the line from a point to another across the
    // floor, within the two bones' whole range.
    const angleTo = (
      posture: IAutoMovieMotionHumanPosture,
      from: IAutoMovieVector3,
      point: IAutoMovieVector3,
    ): number => {
      const yaw: number = (posture.yaw * Math.PI) / 180;
      const dx: number = point.x - from.x;
      const dz: number = point.z - from.z;
      const left: number = dx * Math.cos(yaw) - dz * Math.sin(yaw);
      const ahead: number = dx * Math.sin(yaw) + dz * Math.cos(yaw);
      const angle: number = (Math.atan2(left, ahead) * 180) / Math.PI;
      const range: number = TWISTED.reduce(
        (sum: number, bone: TwistedBone): number =>
          sum +
          Math.abs(
            AutoMovieMotionHumanRange.degrees(
              bone,
              angle > 0 ? "external" : "internal",
              "full",
            ),
          ),
        0,
      );
      return Math.max(-range, Math.min(range, angle));
    };

    // The middle of the shoulder joints on a posture, world metres.
    const shoulders = (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieVector3 => {
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, resolveHumanPosture(body, posture), undefined, ARMS);
      return Vector3.lerp(
        bones.get("leftUpperArm")!.worldPosition,
        bones.get("rightUpperArm")!.worldPosition,
        0.5,
      );
    };

    // The worst of the stroke's start, middle and end on a posture: how far
    // the wrist lies beyond the kept share, and how far above the shoulder.
    const probes: readonly number[] = props.fixed === true ? [0] : [0, 0.5, 1];
    const reach: (posture: IAutoMovieMotionHumanPosture) => IReach = (
      posture: IAutoMovieMotionHumanPosture,
    ): IReach => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      let worst: IReach = { beyond: -Infinity, above: 0 };
      for (const progress of probes) {
        const wrist: IAutoMovieVector3 = props.wrist(posture, progress);
        const check: IAutoMovieMotionHumanReach.ICheck = checkReach(
          posture,
          wrist,
          resolution,
        );
        const beyond: number = check.distance - props.share * check.length;
        if (beyond > worst.beyond)
          worst = { beyond, above: wrist.y - check.root.y };
      }
      return worst;
    };

    // The girdle first, as it rises with the arm, then the heels.
    const girdle: number = least(
      AutoMovieMotionHumanRange.degrees(shoulder, "abduction", GIRDLE),
      (degrees: number): IReach => reach(moved(standing, degrees, 0)),
    );
    const raise: number =
      feet === undefined
        ? 0
        : least(
            RAISE,
            (degrees: number): IReach =>
              reach(moved(standing, girdle, degrees)),
          );

    const upright: IAutoMovieMotionHumanPosture = moved(
      standing,
      girdle,
      raise,
    );
    const leanOn = (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanLeanInto.ILean =>
      AutoMovieMotionHumanLeanInto.solve({
        body,
        standing: posture,
        ...(props.balance === true ? { balance: true } : {}),
        side: props.side,
        share: props.share,
        wrist: props.wrist,
        ...(props.arm === undefined ? {} : { arm: props.arm }),
        refuse: props.refuse,
      });

    // Two hands' regions off to one side are faced first (`faces`): the trunk
    // turns toward their middle from the pelvis, so both arms reach from that
    // side. Otherwise the stance is chosen between two candidates in this
    // order (`choose`): the forward lean, then the lean on a trunk turned
    // toward a wrist off to the side, by the heading's angle to the line from
    // the shoulder to the wrist; the turned lean refuses what is still out of
    // reach.
    const leaned = (turned: number): ITurned => {
      const on: IAutoMovieMotionHumanPosture = twisted(upright, turned);
      const solved: IAutoMovieMotionHumanLeanInto.ILean = leanOn(on);
      return { turn: turned, lean: solved, arrival: solved.pitch(on, 0) };
    };
    const first: ITurned =
      props.faces !== undefined
        ? leaned(angleTo(upright, upright.root, props.faces))
        : choose<Facing, ITurned>({
            candidates: ["ahead", "turned"],
            reach: (facing: Facing): ITurned =>
              leaned(facing === "ahead" ? 0 : toward(upright)),
          });
    let turn: number = first.turn;
    let lean: IAutoMovieMotionHumanLeanInto.ILean = first.lean;
    let arrival: number = first.arrival;
    // The lean pitches the trunk along the pelvis's heading, not the turned
    // chest's, so the shoulders it carries forward see the two regions'
    // middle off to the side again: a disarm's leaned shoulders saw it at 40
    // degrees when the trunk had turned 18 toward it from the pelvis, and
    // the far arm crossed the chest. The turn is therefore the one the
    // leaned body faces the middle with, a fixed point of turning and
    // leaning (successive substitution), read from the shoulders' middle.
    if (props.faces !== undefined)
      for (let pass: number = 0; pass < FACING; ++pass) {
        const leaned: IAutoMovieMotionHumanPosture = lean.tip(
          twisted(upright, turn),
          arrival,
        );
        const next: number = angleTo(leaned, shoulders(leaned), props.faces);
        if (Math.abs(next - turn) <= SETTLED) break;
        turn = next;
        lean = leanOn(twisted(upright, turn));
        arrival = lean.pitch(twisted(upright, turn), 0);
      }
    const risen: IAutoMovieMotionHumanPosture = twisted(upright, turn);
    const leaning: boolean =
      arrival > 0 ||
      probes
        .slice(1)
        .some((progress: number): boolean => lean.pitch(risen, progress) > 0);
    const tipped: IAutoMovieMotionHumanPosture = lean.tip(risen, arrival);
    const reached: IAutoMovieMotionHumanPosture =
      feet !== undefined && raise > 0
        ? planted(tipped, feet, raise)
        : leaning
          ? { ...tipped, root: resolveHumanPosture.lower(body, tipped).root }
          : risen;
    return {
      girdle,
      raise,
      leaning,
      risen,
      reached,
      primitives: (
        clock: IAutoMovieMotionClock,
        correction?: IAutoMovieMotionHumanTouchStance.ICorrection,
      ): IAutoMovieMotionHumanPrimitive[] => {
        if (
          props.girdles === undefined &&
          girdle === 0 &&
          raise === 0 &&
          turn === 0 &&
          props.fixed !== true &&
          correction === undefined
        )
          return leaning ? [lean.primitive(clock)] : [];
        if (
          props.girdles === undefined &&
          girdle === 0 &&
          raise === 0 &&
          turn === 0 &&
          !leaning
        )
          return correction === undefined
            ? []
            : [
                {
                  channels: [correction.channel],
                  from: 0,
                  to: clock.duration,
                  write: correction.write,
                },
              ];
        const share: (seconds: number) => number = (seconds: number): number =>
          clock.envelope(["start", "ready"], ["relax", "end"], seconds);
        const channels: AutoMovieMotionHumanChannel[] =
          raise > 0
            ? ["root", "trunk", "leftLeg", "rightLeg"]
            : leaning
              ? ["root", "trunk"]
              : ["trunk"];
        if (correction !== undefined && !channels.includes(correction.channel))
          channels.push(correction.channel);
        return [
          {
            channels,
            from: 0,
            to: clock.duration,
            write: (
              posture: IAutoMovieMotionHumanPosture,
              seconds: number,
              _before?: IAutoMovieMotionHumanPrimitive.Reader,
              resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
              projection?: Parameters<
                IAutoMovieMotionHumanPrimitive["write"]
              >[4],
            ): IAutoMovieMotionHumanPosture => {
              const k: number = share(seconds);
              const degrees: number =
                raise * (props.heels?.(clock, seconds) ?? k);
              const ankles: IAutoMovieMotionHumanRise.Stance | undefined =
                degrees === 0
                  ? undefined
                  : (props.placements?.(posture) ?? feet);
              const up: IAutoMovieMotionHumanPosture = twisted(
                moved(posture, girdle * k, degrees, ankles, k),
                turn * k,
              );

              // The lean is read at the full rise, so its angle does not
              // change with the share of the rise shown.
              const leaned: IAutoMovieMotionHumanPosture = leaning
                ? lean.tip(
                    up,
                    k *
                      (props.fixed === true
                        ? arrival
                        : lean.pitch(
                            twisted(
                              moved(posture, girdle, raise, ankles),
                              turn,
                            ),
                            clock.progress("strokeStart", "strokeEnd", seconds),
                            resolution,
                          )),
                  )
                : up;
              const settled: IAutoMovieMotionHumanPosture =
                ankles !== undefined
                  ? planted(leaned, ankles, degrees, resolution)
                  : leaning
                    ? {
                        ...leaned,
                        root: resolveHumanPosture.lower(
                          body,
                          leaned,
                          undefined,
                          resolution,
                        ).root,
                      }
                    : leaned;
              return correction === undefined
                ? settled
                : correction.write(
                    settled,
                    seconds,
                    _before,
                    resolution,
                    projection,
                  );
            },
          },
        ];
      },
    };

    /** Fits the same raised feet for the planned key and for display. */
    function planted(
      posture: IAutoMovieMotionHumanPosture,
      ankles: IAutoMovieMotionHumanRise.Stance,
      degrees: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): IAutoMovieMotionHumanPosture {
      const left: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanLeg.goal(
        body,
        posture,
        "left",
        AutoMovieMotionHumanRise.foot(body, "left", ankles.left, degrees),
        true,
      );
      const right: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanLeg.goal(
        body,
        posture,
        "right",
        AutoMovieMotionHumanRise.foot(body, "right", ankles.right, degrees),
        true,
      );
      const raised: IAutoMovieMotionHumanPosture = {
        ...posture,
        joints: {
          ...posture.joints,
          leftToes: [degrees, 0, 0],
          rightToes: [degrees, 0, 0],
        },
        limbs: { ...posture.limbs, leftLeg: left, rightLeg: right },
      };
      return {
        ...raised,
        root: resolveHumanPosture.lower(body, raised, undefined, resolution)
          .root,
      };
    }
  }

  /**
   * Choose among a law's stances, steps, strategies or grips by inverse
   * reachability (Vahrenkamp, Asfour and Dillmann 2013, "Robot placement based
   * on reachability inversion", ICRA, pp. 1970-1975).
   *
   * Algorithm 1 (§V) tries a base pose, solves the arm's inverse kinematics,
   * checks it for collision and returns the pose, or nothing; Eq. (2) (§IV.A)
   * takes the pose of the greatest reachability entry. A law's candidates are a
   * finite set, so the set is taken whole (the paper's full map, §IV.A), and
   * each entry is binary, reachable or not (§II.B): a candidate's check
   * (`reach`) is the law's own closed-form reach and clearance, and a reach
   * refusal it raises is Algorithm 1's nothing. Every passing candidate then
   * holds the greatest entry, and the law's declared order settles the tie
   * (authoring.md, "a declared alternative that reaches"), so the first passing
   * candidate is the choice, and the candidates after it, which cannot change
   * it, are not checked. A refusal of another kind, or any other error, is no
   * reachability entry and propagates.
   *
   * @param props The candidates in the law's order and the check of one.
   * @returns The first candidate's stance that reaches.
   * @throws {HumanRefusal} When no candidate reaches: the first candidate's
   *   refusal, its reason followed by every other candidate's.
   */
  export function choose<Candidate, Stance>(
    props: IChoice<Candidate, Stance>,
  ): Stance {
    const refused: HumanRefusal[] = [];
    for (const candidate of props.candidates) {
      const stance: Stance | undefined = reached(
        props.reach,
        candidate,
        refused,
      );
      if (stance !== undefined) return stance;
    }
    const first: HumanRefusal | undefined = refused[0];
    if (first === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "candidates",
        value: 0,
        reason: "a stance is chosen among at least one candidate",
        fix: "declare the law's candidate stances",
      });
    return refuse(first, refused);
  }

  /**
   * Algorithm 1's try of one base (Vahrenkamp et al. 2013, §V): the candidate's
   * stance when its check passes, nothing when it refuses the reach, for a law
   * whose later candidates build on whether this one reached.
   *
   * @param reach The check of one candidate.
   * @param candidate The candidate.
   * @returns The stance, or undefined on a reach refusal.
   * @throws {HumanRefusal} A refusal of any other kind, as raised.
   */
  export function attempt<Candidate, Stance>(
    reach: (candidate: Candidate) => Stance,
    candidate: Candidate,
  ): Stance | undefined {
    return reached(reach, candidate, []);
  }

  /**
   * One candidate's binary reachability entry (Vahrenkamp et al. 2013, §II.B
   * and Algorithm 1): whether its check passes, for a law whose own search asks
   * a yes or no of each place it tries.
   *
   * @param reach The check of one candidate.
   * @param candidate The candidate.
   * @returns True when the check passes, false on a reach refusal.
   */
  export function reaches<Candidate, Stance>(
    reach: (candidate: Candidate) => Stance,
    candidate: Candidate,
  ): boolean {
    return attempt(reach, candidate) !== undefined;
  }

  /**
   * A candidate's stance, or nothing with its reach refusal kept: Algorithm 1's
   * try of one base pose. Any other error propagates.
   */
  function reached<Candidate, Stance>(
    reach: (candidate: Candidate) => Stance,
    candidate: Candidate,
    refused: HumanRefusal[],
  ): Stance | undefined {
    try {
      return reach(candidate);
    } catch (error: unknown) {
      if (!(error instanceof HumanRefusal) || error.kind !== "reach")
        throw error;
      refused.push(error);
      return undefined;
    }
  }

  /** A law's finite candidate set and the reachability check of one. */
  export interface IChoice<Candidate, Stance> {
    /** The candidates, in the law's declared order of preference. */
    candidates: readonly Candidate[];

    /**
     * Algorithm 1's check of one candidate: its stance when the arm reaches
     * clear, a reach refusal when it does not.
     */
    reach: (candidate: Candidate) => Stance;
  }

  /**
   * The refusal of a choice none of whose candidates reaches: the first
   * candidate's facts, its reason followed by the others'.
   */
  function refuse(first: HumanRefusal, all: readonly HumanRefusal[]): never {
    throw new HumanRefusal({
      kind: first.kind,
      axis: first.axis,
      value: first.value,
      feasible: first.feasible,
      reason:
        all.length === 1
          ? first.reason
          : `${first.reason}; no other candidate reaches: ${all
              .slice(1)
              .map((other: HumanRefusal): string => other.reason)
              .join("; ")}`,
      fix: first.fix,
    });
  }
}

/** The two facings a one-handed stance is chosen between. */
type Facing = "ahead" | "turned";

/** A stance's trunk turn and the lean solved on it. */
interface ITurned {
  /** The trunk's turn, degrees. */
  turn: number;

  /** The lean on the turned trunk. */
  lean: IAutoMovieMotionHumanLeanInto.ILean;

  /** The lean's pitch at the stroke's start. */
  arrival: number;
}

/**
 * The most turn-and-lean passes a two-handed facing takes before it keeps its
 * last turn (provisional).
 */
const FACING: number = 6;

/** The change of turn below which a facing has settled, degrees (provisional). */
const SETTLED: number = 0.5;

/** The bones whose joints the shoulders' middle is read between. */
const ARMS: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>(
  ["leftUpperArm", "rightUpperArm"],
);

/**
 * The spine's bones a turn of the trunk toward a wrist off to the side twists:
 * the lumbar and the thoracic spine.
 */
const TWISTED: readonly TwistedBone[] = ["spine", "chest"];

/** A spine bone the trunk's turn twists. */
type TwistedBone = "spine" | "chest";

/**
 * A wrist's place against the arm on a posture, metres: beyond the kept share
 * of the arm's length, and above the shoulder joint.
 */
interface IReach {
  /** How far the wrist lies beyond the kept share; not positive within it. */
  beyond: number;

  /** How far the wrist lies above the shoulder joint; negative below it. */
  above: number;
}

/**
 * The least angle of one freedom that closes a reach upward, degrees: 0 when
 * the wrist is within the share, not above the shoulder, or no nearer at the
 * limit; the limit when even it leaves the wrist beyond the share and above the
 * shoulder; otherwise the bisected angle at which the wrist comes within the
 * share, or, when the limit does not bring it there, at which the shoulder
 * comes level with the wrist, since above that the freedom would take the
 * shoulder away again.
 */
function least(limit: number, at: (degrees: number) => IReach): number {
  const none: IReach = at(0);
  if (!(none.beyond > 0 && none.above > 0)) return 0;
  const top: IReach = at(limit);
  if (!(top.beyond < none.beyond)) return 0;
  const enough: (reach: IReach) => boolean = (reach: IReach): boolean =>
    top.beyond <= 0 ? reach.beyond <= 0 : reach.above <= 0;
  if (!enough(top)) return limit;
  let low: number = 0;
  let high: number = limit;
  while (high - low > 0.01) {
    const middle: number = (low + high) / 2;
    if (enough(at(middle))) high = middle;
    else low = middle;
  }
  return high;
}
