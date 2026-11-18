import { Vector3 } from "@automovie/engine";
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

import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The search of a symmetric grip's turns and tilts by the error the arm's
 * fit leaves over the grasp and its stroke (`HumanGrasp.reachable` states
 * the method and its sources), prepared for one body, posture, arm and
 * elbow hint so several queries share one FK workspace.
 *
 * @param body The body, unchanged through the queries.
 * @param posture The posture the arm is fitted in (its other limbs and trunk).
 * @param side The arm.
 * @param bend The grasp's elbow hint, world metres.
 * @returns A query over a wrist goal of a turn and a tilt (degrees), the tilts and turns tried, the stroke's keys, a required measure and the caller's admission; it returns the chosen reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the fixed inputs, each query argument and the result; HumanGrasp.reachable documents the cost, the stroke, the required measure and the admission.
 * @evidence contracts/development/implementation.md#principled-implementation Every candidate's grasp is fitted and the candidates taken least grasp error first; the grasp error bounds a candidate's cost from below, since stroke keys only add to it, so the search stops at the first candidate no cheaper than the best that holds the required measure. A fit's rotation error is the solver's own optimum over legal swivels where it reports one, continuous in the key (Berge's maximum theorem).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One fit adapter, one candidate list, one ordered loop over each candidate's lazily built stroke keys.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every candidate the caller admits is fitted at its grasp; pruning uses only the proven lower bound; with none admitted, every candidate is tried.
 * @evidence contracts/development/implementation.md#efficient-algorithms For C candidates, C grasp fits plus the stroke-key fits of the candidates the lower bound does not prune; an admitted goal is built once for its admission and once right before its fit, the schedule goal callbacks observe. All fits of all queries share one FK workspace.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The FK workspace shares only rig dependency data; each fit resolves its own posture.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Candidate fits are local to a query; only the chosen pose, wrists, reference and scalar reports escape.
 */
export function HumanGraspSearch(body: IAutoMovieMotionHumanBody, posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide, bend: IAutoMovieVector3): IQuery {
  const limb: AutoMovieHumanLimb = side === "left" ? "leftArm" : "rightArm";
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();

  // One key pose fitted, its elbow left to the body (`elbow`): the pose and
  // the error the arm leaves there, the rotation in degrees plus the
  // position in millimetres. The rotation is the fit's own optimal value
  // where it reports one: the least hand error over the arm's legal
  // swivels, continuous in the key (Berge's maximum theorem), where a
  // quantity read at the chosen swivel jumps wherever two swivels trade
  // places. The elbow's departure from `bend` is measured for the report and
  // costs nothing.
  const fit: (key: IAutoMovieMotionHumanGrasp.IKey, reference: IAutoMovieHumanLimbReference | undefined) => IFitted = (
    key: IAutoMovieMotionHumanGrasp.IKey,
    reference: IAutoMovieHumanLimbReference | undefined,
  ): IFitted => {
    // A key another action asks is fitted as that action fits its pose:
    // its own goal, on its own arm solution, not the grasp's.
    const anchored: IAutoMovieHumanLimbReference | undefined =
      key.reference === false ? undefined : reference;
    const resolved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
      resolveHumanPosture.seeded(body, {
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
      }, undefined, undefined, resolution);
    const pose: IAutoMoviePose = resolved.pose;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(body, pose, resolution());
    const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;

    // The reports: the elbow's departure from the hint and the hand's
    // rotation error where the solver reports none.
    const departure: number = departureOf(bones, side, key);
    const dot: number = Math.min(1, Math.abs(
      hand.worldRotation.x * key.wrist.rotation.x +
      hand.worldRotation.y * key.wrist.rotation.y +
      hand.worldRotation.z * key.wrist.rotation.z +
      hand.worldRotation.w * key.wrist.rotation.w,
    ));
    return {
      pose,
      shown: { point: hand.worldPosition, rotation: hand.worldRotation },
      miss:
        (resolved.values[limb]?.error ??
          angle(dot)) +
        1000 *
          Vector3.length(
            Vector3.subtract(hand.worldPosition, key.wrist.point),
          ),
      departure,
      judged: key.judge === undefined ? Number.NaN : key.judge(bones),
    };
  };

  return (goal: (turn: number, tilt: number) => IAutoMovieMotionHumanHand.IWrist,
    tilts: readonly number[], stroke: IStroke | undefined,
    turns: readonly number[],
    required?: IRequired, admits?: (wrist: IAutoMovieMotionHumanHand.IWrist) => boolean): IAutoMovieMotionHumanGrasp.IReach => {
    let best: IAutoMovieMotionHumanGrasp.IReach | undefined;
    let least: number = Infinity;

    // With a required measure, a candidate that holds it comes before any
    // that does not, whatever their costs; among those that do not, the one
    // that misses it least is kept, for the caller's refusal.
    let held: boolean = required === undefined;
    let nearest: number = Infinity;

    // Every candidate's grasp is fitted first. Its error there bounds its
    // cost from below, since a stroke's keys only add to it, so the
    // candidates are then taken least grasp error first: once one that
    // holds what is required is found, the first candidate whose grasp
    // alone is no cheaper ends the search, with every candidate after it.
    // The choice is the one fitting every key of every candidate gives.
    const candidates: {
      turn: number;
      tilt: number;
      wrist: IAutoMovieMotionHumanHand.IWrist;
      grasp: ReturnType<typeof fit>;
      preference: number;
      floor: number;
    }[] = [];

    // The candidates the caller can take, or every one when it can take none.
    // Each fitted candidate's goal is built immediately before its fit, so a
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
      const grasp: IFitted = fit({ posture, wrist, bend }, undefined);
      const preference: number = 0.01 * (Math.abs(turn) + Math.abs(tilt));
      candidates.push({
        turn,
        tilt,
        wrist,
        grasp,
        preference,
        floor: grasp.miss + preference,
      });
    }
    candidates.sort(
      (a: { floor: number }, b: { floor: number }): number => a.floor - b.floor,
    );
    for (const { turn, tilt, wrist, grasp, preference, floor } of candidates) {
      if (held && floor >= least) break;
      const reference: IAutoMovieHumanLimbReference = resolveHumanPosture.reference(
        grasp.pose,
        limb,
      );
      let miss: number = grasp.miss;
      let departure: number = grasp.departure;
      let beaten: boolean = false;
      const keys: number[] = [grasp.miss];
      const judged: number[] = [Number.NaN];
      const bounds: number[] = [Number.NaN];

      // The keys are built as they are reached, so a key a candidate never
      // reaches, beaten by an earlier one, is never built.
      for (const key of stroke?.(wrist, grasp.shown) ?? []) {
        const fitted: IFitted = fit(key, reference);
        keys.push(fitted.miss);
        judged.push(fitted.judged);
        bounds.push(key.bound ?? Number.NaN);
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
    return best!;
  };
}

/** A query's stroke keys, built lazily from the asked and the displayed grasp wrists. */
type IStroke = (wrist: IAutoMovieMotionHumanHand.IWrist, shown: IAutoMovieMotionHumanHand.IWrist) => Iterable<IAutoMovieMotionHumanGrasp.IKey>;

/** What a grip must hold before its cost counts: a measure and its upper bound, in the caller's unit. */
interface IRequired {
  /** Largest accepted value of the measure. */
  bound: number;
  /** The measure of a candidate's per-key errors, judgements and declared bounds. */
  measure: (keys: readonly number[], judged: readonly number[], bounds: readonly number[]) => number;
}

/** One search: goal of a turn and a tilt, the tilts, the stroke, the turns, the required measure and the admission. */
type IQuery = (goal: (turn: number, tilt: number) => IAutoMovieMotionHumanHand.IWrist,
  tilts: readonly number[], stroke: IStroke | undefined, turns: readonly number[],
  required?: IRequired, admits?: (wrist: IAutoMovieMotionHumanHand.IWrist) => boolean) => IAutoMovieMotionHumanGrasp.IReach;

/** The displayed result and scalar reports of one key fit. */
interface IFitted {
  /** The canonical pose after all coupled limb and digit fits. */
  pose: IAutoMoviePose;

  /** The displayed wrist frame, world metres and rest-relative rotation. */
  shown: IAutoMovieMotionHumanHand.IWrist;

  /** The hand's rotation error in degrees plus the wrist's position error in millimetres. */
  miss: number;

  /** The elbow's turn from the hint about the shoulder-to-wrist line, degrees. */
  departure: number;

  /** The key's own judgement, or NaN when it declares none. */
  judged: number;
}

/** The elbow's turn from the key's hint about the shoulder-to-wrist line, degrees; 0 when either side is degenerate. */
function departureOf(bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  side: AutoMovieHumanSide, key: Pick<IAutoMovieMotionHumanGrasp.IKey, "bend">): number {
  const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
  const shoulder: IAutoMovieVector3 = bones.get(`${side}UpperArm`)!.worldPosition;
  const line: IAutoMovieVector3 = Vector3.subtract(hand.worldPosition, shoulder);
  const span: number = Vector3.dot(line, line);
  const radial: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 => {
    const from: IAutoMovieVector3 = Vector3.subtract(point, shoulder);
    return span > 0 ? Vector3.subtract(from, Vector3.scale(line, Vector3.dot(from, line) / span)) : from;
  };
  const shownSide: IAutoMovieVector3 = radial(bones.get(`${side}LowerArm`)!.worldPosition);
  const hintSide: IAutoMovieVector3 = radial(key.bend);
  const sides: number = Vector3.length(shownSide) * Vector3.length(hintSide);
  return sides > 1e-12 ? (Math.acos(Math.max(-1,
    Math.min(1, Vector3.dot(shownSide, hintSide) / sides))) * 180) / Math.PI : 0;
}

/** The rotation angle, degrees, of a unit quaternion whose absolute dot with the asked one is `dot`. */
function angle(dot: number): number {
  return (2 * Math.acos(dot) * 180) / Math.PI;
}
