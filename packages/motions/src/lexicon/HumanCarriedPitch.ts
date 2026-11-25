import {
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";
import type { HumanCarriedCouplingFit } from "./HumanCarriedCouplingFit";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";

/**
 * A borne body pitched forward over its supports. The key's rigid registration
 * turns the borne body until its held regions point at the bearer's hands, and
 * a straddling ride on the shoulders came out leaning back about 20 degrees,
 * its centre of mass behind its seat, the rearmost of its supports. No share of
 * weight among supports all ahead of the centre can hold it (the shares' centre
 * must lie under the centre of mass). Where a straddling body, off its feet,
 * has its centre behind every support, the whole borne body is pitched forward
 * about the rearmost one, by the angle that brings the centre over it, in
 * closed form: the centre's lever about that point in the bearer's sagittal
 * plane, turned until its forward reach is nil. A body already over its
 * supports is left as the fit put it.
 *
 * @param borne The borne body.
 * @param row The carry's row.
 * @param held The borne regions the bearer's hands hold.
 * @param read The fitted key: the placement and both bodies' key bones.
 * @returns The key, pitched forward when the centre lies behind every support.
 */
export function HumanCarriedPitch(
  borne: IAutoMovieMotionHumanBody,
  row: IAutoMovieMotionHumanCarried.IRow,
  held: readonly [
    AutoMovieHumanoidRegion | null,
    AutoMovieHumanoidRegion | null,
  ],
  read: HumanCarriedCouplingFit.IRead,
): HumanCarriedCouplingFit.IRead {
  // Only a straddling ride is off its feet; a body walking beside its helper
  // stands on its own feet, which bear what its contacts on the helper do not.
  const chest: IAutoMovieResolvedBone | undefined = read.theirs.get("chest");
  if (row.straddles !== true || chest === undefined) return read;

  // The bearer's forward and left across the floor.
  const yaw: number = (HumanFrame.heading(chest.worldRotation) * Math.PI) / 180;
  const forward: IAutoMovieVector3 = {
    x: Math.sin(yaw),
    y: 0,
    z: Math.cos(yaw),
  };
  const left: IAutoMovieVector3 = { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) };

  // The supports where the fit places them, and the borne centre of mass.
  const supports: IAutoMovieVector3[] = [row.mine, ...held]
    .filter(
      (
        region: AutoMovieHumanoidRegion | null,
      ): region is AutoMovieHumanoidRegion => region !== null,
    )
    .map(
      (region: AutoMovieHumanoidRegion): IAutoMovieVector3 =>
        read.fit.place(
          HumanCarriedCouplingPose.region(borne, read.mine, region),
        ),
    );
  const centre: IAutoMovieVector3 = read.fit.place(
    resolveAutoMovieCenterOfMass.place(borne.massModel, read.mine),
  );
  const ahead = (point: IAutoMovieVector3): number =>
    Vector3.dot(point, forward);
  const rearmost: IAutoMovieVector3 = supports.reduce(
    (a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 =>
      ahead(b) < ahead(a) ? b : a,
  );
  const lever: IAutoMovieVector3 = Vector3.subtract(centre, rearmost);
  const out: number = Vector3.dot(lever, forward);
  if (!(out < 0) || !(lever.y > 0)) return read;

  // Pitch forward about the rearmost support, about the bearer's left: the
  // turn that carries up toward forward until the centre's reach is nil.
  const degrees: number = (Math.atan2(-out, lever.y) * 180) / Math.PI;
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(left, degrees);
  return {
    ...read,
    fit: {
      ...read.fit,
      turn: Quaternion.multiply(turn, read.fit.turn),
      place: (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(
          rearmost,
          Quaternion.rotateVector(
            turn,
            Vector3.subtract(read.fit.place(point), rearmost),
          ),
        ),
    },
  };
}
