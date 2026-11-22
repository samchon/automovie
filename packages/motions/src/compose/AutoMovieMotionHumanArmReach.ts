import { Quaternion, ROM_TOLERANCE, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A hand attitude a law asks up to a freedom it declares, read as the
 * equivalent the arm can take at its place, or refused.
 *
 * A law rarely needs one exact hand attitude: a card laid face up rests
 * alike at any heading about the vertical, a utensil's point aims along one
 * axis whatever its roll about it. Asked as one attitude, the hand is sent
 * to an attitude its forearm's twist and its wrist may not reach at the
 * arm's place; the fit then meets it at the nearest end of the twist's
 * range, and as the place moves that nearest end changes and the forearm
 * turns half a turn between two frames. Here each candidate turn of the
 * requested attitude about the free axis is fitted on the arm at its place,
 * within the joints' ranges (the rig's own fit), and the turn whose fitted
 * hand meets its asked attitude is taken, the one nearest the requested turn
 * (or a previous attitude) among those that meet it: the feasible value
 * nearest the desired one (Tolani, Goswami and Badler 2000, Graphical Models
 * 62:353, section 3.2.4). Where no turn is met within the range tolerance,
 * the attitude is refused with the least miss, never clamped in silence.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the defect it removes, the freedom, the method and its source, and the refusal.
 * @evidence contracts/development/design.md#principled-representation World quaternions, a world axis of freedom and the arm's own fitted pose.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reading and its request and result records, read by the laws that hold a hand to an attitude.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The ranges are the rig's own (`resolveHumanPosture`); no angle is tuned and no tolerance is widened.
 */
export namespace AutoMovieMotionHumanArmReach {
  /**
   * What a law asks of the hand: its attitude, the axis it leaves the turn
   * about free, and where the wrist goes for a candidate attitude.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning, frame and unit.
   * @evidence contracts/development/design.md#principled-representation The request in world terms.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only what the reading uses.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IRequest {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The posture the arm is fitted on; its own goal for the arm is replaced. */
    posture: IAutoMovieMotionHumanPosture;

    /** The arm. */
    side: AutoMovieHumanSide;

    /** The elbow's hint, world metres. */
    bend: IAutoMovieVector3;

    /** The attitude the law asks, world. */
    requested: IAutoMovieQuaternion;

    /** The world axis the law leaves the turn about free, unit or not. */
    axis: IAutoMovieVector3;

    /**
     * The wrist's place for a candidate attitude, world metres (a held prop's offset turns with the hand).
     *
     * @evidence contracts/development/common.md#meaningful-documentation States what the member gives, its frame and unit, and why it reads the attitude.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A member's signature; the caller of `attitude`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A member's signature; the caller of `attitude`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A member's signature; the caller of `attitude`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A member's signature; the caller of `attitude`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A member's signature; the caller of `attitude`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A member's signature; the caller of `attitude`, which implements it, carries this claim.
     */
    wrist:(rotation: IAutoMovieQuaternion) => IAutoMovieVector3;

    /** What the refusal names as the action's axis. */
    name: string;
  }

  /**
   * The attitude taken: the requested one turned about the free axis, and
   * the turn in degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning and unit.
   * @evidence contracts/development/design.md#principled-representation A world quaternion and its turn.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the laws read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IResult {
    /** The attitude, world. */
    rotation: IAutoMovieQuaternion;

    /** The turn about the free axis from the requested attitude, degrees. */
    turn: number;
  }

  /** The candidate turns' spacing, degrees: a scan fine enough that a met arc of the twist's 180 degree range holds several candidates. */
  export const STEP: number = 15;

  /** Golden-section steps refining the turn within a step of the least miss: each shrinks the bracket by the golden ratio, so 16 steps leave 15 x 0.618^16, under 0.01 degrees. */
  export const REFINE: number = 16;

  /**
   * The reachable equivalent of a requested attitude, or a refusal.
   *
   * @param request What the law asks.
   * @returns The attitude the arm meets at its place nearest the requested turn.
   * @throws {HumanRefusal} When no turn about the free axis is met within the range tolerance (`ROM_TOLERANCE`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Each candidate is fitted by the rig's own arm fit within its ranges and its hand's attitude miss read off the fitted pose; the first met turn in order of size is taken (Tolani et al. 2000, section 3.2.4), and a met arc narrower than the scan is found by golden-section search on the miss (Kiefer 1953).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan over the turns, one choice, one refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unmet attitude is refused with its least miss; nothing is clamped or widened.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most 360 / STEP + 1 scanned fits and 2 REFINE + 1 refining ones per call, made once per plan by its callers, never per frame; the scan stops at the first met turn.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of its request.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function attitude(request: IRequest): IResult {
    const hand: AutoMovieHumanoidBone = `${request.side}Hand`;
    const axis: IAutoMovieVector3 = Vector3.normalize(request.axis);
    const turned = (turn: number): IAutoMovieQuaternion =>
      Quaternion.normalize(
        Quaternion.multiply(
          Quaternion.fromAxisAngle(axis, turn),
          request.requested,
        ),
      );
    // The fitted hand's miss of a candidate attitude, degrees.
    const missAt = (turn: number): number => {
      const rotation: IAutoMovieQuaternion = turned(turn);
      const pose: IAutoMoviePose = resolveHumanPosture(request.body, {
        ...request.posture,
        limbs: {
          ...request.posture.limbs,
          [`${request.side}Arm`]: {
            point: request.wrist(rotation),
            rotation,
            bend: request.bend,
          },
        },
      });
      return degrees(
        poseBones(request.body, pose, undefined, new Set([hand])).get(hand)!
          .worldRotation,
        rotation,
      );
    };
    let best: IResult | undefined;
    let least: number = Infinity;
    // Turns in the order of their size, alternating sides, so the first met
    // is the nearest the requested attitude.
    for (let k: number = 0; k <= 180 / STEP; ++k)
      for (const sign of k === 0 || k === 180 / STEP ? [1] : [1, -1]) {
        const turn: number = sign * k * STEP;
        const rotation: IAutoMovieQuaternion = turned(turn);
        const miss: number = missAt(turn);
        if (miss <= ROM_TOLERANCE) return { rotation, turn };
        if (miss < least) {
          least = miss;
          best = { rotation, turn };
        }
      }
    // A met arc narrower than the scan's step lies within a step of the
    // least miss: the turn there is refined by golden-section search on the
    // miss (Kiefer 1953), which brackets a single minimum of a unimodal
    // function in a fixed number of fits.
    let lo: number = best!.turn - STEP;
    let hi: number = best!.turn + STEP;
    for (let k: number = 0; k < REFINE; ++k) {
      const a: number = hi - GOLDEN * (hi - lo);
      const b: number = lo + GOLDEN * (hi - lo);
      if (missAt(a) <= missAt(b)) hi = b;
      else lo = a;
    }
    const turn: number = (lo + hi) / 2;
    const refined: number = missAt(turn);
    if (refined <= ROM_TOLERANCE) return { rotation: turned(turn), turn };
    if (refined < least) {
      least = refined;
      best = { rotation: turned(turn), turn };
    }
    throw new HumanRefusal({
      kind: "reach",
      axis: request.name,
      value: least,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: ROM_TOLERANCE,
        unit: "degrees",
      },
      reason: `no turn of the asked hand attitude about its free axis is within the ${request.side} forearm's twist and wrist ranges at its place: the nearest misses by ${least.toFixed(1)} degrees (turned ${best?.turn ?? 0} degrees)`,
      fix: "place the hand where the arm can take the attitude, or free more of the attitude",
    });
  }
}

/** The golden section, (sqrt 5 - 1) / 2. */
const GOLDEN: number = (Math.sqrt(5) - 1) / 2;

/** The angle between two attitudes, degrees, read up to the double cover. */
function degrees(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number {
  const dot: number = Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w);
  return (2 * Math.acos(Math.min(1, dot)) * 180) / Math.PI;
}
