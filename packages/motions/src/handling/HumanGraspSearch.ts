import { type IAutoMovieResolvedBone, Vector3 } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMoviePose, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGraspJudgement } from "./HumanGraspJudgement";

/**
 * Prepare fixed source assembly and FK dependencies for actual grasp searches.
 *
 * @param body Unchanged body, rig, surfaces, collision profile and ROM throughout one synchronous operation.
 * @param posture Unchanged raw root/orientation/direct joints/digits and other complete limb goals of every query's grasp.
 * @param side The acting hand.
 * @param bend The fixed grasp elbow hint, world metres.
 * @returns Independent original turn/tilt/stroke searches over their actual wrist producer, candidate grids, per-key required measure and admission callback. Omitted arguments retain HumanGrasp's original defaults.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines fixed body/posture/hand/hint lifetime, varying complete search arguments, original defaults, candidate/stroke/reference semantics and plain chosen reach outputs. HumanGraspReach documents the original mixed-unit cost and tie/required/admission policy.
 * @evidence contracts/development/implementation.md#principled-implementation Every query performs the original sorted lower-bound candidate/stroke search with every actual complete coupled posture fit. Only exact input-posture keys use one lazily prepared fixed direct base; arbitrary key postures use ordinary seeded resolution.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed base/name/FK preparation and common fit adapter precede independent query-local admission, sorted search and required-first ranking; departureOf and rotationError own their original numeric reports.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No candidate, full solve, LRU memory lookup, judge callback, bound, preference, reference, pruning comparison or least-miss fallback is omitted or replaced by a stored answer. Every judged key retains eager three-arm departure before callback; arbitrary/wrapped/replaced or other-hand judges retain full bone output.
 * @evidence contracts/development/implementation.md#efficient-algorithms Q searches share one O(B+J) fixed assembly and name/FK preparation; all original full solves remain. Losing unjudged keys read only hand output, while retained reports demand the original three-arm frames. Exact factory-issued acting-hand judges read those same three-arm departure frames without unrelated rig output; solver error omits unused quaternion fallback. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work HumanClasp's actual thirteen turn queries explicitly share unchanged body/posture/side/hint; the cold facade creates one operation for its single query. Exact FK prerequisites and fixed direct geometry are shared, while all varying goals, candidate results and judgements are actually evaluated per query.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous owner releases one fixed base, body/posture/hint references and exact FK/name readers after its queries. Candidate arrays, fits and report closures are query-local; only chosen pose/wrist/reference and scalar reports escape, with no producer, callback map, fit/time history or handle retained by outputs.
 */
export function HumanGraspSearch(body: IHumanBody, posture: IHumanPosture,
  side: HumanHand.Side, bend: IAutoMovieVector3): IQuery {
  const limb: IHumanPosture.Limb = side === "left" ? "leftArm" : "rightArm";
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  let prepared: ReturnType<typeof resolveHumanPosture.prepareBase> | undefined;
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
    `${side}UpperArm`, `${side}LowerArm`, `${side}Hand`,
  ]);
  const readArm: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, requested);
  const readHand: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body,
    new Set<AutoMovieHumanoidBone>([`${side}Hand`]));

  // One key pose fitted, its elbow left to the body (`elbow`): the pose and
  // the error the arm leaves there, the rotation in degrees plus the
  // position in millimetres. The rotation is the fit's own optimal value
  // where it reports one: the least hand error over the arm's legal
  // swivels, continuous in the key (Berge's maximum theorem), where a
  // quantity read at the chosen swivel jumps wherever two swivels trade
  // places. The elbow's departure from `bend` is measured for the report and
  // costs nothing.
  const fit: (key: HumanGrasp.IKey, reference: IHumanPosture.IReference | undefined) => IFitted = (
    key: HumanGrasp.IKey,
    reference: IHumanPosture.IReference | undefined,
  ): IFitted => {
    // A key another action asks is fitted as that action fits its pose:
    // its own goal, on its own arm solution, not the grasp's.
    const anchored: IHumanPosture.IReference | undefined =
      key.reference === false ? undefined : reference;
    const limbs: IHumanPosture["limbs"] = {
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
    };
    const resolved: resolveHumanPosture.ISeeded = key.posture === posture
      ? (prepared ??= resolveHumanPosture.prepareBase(body, posture)).seeded(limbs, {}, resolution)
      : resolveHumanPosture.seeded(body, { ...key.posture, limbs }, undefined, {}, resolution);
    const pose: IAutoMoviePose = resolved.pose;
    const observed: AutoMovieHumanoidBone | undefined = HumanGraspJudgement.hand(key.judge);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      key.judge === undefined ? readHand(pose, resolution())
        : observed === `${side}Hand` ? readArm(pose, resolution())
          : poseBones(body, pose, resolution());
    const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;

    // Every supplied judge follows eager departure. Only exact issued
    // hand-only functions omit unrelated output; arbitrary judges keep it all.
    let departure: () => number;
    if (key.judge === undefined) {
      const hint: IAutoMovieVector3 = { ...key.bend };
      departure = (): number => departureOf(readArm(pose, resolution()), side, hint);
    } else {
      const measured: number = departureOf(bones, side, key.bend);
      departure = (): number => measured;
    }
    return {
      pose,
      shown: { point: hand.worldPosition, rotation: hand.worldRotation },
      miss:
        (resolved.values[limb]?.error ??
          rotationError(hand.worldRotation, key.wrist.rotation)) +
        1000 *
          Vector3.length(
            Vector3.subtract(hand.worldPosition, key.wrist.point),
          ),
      departure,
      judged: key.judge === undefined ? Number.NaN : key.judge(bones),
    };
  };

  return (goal: (turn: number, tilt: number) => HumanHand.IWrist,
    tilts: readonly number[] = [0], stroke?: IStroke,
    turns: readonly number[] = HumanGrasp.TURNS,
    required?: IRequired, admits?: (wrist: HumanHand.IWrist) => boolean): HumanGrasp.IReach => {
    let best: HumanGrasp.IReach | undefined;
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
      wrist: HumanHand.IWrist;
      grasp: ReturnType<typeof fit>;
      preference: number;
      floor: number;
    }[] = [];

    // The candidates the caller can take, or every one when it can take none.
    const pairs: { turn: number; tilt: number; wrist: HumanHand.IWrist }[] = turns.flatMap(
      (turn: number): { turn: number; tilt: number; wrist: HumanHand.IWrist }[] =>
        tilts.map((tilt: number): { turn: number; tilt: number; wrist: HumanHand.IWrist } =>
          ({ turn, tilt, wrist: goal(turn, tilt) })),
    );
    const taken: typeof pairs =
      admits === undefined
        ? pairs
        : pairs.filter((candidate: (typeof pairs)[number]): boolean =>
            admits(candidate.wrist),
          );
    for (const { turn, tilt, wrist } of taken.length === 0 ? pairs : taken) {
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
      const reference: IHumanPosture.IReference = resolveHumanPosture.reference(
        grasp.pose,
        limb,
      );
      let miss: number = grasp.miss;
      const reports: IFitted[] = [grasp];
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
        reports.push(fitted);
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
        let departure: number = grasp.departure();
        for (let index: number = 1; index < reports.length; ++index)
          departure = Math.max(departure, reports[index]!.departure());
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
type IStroke = (wrist: HumanHand.IWrist, shown: HumanHand.IWrist) => Iterable<HumanGrasp.IKey>;

/** Original caller-defined required metric and upper acceptance bound. */
interface IRequired {
  /** Largest accepted metric value, in the caller's original unit. */
  bound: number;
  /** Actual ordered grasp/key errors, judgements and declared bounds determine acceptance. */
  measure: (keys: readonly number[], judged: readonly number[], bounds: readonly number[]) => number;
}

/** Independent search arguments; only producer-fixed source geometry is shared between calls. */
type IQuery = (goal: (turn: number, tilt: number) => HumanHand.IWrist,
  tilts?: readonly number[], stroke?: IStroke, turns?: readonly number[],
  required?: IRequired, admits?: (wrist: HumanHand.IWrist) => boolean) => HumanGrasp.IReach;
/** The original displayed result and scalar reports of one actual key fit. */
interface IFitted {
  /** The fresh canonical pose after all coupled limb and digit fits. */
  pose: IAutoMoviePose;

  /** The displayed wrist frame, world metres and rest-relative rotation. */
  shown: HumanHand.IWrist;

  /** The original hand-degree plus wrist-millimetre error cost. */
  miss: number;

  /** Original degree departure; unjudged keys evaluate it only when retained for the reported best. */
  departure: () => number;

  /** The key's own judgement, or NaN when it declares none. */
  judged: number;
}

/** Original elbow-side report, independent of every selection cost and bound. */
function departureOf(bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  side: HumanHand.Side, hint: IAutoMovieVector3): number {
  const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
  const shoulder: IAutoMovieVector3 = bones.get(`${side}UpperArm`)!.worldPosition;
  const line: IAutoMovieVector3 = Vector3.subtract(hand.worldPosition, shoulder);
  const span: number = Vector3.dot(line, line);
  const radial: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 => {
    const from: IAutoMovieVector3 = Vector3.subtract(point, shoulder);
    return span > 0 ? Vector3.subtract(from, Vector3.scale(line, Vector3.dot(from, line) / span)) : from;
  };
  const shownSide: IAutoMovieVector3 = radial(bones.get(`${side}LowerArm`)!.worldPosition);
  const hintSide: IAutoMovieVector3 = radial(hint);
  const sides: number = Vector3.length(shownSide) * Vector3.length(hintSide);
  return sides > 1e-12 ? (Math.acos(Math.max(-1,
    Math.min(1, Vector3.dot(shownSide, hintSide) / sides))) * 180) / Math.PI : 0;
}

/** Preserve the original fallback attitude cost only when the fit supplies none. */
function rotationError(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number {
  const dot: number = Math.min(1, Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w));
  return (2 * Math.acos(dot) * 180) / Math.PI;
}
