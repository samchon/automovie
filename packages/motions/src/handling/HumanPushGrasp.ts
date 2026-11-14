import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The grasp a pushing hand takes on a handle it keeps through the push: of
 * the turns about the handle its symmetry makes the same grasp
 * (`IAutoMovieAffordance.symmetry`: the whole way round a round post, half a
 * turn a flat bar, none else) and the places along its grip band (`BAND`),
 * the one whose fist the arm, fitted with the wrist inside its range, keeps
 * nearest its handle when it takes it and at `SAMPLES` of the push after,
 * the authored grasp first. A fist the wrist cannot hold as the forearm
 * slopes down to a low handle loses to one it can.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the freedoms, the judge, the instants and the preference.
 * @evidence contracts/development/design.md#principled-representation A grasp is the handle's frame turned and slid within what the handle's symmetry and band allow; it is judged by the fitted arm, which counts the wrist's and the forearm's ranges.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The handle, the stage, the choice and one chooser, used by `pushSled`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No turn is assumed; the freedoms are the handle's own.
 */
export namespace HumanPushGrasp {
  /** The turns about a round handle tried, degrees: the whole way round in steps of 30, the authored side first. */
  export const AROUND: readonly number[] = [
    0, 30, -30, 60, -60, 90, -90, 120, -120, 150, -150, 180,
  ];

  /** The places along a handle's grip band tried, shares of the band's length from its middle. */
  export const BAND: readonly number[] = [0, -0.3, 0.3];

  /** The instants of the push after the grip a grasp is judged at, shares of the push. */
  export const SAMPLES: readonly number[] = [0.25, 0.5, 0.75, 1];

  /** A handle where it stands at the grip. */
  export interface IHandle {
    /** Its frame: the point, the palm's way in (`normal`) and the wrapped axis (`forward`). */
    frame: HumanHand.IFrame;

    /** How its grasp repeats about the wrapped axis. */
    symmetry: IAutoMovieAffordance["symmetry"];

    /** Its grip band's length along the wrapped axis, metres, when declared. */
    length: number | undefined;
  }

  /** What the pushing body is at the grip and through the push. */
  export interface IStage {
    /** The posture the handles are taken in. */
    taking: IHumanPosture;

    /** The postures at `SAMPLES` of the push. */
    pushing: readonly IHumanPosture[];

    /** Where a wrist taken at the grip is carried to on a pushing posture, and the load's turn there. */
    carry(
      posture: IHumanPosture,
      wrist: IAutoMovieVector3,
    ): { point: IAutoMovieVector3; turn: IAutoMovieQuaternion };

    /** The elbow's bend hint on a posture. */
    elbow(posture: IHumanPosture, side: HumanHand.Side): IAutoMovieVector3;
  }

  /** A chosen grasp: the wrist the arm takes it with, and the worst its fist strays from the handle. */
  export interface IChoice {
    /** The wrist the arm takes the grasp with at the grip, world: the grasp asked, its turn given way where the wrist's range ends. */
    wrist: HumanHand.IWrist;

    /** The worst its fist strays from the handle at the grip and through the push, metres. */
    off: number;
  }

  /**
   * Choose a hand's grasp on its handle.
   *
   * @param body The body.
   * @param stage The pushing body.
   * @param handle The handle.
   * @param side The hand.
   * @returns The grasp.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each candidate's fist placed by the grasp's own frame (`HumanHand.reach`) and fitted by the posture resolver with the grip socket as the contact, so a wrist past its range shows as a fist off the handle; the worst over the grip and the samples is the candidate's miss.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Every candidate fitted at the grip, then through the push nearest at the grip first.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A candidate is dropped only once it misses at least the best so far, and the search ends only at a grip miss no later candidate can better, so the choice is the whole grid's.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most 36 grip fits, then the push's four fits only for candidates whose grip miss is under the best so far, each stopped at its first fit that reaches it: a branch and bound over the grid.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per hand per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function take(
    body: IHumanBody,
    stage: IStage,
    handle: IHandle,
    side: HumanHand.Side,
  ): IChoice {
    const socket: IAutoMovieVector3 = HumanHand.offset(
      body,
      side,
      "grip",
      "fist",
    ).point;
    const fit = (
      posture: IHumanPosture,
      wrist: HumanHand.IWrist,
    ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
      limbs[`${side}Arm`] = {
        point: wrist.point,
        rotation: wrist.rotation,
        contact: socket,
        bend: stage.elbow(posture, side),
      };
      return poseBones(body, resolveHumanPosture(body, { ...posture, limbs }));
    };
    const { frame: at, symmetry, length } = handle;
    const turns: readonly number[] =
      symmetry === "round" ? AROUND : symmetry === "half" ? [0, 180] : [0];
    const along: readonly number[] = (length === undefined ? [0] : BAND).map(
      (share: number): number => share * (length ?? 0),
    );
    // Every candidate taken at the grip, in the authored order: the point
    // on the handle, the wrist the arm takes it with and the fist's miss.
    type Candidate = {
      point: IAutoMovieVector3;
      got: HumanHand.IWrist;
      off: number;
    };
    const candidates: Candidate[] = [];
    for (const shift of along)
      for (const degrees of turns) {
        const point: IAutoMovieVector3 = Vector3.add(
          at.point,
          Vector3.scale(at.forward, shift),
        );
        const asked: HumanHand.IWrist = HumanHand.reach(
          body,
          side,
          "grip",
          {
            point,
            normal: Quaternion.rotateVector(
              Quaternion.fromAxisAngle(at.forward, degrees),
              at.normal,
            ),
            forward: at.forward,
          },
          "fist",
        );
        const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          fit(stage.taking, asked);
        const hand: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
        candidates.push({
          point,
          got: { point: hand.worldPosition, rotation: hand.worldRotation },
          off: Vector3.length(
            Vector3.subtract(
              HumanHand.frame(body, bones, side, "grip", "fist").point,
              point,
            ),
          ),
        });
      }
    // Then through the push, nearest at the grip first: a candidate's miss
    // is at least its miss at the grip, so none after one whose grip miss
    // reaches the best can do better.
    candidates.sort((a: Candidate, b: Candidate): number => a.off - b.off);
    let best: IChoice | undefined;
    for (const { point, got, off: gripped } of candidates) {
      if (best !== undefined && gripped >= best.off) break;
      let off: number = gripped;
      // Through the push the hands and the load are carried as one.
      for (const posture of stage.pushing) {
        if (best !== undefined && off >= best.off) break;
        const carried: {
          point: IAutoMovieVector3;
          turn: IAutoMovieQuaternion;
        } = stage.carry(posture, got.point);
        const wrist: HumanHand.IWrist = {
          point: carried.point,
          rotation: Quaternion.normalize(
            Quaternion.multiply(carried.turn, got.rotation),
          ),
        };
        off = Math.max(
          off,
          Vector3.length(
            Vector3.subtract(
              HumanHand.frame(body, fit(posture, wrist), side, "grip", "fist")
                .point,
              Vector3.add(
                carried.point,
                Quaternion.rotateVector(
                  carried.turn,
                  Vector3.subtract(point, got.point),
                ),
              ),
            ),
          ),
        );
      }
      if (best === undefined || off < best.off - 1e-6)
        best = { wrist: got, off };
    }
    return best!;
  }
}
