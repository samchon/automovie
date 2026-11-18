import { Quaternion, Vector3, fitRigidMeshTransform } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanCarriedCouplingFit,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";

/**
 * A carried key pose registered about its resting contact: the borne
 * resting region put exactly on the bearer's and the turn about that point
 * fitted to the row's hold places. The stance fit (`HumanCarriedCouplingFit`)
 * changes the bearer's stance and the borne legs and registers each trial
 * here.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the registration fixes, what it fits and who calls it with which postures.
 * @evidence contracts/development/design.md#principled-representation A rigid registration with one fixed point, leaving only its rotation to fit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function and its result record, read by the stance fit; the placement record is the interface's `IFit`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine's rigid registration and the carry's posture and region owners.
 */
export namespace HumanCarriedCouplingRigid {
  /**
   * A registration and the borne key pose's bones it was read on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the placement and the key pose's resolved bones, which the stance fit reads the held regions on.
   * @evidence contracts/development/design.md#principled-representation The registration and the held-region gaps read the same key pose, so its bones are returned beside the placement instead of being resolved a second time.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by `HumanCarriedCouplingFit.fit`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The bones are the ones this registration resolved, never a caller's.
   */
  export interface IRead {
    /** The rigid placement about the resting contact. */
    fit: IAutoMovieMotionHumanCarriedCouplingFit.IFit;

    /** The borne key pose's resolved bones, at the origin before the placement. */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /**
   * Place the borne key posture's resting region on the bearer's and fit
   * its turn to the row's hold places.
   *
   * @param bearer The bearer's body.
   * @param theirs Its bones in the fitted stance at the origin.
   * @param borne The borne body.
   * @param row The carry's row.
   * @param held The borne region held by each hand, left then right.
   * @param legs The borne legs' three angles, degrees.
   * @param stance The bearer's inclination in degrees and fractional squat depth.
   * @returns The placement and the borne key pose's bones it was read on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed contact, the hand fit, each frame and the bones returned with the placement.
   * @evidence contracts/development/implementation.md#principled-implementation Wahba's rotation about the fixed resting point, solved by Horn's absolute orientation on every hold direction and its opposite; the clouds' centroids are the resting points, so translation cannot trade their exact coincidence. With fewer than two holds, the key's two horizontal axes keep the heading its hold does not determine.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The resting points, the hold directions, the orientation and its point map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The carry's provisional row supplies the hold places; the registration introduces no fitted coefficient.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution of the key pose and one rigid registration over at most three directions and their mirrors.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The key pose's bones are returned so the stance fit reads its held regions on them, not on a second resolution of the same key pose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned bones belong to the caller; the placement closes over two points and a turn.
   */
  export function read(
    bearer: IAutoMovieMotionHumanBody,
    theirs: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    borne: IAutoMovieMotionHumanBody,
    row: IAutoMovieMotionHumanCarried.IRow,
    held: readonly [
      AutoMovieHumanoidRegion | null,
      AutoMovieHumanoidRegion | null,
    ],
    legs: readonly [number, number, number],
    stance: { incline: number; depth: number },
  ): IRead {
    const keyed: IAutoMovieMotionHumanPosture = HumanCarriedCouplingPose.key(row, legs);
    const mine: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(borne, keyed);
    const arm: number = bearer.measure.upperArm + bearer.measure.forearm;
    const restT: IAutoMovieVector3 = Vector3.add(
      HumanCarriedCouplingPose.region(bearer, theirs, row.theirs),
      { x: 0, y: (row.rise ?? 0) * arm, z: 0 },
    );
    const restB: IAutoMovieVector3 = HumanCarriedCouplingPose.region(
      borne,
      mine,
      row.mine,
    );
    const from: IAutoMovieVector3[] = [];
    const to: IAutoMovieVector3[] = [];
    (["left", "right"] as const).forEach(
      (side: "left" | "right", index: number): void => {
        const hold: IAutoMovieMotionHumanCarried.IHold | null = row.holds[index] ?? null;
        const region0: AutoMovieHumanoidRegion | null = held[index] ?? null;
        if (hold === null || region0 === null) return;
        const target: IAutoMovieVector3 = Vector3.add(
          HumanCarriedCouplingPose.region(bearer, theirs, hold.region),
          {
            x: (side === "left" ? 1 : -1) * hold.offset.out * arm,
            y: hold.offset.up * arm,
            z: hold.offset.forward * arm,
          },
        );
        from.push(
          Vector3.subtract(
            HumanCarriedCouplingPose.region(borne, mine, region0),
            restB,
          ),
        );
        to.push(Vector3.subtract(target, restT));
      },
    );

    // One direction cannot decide the full orientation.
    if (from.length < 2) {
      const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(keyed);
      for (const axis of [
        { x: arm, y: 0, z: 0 },
        { x: 0, y: 0, z: arm },
      ]) {
        const turned: IAutoMovieVector3 = Quaternion.rotateVector(
          heading,
          axis,
        );
        from.push(turned);
        to.push(turned);
      }
    }
    const mirrored = (
      origin: IAutoMovieVector3,
      directions: readonly IAutoMovieVector3[],
    ): number[] =>
      directions.flatMap((d: IAutoMovieVector3): number[] => {
        const a: IAutoMovieVector3 = Vector3.add(origin, d);
        const b: IAutoMovieVector3 = Vector3.subtract(origin, d);
        return [a.x, a.y, a.z, b.x, b.y, b.z];
      });
    const turn: IAutoMovieQuaternion = fitRigidMeshTransform({
      reference: mirrored(restB, from),
      target: mirrored(restT, to),
      vertices: Array.from(
        { length: 2 * from.length },
        (_: unknown, i: number): number => i,
      ),
    }).rotation;
    const fit: IAutoMovieMotionHumanCarriedCouplingFit.IFit = {
      stance,
      legs,
      turn,
      place: (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(
          restT,
          Quaternion.rotateVector(turn, Vector3.subtract(point, restB)),
        ),
    };
    return { fit, bones: mine };
  }
}
