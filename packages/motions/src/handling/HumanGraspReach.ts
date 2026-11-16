import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanGrasp } from "./HumanGrasp";

/**
 * Which grip of a target an arm reaches: the search over a grip's turns and
 * tilts by the error the arm's fit leaves over the grasp and its stroke, the
 * standing posture another person's arm is predicted from, and a target
 * turned about its wrapped axis. `HumanGrasp` declares the records and
 * passes these through by name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the file owns and where its records are declared.
 * @evidence contracts/development/design.md#principled-representation The reach search of a grasp, over the target, key and reach records `HumanGrasp` declares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Split from `HumanGrasp` unchanged, so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture resolver and the stand law; nothing is duplicated.
 */
export namespace HumanGraspReach {
  /**
   * The reachable variant of a symmetric hand goal: among the goals a
   * family of turns produces (about a grasped part's own axis, where any
   * azimuth wraps it alike, or about the palm's normal, where the palm's
   * contact is unchanged), the one the arm can actually take from a posture,
   * by the error left after the arm's fit over its three goals: the hand's
   * rotation in degrees, the wrist's position in millimetres and the elbow's
   * turn from its hint about the shoulder-to-wrist line in degrees, the one
   * freedom a placed wrist leaves the elbow (Tolani, Goswami and Badler
   * 2000). The fit gives up the elbow hint before the hand, so a hand turn
   * the wrist's range cannot hold with the hinted elbow is reached by the
   * other arm pose, the elbow raised; counting that turn as error ranks the
   * grip the arm takes as the law asked above one it takes by leaving its
   * bend. The authored turn wins ties by a hundredth of a
   * degree per degree of turn. Grasp planners rank a part's symmetric grasps
   * by reachability the same way (Miller et al. 2003, Automatic grasp
   * planning using shape primitives), since an authored grip frame alone may
   * ask the wrist for more deviation than it has.
   *
   * A grip is held through a stroke, not at one instant: a lifted bottle is
   * still in the same grip at the top of the lift, a clasped hand at both
   * ends of the pump. `stroke` names those further key poses for a candidate
   * grip, and a candidate's error is the worst over the grasp and its keys,
   * so the chosen grip is the one the arm keeps over the whole stroke; a key
   * that judges what it places (`HumanGrasp.IKey.judge`) also reports that
   * judgement, which `required` reads. Each
   * key is fitted with the grasp's own arm solution as its reference, the way
   * the law will show it. The returned `reference` is that solution, for the
   * law to pass on every goal of the stroke
   * (`IHumanPosture.IGoal.reference`).
   *
   * @param body The body.
   * @param posture The posture the arm is fitted in (its other limbs and trunk).
   * @param side The arm.
   * @param bend The elbow hint.
   * @param goal The wrist goal of a turn and a tilt, degrees.
   * @param tilts The tilts tried at each turn; only the authored one when absent.
   * @param stroke The further key poses the same grip must reach, from its grasp goal and from the hand the arm shows for that goal: what is held is rigid in the shown hand, so a key that places the held thing is built from the shown one. None when absent.
   * @param turns The turns tried, degrees; -90 to 90 in steps of 15 when absent.
   * @param required What a grip must hold before its cost counts: a measure of its per-key errors, judgements and the bounds the keys hold their judgements to (the grasp's, then each stroke key's, `IKey.judge` and `IKey.bound`; `NaN` where none) and the most it may be. A grip within the bound is chosen before any beyond it; with none within, the one nearest the bound is returned for the caller to refuse. Absent, the least cost alone decides.
   * @param admits Whether the caller can take a candidate's grasp goal at all (a pick-up's wrist within the straight arm's reach, which it refuses beyond): a candidate it refuses is tried only when it refuses every one, so a cheaper fit never wins a grip the caller must then refuse. Every candidate when absent.
   * @returns The best turn and tilt, their goal, the hand the arm achieves for it, and the arm's solution there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States candidate, stroke, reference, required-judgement and admission semantics, including the original mixed-unit cost and tie preference.
   * @evidence contracts/development/implementation.md#principled-implementation Keeps the existing exact lower-bound candidate ordering and all coupled posture fits; unjudged keys demand only the three arm frames their error and bend departure read, while arbitrary judges still receive every bone.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Candidate admission and grasp fitting precede the original ordered stroke search; one local fit owns the common goal construction and displayed-pose judgement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No key, legal fit, error, bound, candidate or preference changes; the original required-first and least-miss fallback choices remain.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each of C turn/tilt pairs constructs its wrist once; the fixed input posture prepares its canonical root/direct-joint clamp once, while every candidate still runs its original full coupled fit. Unjudged keys demand only observed arm FK and original lower-bound stroke pruning remains.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only keys on the exact fixed input posture borrow its explicitly prepared unchanged base; other key postures take ordinary seeded resolution. One synchronous search shares exact FK dependencies across actual fits/readbacks, never a fitted answer across goals.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Candidate records and one FK reader are local to this search; only the chosen original pose, wrist, reference and scalar reports escape, with no reader or search map retained.
   */
  export function reachable(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    bend: IAutoMovieVector3,
    goal: (turn: number, tilt: number) => HumanHand.IWrist,
    tilts: readonly number[] = [0],
    stroke?: (
      wrist: HumanHand.IWrist,
      shown: HumanHand.IWrist,
    ) => Iterable<HumanGrasp.IKey>,
    turns: readonly number[] = HumanGrasp.TURNS,
    required?: {
      bound: number;
      measure: (
        keys: readonly number[],
        judged: readonly number[],
        bounds: readonly number[],
      ) => number;
    },
    admits?: (wrist: HumanHand.IWrist) => boolean,
  ): HumanGrasp.IReach {
    const limb: IHumanPosture.Limb = side === "left" ? "leftArm" : "rightArm";
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    let prepared: ReturnType<typeof resolveHumanPosture.prepareBase> | undefined;
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
      `${side}UpperArm`, `${side}LowerArm`, `${side}Hand`,
    ]);
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
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, pose, resolution(), key.judge === undefined ? requested : undefined);
      const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
      // How far the elbow sits from its hint about the shoulder-to-wrist
      // line, the one freedom the wrist's place leaves it.
      const shoulder: IAutoMovieVector3 = bones.get(
        `${side}UpperArm`,
      )!.worldPosition;
      const line: IAutoMovieVector3 = Vector3.subtract(
        hand.worldPosition,
        shoulder,
      );
      const span: number = Vector3.dot(line, line);
      const radial: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 => {
        const from: IAutoMovieVector3 = Vector3.subtract(point, shoulder);
        return span > 0
          ? Vector3.subtract(
              from,
              Vector3.scale(line, Vector3.dot(from, line) / span),
            )
          : from;
      };
      const shownSide: IAutoMovieVector3 = radial(
        bones.get(`${side}LowerArm`)!.worldPosition,
      );
      const hintSide: IAutoMovieVector3 = radial(key.bend);
      const sides: number =
        Vector3.length(shownSide) * Vector3.length(hintSide);
      const departure: number =
        sides > 1e-12
          ? (Math.acos(
              Math.max(
                -1,
                Math.min(1, Vector3.dot(shownSide, hintSide) / sides),
              ),
            ) *
              180) /
            Math.PI
          : 0;
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
          (resolved.values[limb]?.error ??
            (2 * Math.acos(dot) * 180) / Math.PI) +
          1000 *
            Vector3.length(
              Vector3.subtract(hand.worldPosition, key.wrist.point),
            ),
        departure,
        judged: key.judge === undefined ? Number.NaN : key.judge(bones),
      };
    };
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
  }

  /**
   * The standing posture a person settles into from where they stand: the
   * stand law's posture centred over the person's displayed feet, facing the
   * way the pelvis faces. A law predicting another person's arm (a
   * handshake's partner, a handover's receiver) reads it, so the prediction
   * starts from the same root the partner's own stand law will hold.
   *
   * @param body The person's body.
   * @param bones The person's displayed world bones.
   * @returns The posture.
   */
  export function standing(
    body: IHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >,
  ): IHumanPosture {
    const yaw: number = HumanFrame.heading(bones.get("hips")!.worldRotation);
    const l: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
    const r: IAutoMovieVector3 = bones.get("rightFoot")!.worldPosition;
    const restL: IAutoMovieVector3 = body.rest.get("leftFoot")!;
    const restR: IAutoMovieVector3 = body.rest.get("rightFoot")!;
    const centre: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: (restL.x + restR.x) / 2, y: 0, z: (restL.z + restR.z) / 2 },
    );
    return stand.posture(
      body,
      { x: (l.x + r.x) / 2 - centre.x, y: 0, z: (l.z + r.z) / 2 - centre.z },
      yaw,
    );
  }

  /**
   * A target turned about its wrapped axis through the axis point, as a
   * cylinder's grip may be taken from any side.
   *
   * @param target The target.
   * @param turn Degrees about the wrapped axis.
   * @returns The turned target.
   */
  export function around(
    target: HumanGrasp.ITarget,
    turn: number,
  ): HumanGrasp.ITarget;
  /** The same wrapped-axis rotation for the hand-only target view. */
  export function around(target: HumanGrasp.IFrame, turn: number): HumanGrasp.IFrame;
  /**
   * Preserve all supplied target fields while turning only its approach.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The complete and hand-only overloads keep the original world target point, wrapped axis and metre width while turning the inward approach by degrees.
   * @evidence contracts/development/implementation.md#principled-implementation The original Quaternion.fromAxisAngle wrapped-axis turn followed by quaternion-vector rotation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One target spread and one approach transform serve both existing target views.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every original target field is preserved and no collider list, width or contact point is manufactured.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant rigid-transform work with no variable population.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Complete closure and narrow hand goals use this same numerical owner.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh target wrapper and approach vector without retained state.
   */
  export function around(
    target: HumanGrasp.IFrame,
    turn: number,
  ): HumanGrasp.IFrame {
    return {
      ...target,
      approach: Quaternion.rotateVector(
        Quaternion.fromAxisAngle(target.axis, turn),
        target.approach,
      ),
    };
  }
}

/** The original displayed result and scalar reports of one actual key fit. */
interface IFitted {
  /** The fresh canonical pose after all coupled limb and digit fits. */
  pose: IAutoMoviePose;

  /** The displayed wrist frame, world metres and rest-relative rotation. */
  shown: HumanHand.IWrist;

  /** The original hand-degree plus wrist-millimetre error cost. */
  miss: number;

  /** Elbow departure from the key's hint about the reach line, degrees. */
  departure: number;

  /** The key's own judgement, or NaN when it declares none. */
  judged: number;
}
