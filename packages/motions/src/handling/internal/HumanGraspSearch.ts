import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/*
 * The search of a symmetric grip's turns and tilts by the error the arm's fit
 * leaves over the grasp and its stroke (`HumanGrasp.reachable` states the
 * method and its sources), prepared for one body, posture, arm and elbow hint
 * so several queries share one FK workspace.
 * Parameter body: The body, unchanged through the queries.
 * Parameter posture: The posture the arm is fitted in (its other limbs and trunk).
 * Parameter side: The arm.
 * Parameter bend: The grasp's elbow hint, world metres.
 * Parameter fixedPosture: Whether the issuer supplies a fixed posture and material
 * wrist frames, so a candidate may be fitted after its goal is built.
 * Returns: A query over a wrist goal of a turn and a tilt (degrees), the tilts
 * and turns tried, the stroke's keys, a required measure and the caller's
 * admission; it returns the chosen reach.
 */
export function HumanGraspSearch(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  bend: IAutoMovieVector3,
  fixedPosture: boolean = false,
): IQuery {
  const limb: AutoMovieHumanLimb = side === "left" ? "leftArm" : "rightArm";
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const chain: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([
      `${side}UpperArm`,
      `${side}LowerArm`,
      `${side}Hand`,
    ]);
  const readArm: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    chain,
  );

  /*
   * The hand's characteristic length a rotation's miss is carried over,
   * millimetres.
   */
  const lever: number = 1000 * body.measure.hand;

  // One key pose fitted, its elbow left to the body (`elbow`): the pose and
  // the error the arm leaves there, in millimetres of the hand: the
  // position's miss, plus the rotation's miss carried to the hand's length
  // as an arc (the rotation in radians times the hand's characteristic
  // length, which makes a pose error dimensionally homogeneous; Angeles,
  // Fundamentals of Robotic Mechanical Systems, the characteristic length of
  // a manipulator's Jacobian). The rotation is the fit's own optimal value
  // where it reports one: the least hand error over the arm's legal
  // swivels, continuous in the key (Berge's maximum theorem), where a
  // quantity read at the chosen swivel jumps wherever two swivels trade
  // places. The elbow's departure from `bend` is measured for the report and
  // costs nothing.
  const fit: (
    key: IAutoMovieMotionHumanGrasp.IKey,
    reference: IAutoMovieHumanLimbReference | undefined,
    full?: boolean,
  ) => IFitted = (
    key: IAutoMovieMotionHumanGrasp.IKey,
    reference: IAutoMovieHumanLimbReference | undefined,
    full: boolean = false,
  ): IFitted => {
    // A key another action asks is fitted as that action fits its pose:
    // its own goal, on its own arm solution, not the grasp's.
    const anchored: IAutoMovieHumanLimbReference | undefined =
      key.reference === false ? undefined : reference;
    const partial: boolean = !full && key.judge === undefined;
    const resolved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
      resolveHumanPosture.seeded(
        body,
        {
          ...key.posture,
          limbs: {
            ...key.posture.limbs,
            [limb]: {
              ...(key.goal ?? {
                point: key.wrist.point,
                rotation: key.wrist.rotation,
                bend: key.bend,
                elbow: "strain",
              }),
              ...(anchored === undefined ? {} : { reference: anchored }),
            },
          },
        },
        undefined,
        undefined,
        resolution,
        partial ? chain : undefined,
      );
    const pose: IAutoMoviePose = resolved.pose;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = partial
      ? readArm(pose, resolution())
      : poseBones(body, pose, resolution());
    const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;

    // The reports: the elbow's departure from the hint and the hand's
    // rotation error where the solver reports none.
    const departure: number = departureOf(bones, side, key);
    const dot: number = Math.min(
      1,
      Math.abs(
        hand.worldRotation.x * key.wrist.rotation.x +
          hand.worldRotation.y * key.wrist.rotation.y +
          hand.worldRotation.z * key.wrist.rotation.z +
          hand.worldRotation.w * key.wrist.rotation.w,
      ),
    );
    return {
      pose,
      shown: { point: hand.worldPosition, rotation: hand.worldRotation },
      miss:
        (((resolved.values[limb]?.error ?? angle(dot)) * Math.PI) / 180) *
          lever +
        1000 *
          AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(hand.worldPosition, key.wrist.point)),
      departure,
      judged: key.judge === undefined ? 0 : key.judge(bones),
    };
  };

  return (
    goal: (turn: number, tilt: number) => IAutoMovieMotionHumanHand.IWrist,
    tilts: readonly number[],
    stroke: IStroke | undefined,
    turns: readonly number[],
    required?: IRequired,
    admits?: (wrist: IAutoMovieMotionHumanHand.IWrist) => boolean,
  ): IAutoMovieMotionHumanGrasp.IReach => {
    let best: IAutoMovieMotionHumanGrasp.IReach | undefined;
    let least: number = Infinity;

    // With a required measure, a candidate that holds it comes before any
    // that does not, whatever their costs; among those that do not, the one
    // that misses it least is kept, for the caller's refusal.
    let held: boolean = required === undefined;
    let nearest: number = Infinity;

    // Each stroke adds nonnegative errors to its grasp floor. Once its
    // complete score holds the required measure, an already beaten floor
    // cannot change the winner regardless of the remaining stroke keys.
    const fittedCandidates: ICandidate[] = [];
    const pending: IPlacement[] = [];

    // The candidates the caller can take, or every one when it can take none.
    // In the general query each goal is built immediately before its fit, so a
    // goal callback that changes the posture it is fitted on is seen by that
    // fit; admission therefore asks the goal separately.
    const pairs: [number, number][] = turns.flatMap(
      (turn: number): [number, number][] =>
        tilts.map((tilt: number): [number, number] => [turn, tilt]),
    );
    const taken: [number, number][] =
      admits === undefined
        ? pairs
        : pairs.filter(([turn, tilt]: [number, number]): boolean =>
            admits(goal(turn, tilt)),
          );
    for (const [turn, tilt] of taken.length === 0 ? pairs : taken) {
      const wrist: IAutoMovieMotionHumanHand.IWrist = goal(turn, tilt);
      const placement: IPlacement = {
        turn,
        tilt,
        wrist,
        preference: 0.01 * (Math.abs(turn) + Math.abs(tilt)),
      };
      // The ordinary public query fits immediately after its goal callback.
      if (fixedPosture) pending.push(placement);
      else fittedCandidates.push(candidate(placement));
    }
    function candidate(placement: IPlacement): ICandidate {
      const grasp: IFitted = fit(
        { posture, wrist: placement.wrist, bend },
        undefined,
        !fixedPosture,
      );
      return { ...placement, grasp, floor: grasp.miss + placement.preference };
    }
    function* ordered(): Generator<ICandidate> {
      if (pending.length > 0) {
        const first: IPlacement = pending.reduce(
          (a: IPlacement, b: IPlacement): IPlacement =>
            a.preference <= b.preference ? a : b,
        );
        const grasp: ICandidate = candidate(first);
        // Wrist and stroke misses are nonnegative. A strict gap proves
        // this is the first item of the original stable grasp-floor sort.
        const leads: boolean = pending.every(
          (other: IPlacement): boolean =>
            other === first || grasp.floor < other.preference,
        );
        if (leads) yield grasp;
        for (const other of pending) {
          if (other === first) {
            if (!leads) fittedCandidates.push(grasp);
          } else if (!held || other.preference < least)
            fittedCandidates.push(candidate(other));
        }
      }
      fittedCandidates.sort(
        (a: ICandidate, b: ICandidate): number => a.floor - b.floor,
      );
      yield* fittedCandidates;
    }
    for (const { turn, tilt, wrist, grasp, preference, floor } of ordered()) {
      if (held && floor >= least) break;
      const reference: IAutoMovieHumanLimbReference = HumanLimbFit.reference(
        grasp.pose,
        limb,
      );
      let miss: number = grasp.miss;
      let departure: number = grasp.departure;
      let beaten: boolean = false;
      const keys: number[] = [grasp.miss];
      const judged: number[] = [0];
      const bounds: number[] = [Infinity];

      // The keys are built as they are reached, so a key a candidate never
      // reaches, beaten by an earlier one, is never built.
      for (const key of stroke?.(wrist, grasp.shown) ?? []) {
        const fitted: IFitted = fit(key, reference);
        keys.push(fitted.miss);
        judged.push(fitted.judged);
        bounds.push(key.bound ?? Infinity);
        miss = Math.max(miss, fitted.miss);
        departure = Math.max(departure, fitted.departure);
        if (held && miss + preference >= least) {
          beaten = true;
          break;
        }
      }
      if (beaten) continue;
      const cost: number = miss + preference;
      const measured: number =
        required === undefined ? 0 : required.measure(keys, judged, bounds);
      const holds: boolean =
        required === undefined || measured <= required.bound;
      if (
        best === undefined ||
        (holds && !held) ||
        (holds === held && (holds ? cost < least : measured < nearest))
      ) {
        held = holds;
        nearest = measured;
        least = cost;
        best = {
          turn,
          tilt,
          wrist,
          shown: grasp.shown,
          reference,
          miss,
          departure,
          keys,
          judged,
          bounds,
          pose: grasp.pose,
        };
      }
    }
    if (fixedPosture && best !== undefined)
      best.pose = fit(
        { posture, wrist: best.wrist, bend },
        undefined,
        true,
      ).pose;
    return best!;
  };
}

/*
 * The wrist frame and the nonnegative angle cost before any arm fit.
 */
interface IPlacement {
  turn: number;
  tilt: number;
  wrist: IAutoMovieMotionHumanHand.IWrist;
  preference: number;
}

/*
 * A fitted placement whose grasp error bounds every subsequent stroke.
 */
interface ICandidate extends IPlacement {
  grasp: IFitted;
  floor: number;
}

/*
 * A query's stroke keys, built lazily from the asked and the displayed grasp
 * wrists.
 */
type IStroke = (
  wrist: IAutoMovieMotionHumanHand.IWrist,
  shown: IAutoMovieMotionHumanHand.IWrist,
) => Iterable<IAutoMovieMotionHumanGrasp.IKey>;

/*
 * What a grip must hold before its cost counts: a measure and its upper bound,
 * in the caller's unit.
 */
interface IRequired {
  /*
   * Largest accepted value of the measure.
   */
  bound: number;
  /*
   * The measure of a candidate's per-key errors, judgements and declared
   * bounds.
   */
  measure: (
    keys: readonly number[],
    judged: readonly number[],
    bounds: readonly number[],
  ) => number;
}

/*
 * One search: goal of a turn and a tilt, the tilts, the stroke, the turns, the
 * required measure and the admission.
 */
type IQuery = (
  goal: (turn: number, tilt: number) => IAutoMovieMotionHumanHand.IWrist,
  tilts: readonly number[],
  stroke: IStroke | undefined,
  turns: readonly number[],
  required?: IRequired,
  admits?: (wrist: IAutoMovieMotionHumanHand.IWrist) => boolean,
) => IAutoMovieMotionHumanGrasp.IReach;

/*
 * The displayed result and scalar reports of one key fit.
 */
interface IFitted {
  /*
   * The canonical pose after all coupled limb and digit fits.
   */
  pose: IAutoMoviePose;

  /*
   * The displayed wrist frame, world metres and rest-relative rotation.
   */
  shown: IAutoMovieMotionHumanHand.IWrist;

  /*
   * The wrist's position error plus the hand's rotation error carried as an arc
   * over the hand's length, millimetres.
   */
  miss: number;

  /*
   * The elbow's turn from the hint about the shoulder-to-wrist line, degrees.
   */
  departure: number;

  /*
   * The key's own judgement, or zero when it declares none.
   */
  judged: number;
}

/*
 * The elbow's turn from the key's hint about the shoulder-to-wrist line,
 * degrees; 0 when either side is degenerate.
 */
function departureOf(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  side: AutoMovieHumanSide,
  key: Pick<IAutoMovieMotionHumanGrasp.IKey, "bend">,
): number {
  const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
  const shoulder: IAutoMovieVector3 = bones.get(
    `${side}UpperArm`,
  )!.worldPosition;
  const line: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    hand.worldPosition,
    shoulder,
  );
  const span: number = AutoMovieEngineVector3.dot(line, line);
  const radial: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const from: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(point, shoulder);
    return span > 0
      ? AutoMovieEngineVector3.subtract(
          from,
          AutoMovieEngineVector3.scale(line, AutoMovieEngineVector3.dot(from, line) / span),
        )
      : from;
  };
  const shownSide: IAutoMovieVector3 = radial(
    bones.get(`${side}LowerArm`)!.worldPosition,
  );
  const hintSide: IAutoMovieVector3 = radial(key.bend);
  const sides: number = AutoMovieEngineVector3.length(shownSide) * AutoMovieEngineVector3.length(hintSide);
  return sides > 1e-12
    ? (Math.acos(
        Math.max(-1, Math.min(1, AutoMovieEngineVector3.dot(shownSide, hintSide) / sides)),
      ) *
        180) /
        Math.PI
    : 0;
}

/*
 * The rotation angle, degrees, of a unit quaternion whose absolute dot with the
 * asked one is `dot`.
 */
function angle(dot: number): number {
  return (2 * Math.acos(dot) * 180) / Math.PI;
}
