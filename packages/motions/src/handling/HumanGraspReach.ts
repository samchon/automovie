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
   * so the chosen grip is the one the arm keeps over the whole stroke. Each
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
   * @param required What a grip must hold before its cost counts: a measure of its per-key errors (the grasp's, then each stroke key's) and the most it may be. A grip within the bound is chosen before any beyond it; with none within, the one nearest the bound is returned for the caller to refuse. Absent, the least cost alone decides.
   * @returns The best turn and tilt, their goal, the hand the arm achieves for it, and the arm's solution there.
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
    ) => readonly HumanGrasp.IKey[],
    turns: readonly number[] = HumanGrasp.TURNS,
    required?: {
      bound: number;
      measure: (keys: readonly number[]) => number;
    },
  ): HumanGrasp.IReach {
    const limb: IHumanPosture.Limb = side === "left" ? "leftArm" : "rightArm";
    // One key pose fitted: the pose and the error the arm leaves there, the
    // rotation in degrees plus the position in millimetres.
    const fit = (
      key: HumanGrasp.IKey,
      reference: IHumanPosture.IReference | undefined,
    ): {
      pose: IAutoMoviePose;
      shown: HumanHand.IWrist;
      miss: number;
      departure: number;
    } => {
      const pose: IAutoMoviePose = resolveHumanPosture(body, {
        ...key.posture,
        limbs: {
          ...key.posture.limbs,
          [limb]: {
            point: key.wrist.point,
            rotation: key.wrist.rotation,
            bend: key.bend,
            ...(reference === undefined ? {} : { reference }),
          },
        },
      });
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, pose);
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
      const radial = (point: IAutoMovieVector3): IAutoMovieVector3 => {
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
          (2 * Math.acos(dot) * 180) / Math.PI +
          1000 *
            Vector3.length(
              Vector3.subtract(hand.worldPosition, key.wrist.point),
            ),
        departure,
      };
    };
    let best: HumanGrasp.IReach | undefined;
    let least: number = Infinity;

    // With a required measure, a candidate that holds it comes before any
    // that does not, whatever their costs; among those that do not, the one
    // that misses it least is kept, for the caller's refusal.
    let held: boolean = required === undefined;
    let nearest: number = Infinity;
    for (const turn of turns)
      for (const tilt of tilts) {
        const wrist: HumanHand.IWrist = goal(turn, tilt);
        const grasp = fit({ posture, wrist, bend }, undefined);
        const reference: IHumanPosture.IReference =
          resolveHumanPosture.reference(grasp.pose, limb);
        let miss: number = grasp.miss;
        let departure: number = grasp.departure;

        // A candidate's error is the worst over its keys, so it only grows
        // as keys are fitted: once a candidate that holds what is required
        // is found, one already no cheaper is dropped before its remaining
        // keys cost their fits. The choice is the same as with every key
        // fitted.
        const preference: number = 0.01 * (Math.abs(turn) + Math.abs(tilt));
        if (held && miss + departure + preference >= least) continue;
        let beaten: boolean = false;
        const keys: number[] = [grasp.miss];
        for (const key of stroke?.(wrist, grasp.shown) ?? []) {
          const fitted = fit(key, reference);
          keys.push(fitted.miss);
          miss = Math.max(miss, fitted.miss);
          departure = Math.max(departure, fitted.departure);
          if (held && miss + departure + preference >= least) {
            beaten = true;
            break;
          }
        }
        if (beaten) continue;
        const cost: number = miss + departure + preference;
        const measured: number =
          required === undefined ? 0 : required.measure(keys);
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
  export function around(target: HumanGrasp.ITarget, turn: number): HumanGrasp.ITarget {
    return {
      ...target,
      approach: Quaternion.rotateVector(
        Quaternion.fromAxisAngle(target.axis, turn),
        target.approach,
      ),
    };
  }
}
