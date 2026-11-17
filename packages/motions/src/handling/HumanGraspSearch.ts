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
import { HumanGrasp } from "./HumanGrasp";

/**
 * Share canonical operation FK metadata across original current-input grasp searches.
 *
 * @param body Unchanged body, rig, surfaces, collision profile and ROM throughout one synchronous operation.
 * @param posture The live raw source of root/orientation/joints/digits and complete other goals; each actual fit re-admits current values after any callback mutation.
 * @param side The acting hand.
 * @param bend The fixed grasp elbow hint, world metres.
 * @returns Independent original turn/tilt/stroke searches over their actual wrist producer, candidate grids, per-key required measure and admission callback. Omitted arguments retain HumanGrasp's original defaults.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines canonical body/hand/hint and live posture lifetime, complete query arguments, original defaults and chosen reach outputs. HumanGraspReach owns the original mixed-unit cost, callback schedule and required/admission policy.
 * @evidence contracts/development/implementation.md#principled-implementation Every query performs the original sorted lower-bound search and complete coupled fits. Each fit spreads current source posture before constructing its goals, then full FK, eager departure and term-by-term eager attitude dot precede the final judge callback.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One canonical FK operation reader serves the same current fit adapter and ordered candidate/stroke search; coordinate enumeration, admission and selected goal/fit calls retain their original interleaving.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No original callback invocation, candidate, solve, LRU lookup, bound, preference, reference, pruning comparison or fallback is removed. Borrowed posture graphs are never treated as immutable; original spread, nested property lookup and full eager report/dot/last-judge observations remain.
 * @evidence contracts/development/implementation.md#efficient-algorithms Q actual queries share one exact FK reader; all C candidate and reached-key complete solves/full observations remain. Original eager numeric departure is aggregated directly without allocating deferred report closures or a second report list. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The genuine canonical body rig and exact current FK reader share only dependency metadata. Each fit still admits current source values after arbitrary callbacks; no fixed direct base, posture identity, private-callback purity inference or fitted-answer cache establishes equivalence.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous owner releases body/posture/hint references and its exact FK reader after all queries. Candidate arrays/fits are query-local; only chosen pose/wrist/reference and scalar reports escape, without a producer, callback map, fit/time history or handle.
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

    // Keep every original report before the optional judge, including each
    // nested rotation lookup in the eager dot expression.
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
    tilts: readonly number[] = [0], stroke?: IStroke,
    turns: readonly number[] = HumanGrasp.TURNS,
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

/** One query's lazy complete stroke keys, built from asked and actually displayed grasp wrists. */
type IStroke = (wrist: IAutoMovieMotionHumanHand.IWrist, shown: IAutoMovieMotionHumanHand.IWrist) => Iterable<IAutoMovieMotionHumanGrasp.IKey>;

/** Original caller-defined required metric and upper acceptance bound. */
interface IRequired {
  /** Largest accepted metric value, in the caller's original unit. */
  bound: number;
  /** Actual ordered grasp/key errors, judgements and declared bounds determine acceptance. */
  measure: (keys: readonly number[], judged: readonly number[], bounds: readonly number[]) => number;
}

/** Independent original search arguments; every call admits current source values. */
type IQuery = (goal: (turn: number, tilt: number) => IAutoMovieMotionHumanHand.IWrist,
  tilts?: readonly number[], stroke?: IStroke, turns?: readonly number[],
  required?: IRequired, admits?: (wrist: IAutoMovieMotionHumanHand.IWrist) => boolean) => IAutoMovieMotionHumanGrasp.IReach;
/** The original displayed result and scalar reports of one actual key fit. */
interface IFitted {
  /** The fresh canonical pose after all coupled limb and digit fits. */
  pose: IAutoMoviePose;

  /** The displayed wrist frame, world metres and rest-relative rotation. */
  shown: IAutoMovieMotionHumanHand.IWrist;

  /** The original hand-degree plus wrist-millimetre error cost. */
  miss: number;

  /** Original eager degree departure, completed before the optional judgement. */
  departure: number;

  /** The key's own judgement, or NaN when it declares none. */
  judged: number;
}

/** Original elbow-side report, independent of every selection cost and bound. */
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

/** Original degree conversion after the already completed clipped dot. */
function angle(dot: number): number {
  return (2 * Math.acos(dot) * 180) / Math.PI;
}
