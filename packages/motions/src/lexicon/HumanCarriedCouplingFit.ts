import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  fitRigidMeshTransform,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { HumanCarried } from "./HumanCarried";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";

/**
 * The key pose of a coupled carry placed on a standing bearer (#3437): its
 * resting region exactly on the bearer's, its turn about that point fitted
 * to the row's hold places. `HumanCarriedCoupling` builds the coupling on it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is placed, how and for whom.
 * @evidence contracts/development/design.md#principled-representation A rigid placement as a turn and a point map, Wahba's problem's answer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The placement record and its one builder.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The resting contact is never traded for the holds.
 */
export namespace HumanCarriedCouplingFit {
  /**
   * The key pose's rigid placement on the bearer: its turn and where it
   * puts a point of the key pose at the origin.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two members and their frames.
   * @evidence contracts/development/design.md#principled-representation A rigid map as its turn and its point map, so callers place any point the same way.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The turn and the point map.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The point map keeps the resting contact exact; no caller rebuilds it.
   */
  export interface IFit {
    /** The turn applied after the key pose's own heading, unit quaternion. */
    turn: IAutoMovieQuaternion;

    /**
     * A point of the key pose at the origin, placed on the bearer.
     *
     * @param point World metres on the key pose at the origin.
     * @returns World metres on the standing bearer.
     */
    place(point: IAutoMovieVector3): IAutoMovieVector3;
  }

  /**
   * The key pose placed on a standing bearer: its resting region exactly on
   * the bearer's (raised by the row's `rise`), and its turn about that
   * point the one that best brings each held region to where the bearer's
   * hand holds it by the row (its region and offset in arm lengths).
   *
   * @param bearer The bearer's body.
   * @param theirs The bearer's standing bones.
   * @param borne The borne body.
   * @param row The carry's row.
   * @param held The borne region each bearer hand holds, left then right.
   * @returns The placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is held exactly, what is fitted and the inputs.
   * @evidence contracts/development/implementation.md#principled-implementation The turn about the resting point is Wahba's problem over the hold directions, solved by Horn's absolute orientation (`fitRigidMeshTransform`) on each direction and its mirror about the resting point, so both clouds' centroids are the resting points and only the turn is fitted. With fewer than two holds the key pose's own axes join the directions, so its heading is kept where no hold decides it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resting points, hold directions, one fit, the placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The resting contact is kept exact; the holds take what a rigid key pose leaves, and the bearer's hands reach the held regions where they then lie.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two trunk resolutions and one four-by-four eigen solve, once per coupling.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fit is `fitRigidMeshTransform`, the region places the engine's.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function; the placement closes over two points and a turn.
   */
  export function fit(
    bearer: IHumanBody,
    theirs: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    borne: IHumanBody,
    row: HumanCarried.IRow,
    held: readonly [AutoMovieHumanoidRegion | null, AutoMovieHumanoidRegion | null],
  ): IFit {
    const keyed: IHumanPosture = HumanCarriedCouplingPose.key(row);
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
        const hold: HumanCarried.IHold | null = row.holds[index] ?? null;
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

    // Fewer than two holds leave a turn free: the key pose's own axes keep
    // its heading there.
    if (from.length < 2) {
      const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(keyed);
      for (const axis of [
        { x: arm, y: 0, z: 0 },
        { x: 0, y: 0, z: arm },
      ]) {
        const turned: IAutoMovieVector3 = Quaternion.rotateVector(heading, axis);
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
    return {
      turn,
      place: (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(
          restT,
          Quaternion.rotateVector(turn, Vector3.subtract(point, restB)),
        ),
    };
  }
}
