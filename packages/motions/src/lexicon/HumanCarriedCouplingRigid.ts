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
import type { HumanCarriedCouplingFit } from "./HumanCarriedCouplingFit";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";

/**
 * A carried key pose registered about its resting contact. The stance fit
 * changes the two postures; this registration places each trial without
 * trading the resting contact for the hand targets.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which part of a coupled placement is owned here and which operation changes its input postures.
 * @evidence contracts/development/design.md#principled-representation A rigid registration with one fixed point, leaving only its rotation to fit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface fit preserves the placement entry; read additionally exposes that same registration's fresh borne source frames to its immediate gap reader, while the placement record stays with the stance fitter.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine's rigid registration and the carry's posture and region owners.
 */
export namespace HumanCarriedCouplingRigid {
  /**
   * One actual registration and the fresh source frames it used.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the fitted placement and its same-query borne key-pose frames, borrowed read-only by the immediate wrist-gap calculation.
   * @evidence contracts/development/design.md#principled-representation Both registration and surface gaps read one identical raw key posture, so its actual FK map belongs beside the derived rigid placement rather than another solve.
   * @evidence contracts/development/design.md#minimal-and-owned-surface read produces both members for CouplingFit.gaps; ordinary fit returns only the existing placement.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains actual freshly resolved frames, not a caller-supplied placement, cached pose or asserted resolution marker.
   */
  export interface IRead {
    /** The actual rigid placement about the original fixed resting contact. */
    fit: HumanCarriedCouplingFit.IFit;
    /** Fresh borne key-pose frames used by this exact registration. */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /**
   * The original placement entry, using the same actual registration owner.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Preserves the existing bearer/borne/row/held/legs/stance inputs and rigid placement result.
   * @evidence contracts/development/implementation.md#principled-implementation Returns the actual fixed-contact rigid registration computed by read without changing inputs or numerical policy.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation and placement selection; read owns key FK, direction construction and the engine registration.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fitted pose, source map or numerical answer is supplied by the caller or substituted from another query.
   * @evidence contracts/development/implementation.md#efficient-algorithms Keeps one key FK and registration, adding only constant result selection.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the original actual registration owner with the immediate-gap producer; each standalone call still computes its own current placement.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Discards the temporary frame-map observation and returns only the existing placement closing over its two points and turn, with no global result or query history.
   */
  export function fit(
    bearer: IHumanBody, theirs: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    borne: IHumanBody, row: HumanCarried.IRow,
    held: readonly [AutoMovieHumanoidRegion | null, AutoMovieHumanoidRegion | null],
    legs: readonly [number, number, number], stance: { incline: number; depth: number },
  ): HumanCarriedCouplingFit.IFit {
    return read(bearer, theirs, borne, row, held, legs, stance).fit;
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
   * @returns The placement and the actual fresh borne key frames used by it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed contact, the hand fit, each frame and the fitted parameters returned with the map.
   * @evidence contracts/development/implementation.md#principled-implementation Wahba's rotation about the fixed resting point, solved by Horn's absolute orientation on every hold direction and its opposite; the clouds' centroids are the resting points, so translation cannot trade their exact coincidence. With fewer than two holds, the key's two horizontal axes keep the heading its hold does not determine.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The resting points, the hold directions, the orientation and its point map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The carry's existing provisional row supplies the preferred hold places; the registration introduces no fitted coefficient.
   * @evidence contracts/development/implementation.md#efficient-algorithms One key-pose FK and one rigid registration over at most three direction pairs. CouplingFit's immediate gap reader consumes these same actual frames instead of converting/admitting/resolving the identical key again; every current placement and gap still executes, without a measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same immutable body/row/leg parameters determine the raw key for registration and its immediate held-region gaps. One genuine freshly computed map serves both; no prior query or caller map proves reuse, and the original region and rigid-fit owners retain their math.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned frame map belongs to this query and is consumed read-only before release; the placement closes over its two points and turn. No FK reader, source pose, body result pool or candidate history is retained by this producer.
   */
  export function read(
    bearer: IHumanBody,
    theirs: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    borne: IHumanBody,
    row: HumanCarried.IRow,
    held: readonly [
      AutoMovieHumanoidRegion | null,
      AutoMovieHumanoidRegion | null,
    ],
    legs: readonly [number, number, number],
    stance: { incline: number; depth: number },
  ): IRead {
    const keyed: IHumanPosture = HumanCarriedCouplingPose.key(row, legs);
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
    const fit: HumanCarriedCouplingFit.IFit = {
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
