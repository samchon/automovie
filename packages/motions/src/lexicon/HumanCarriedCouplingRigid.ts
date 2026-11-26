import { Quaternion, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
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
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";

/**
 * A carried key pose registered about its resting contact: the borne resting
 * region put exactly on the bearer's and the turn about that point fitted to
 * the row's hold places. The stance fit (`HumanCarriedCouplingFit`) changes the
 * bearer's stance and the borne legs and registers each trial here.
 */
export namespace HumanCarriedCouplingRigid {
  /** A registration and the borne key pose's bones it was read on. */
  export interface IRead {
    /** The rigid placement about the resting contact. */
    fit: IAutoMovieMotionHumanCarriedCouplingFit.IFit;

    /** The borne key pose's resolved bones, at the origin before the placement. */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /**
   * Place the borne key posture's resting region on the bearer's and fit its
   * turn to the row's hold places.
   *
   * @param bearer The bearer's body.
   * @param theirs Its bones in the fitted stance at the origin.
   * @param borne The borne body.
   * @param row The carry's row.
   * @param held The borne region held by each hand, left then right.
   * @param legs The borne legs' three angles, degrees.
   * @param stance The bearer's inclination in degrees and fractional squat
   *   depth.
   * @param swivel Rotation in degrees about the support normal through the
   *   fixed resting point.
   * @returns The placement and the borne key pose's bones it was read on.
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
    stance: IAutoMovieMotionHumanCarriedCouplingFit.IFit["stance"],
    swivel: number = 0,
    keyBones?: ReturnType<typeof HumanTrunk.prepareResolve>,
  ): IRead {
    const keyed: IAutoMovieMotionHumanPosture = HumanCarriedCouplingPose.key(
      row,
      legs,
    );
    const mine: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      keyBones === undefined
        ? HumanTrunk.resolve(borne, keyed)
        : keyBones(keyed);
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
      (side: AutoMovieHumanSide, index: number): void => {
        const hold: IAutoMovieMotionHumanCarried.IHold | null =
          row.holds[index] ?? null;
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
      const heading: IAutoMovieQuaternion = humanPostureHeading(keyed);
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
    const registered: IAutoMovieQuaternion = AutoMovieEngineMath.fitRigidMeshTransform({
      reference: mirrored(restB, from),
      target: mirrored(restT, to),
      vertices: Array.from(
        { length: 2 * from.length },
        (_: unknown, i: number): number => i,
      ),
    }).rotation;
    const support: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
      bearer.surfaces.regions[row.theirs];
    const turn: IAutoMovieQuaternion =
      swivel === 0
        ? registered
        : Quaternion.normalize(
            Quaternion.multiply(
              Quaternion.fromAxisAngle(
                Quaternion.rotateVector(
                  theirs.get(support.bone)!.worldRotation,
                  support.normal,
                ),
                swivel,
              ),
              registered,
            ),
          );
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
