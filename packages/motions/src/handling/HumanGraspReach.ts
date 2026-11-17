import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGraspSearch } from "./HumanGraspSearch";

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
   * (`HumanPosture.IGoal.reference`).
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
   * @evidence contracts/development/implementation.md#principled-implementation Keeps exact lower-bound ordering and every coupled posture fit, re-admitting current raw posture each time. Full FK precedes original eager elbow departure and attitude dot; the optional judge remains the final fit callback.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates to HumanGraspSearch's single admission, coupled fit, ordered stroke and judgement owner, with this facade retaining the existing public signature/defaults.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No key, legal fit, error, bound, candidate or preference changes; the original required-first and least-miss fallback choices remain.
   * @evidence contracts/development/implementation.md#efficient-algorithms Original coordinate enumeration, optional interleaved goal/admission pass, selected goal/fit pass, full eager observations and lower-bound pruning all remain. One exact operation FK reader can share unchanged dependencies while admitting all current values, without a measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Arbitrary goal, admission, stroke, required and judge callbacks may mutate inputs; the common numerical owner never infers fixed direct geometry from posture identity or private callback purity. Every current full fit and original goal invocation remains actual.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Candidate poses/report closures, fixed name readers and one exact FK workspace are local to the search; report hints are scalar snapshots and no report closure escapes. Only the chosen original pose, wrist, reference and scalar reports are returned without a reader or search map.
   */
  export function reachable(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    bend: IAutoMovieVector3,
    goal: (turn: number, tilt: number) => IAutoMovieMotionHumanHand.IWrist,
    tilts: readonly number[] = [0],
    stroke?: (
      wrist: IAutoMovieMotionHumanHand.IWrist,
      shown: IAutoMovieMotionHumanHand.IWrist,
    ) => Iterable<IAutoMovieMotionHumanGrasp.IKey>,
    turns: readonly number[] = HumanGrasp.TURNS,
    required?: {
      bound: number;
      measure: (
        keys: readonly number[],
        judged: readonly number[],
        bounds: readonly number[],
      ) => number;
    },
    admits?: (wrist: IAutoMovieMotionHumanHand.IWrist) => boolean,
  ): IAutoMovieMotionHumanGrasp.IReach {
    return HumanGraspSearch(body, posture, side, bend)(goal, tilts, stroke, turns, required, admits);
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
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >,
  ): IAutoMovieMotionHumanPosture {
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
    target: IAutoMovieMotionHumanGrasp.ITarget,
    turn: number,
  ): IAutoMovieMotionHumanGrasp.ITarget;
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
