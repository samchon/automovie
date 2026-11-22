import {
  Quaternion,
  Vector3,
  physicalShapePairDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanCarriedCouplingFit } from "./HumanCarriedCouplingFit";

/**
 * A carried body's pelvis set back off the bearer's neck (#3437). A seat on
 * the yoke rests the borne seat socket, under the sitting bones, on the top
 * of the back behind the neck, and the pelvis reaches forward of that
 * socket by about its half depth, so on the yoke the front of the pelvis
 * lay in the neck (87 mm for the small woman on the average man's
 * shoulders). The pelvis's colliders are measured against the neck's once
 * on the fitted key, and where they overlap the whole borne body is set
 * back by the overlap, toward the bearer's back across the floor, so the
 * pelvis's front comes onto the neck's surface: the pelvis's half depth and
 * the neck's radius less the yoke's place behind the neck, read on the
 * real shapes. A body clear of the neck is left where the fit put it.
 *
 * @param bearer The bearer's body.
 * @param borne The borne body.
 * @param read The fitted key: the placement and both bodies' key bones.
 * @returns The key, its placement set back when the pelvis meets the neck.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the defect, the measured overlap, the direction and the case left alone.
 * @evidence contracts/development/implementation.md#principled-implementation One signed distance between the placed pelvis and neck colliders gives the overlap, and the placement is translated by it along the bearer's backward heading.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The placed pelvis, the neck, their least distance, one translation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shapes are the bodies' own colliders; no depth or radius is typed.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pair of collider placements and their pairwise distances, once per coupling.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per coupling.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned placement closes over one translation.
 */
export function HumanCarriedNeckClear(
  bearer: IAutoMovieMotionHumanBody,
  borne: IAutoMovieMotionHumanBody,
  read: HumanCarriedCouplingFit.IRead,
): HumanCarriedCouplingFit.IRead {
  const pelvis: IAutoMovieResolvedBone | undefined = read.mine.get("hips");
  const neck: IAutoMovieResolvedBone | undefined = read.theirs.get("neck");
  const chest: IAutoMovieResolvedBone | undefined = read.theirs.get("chest");
  if (pelvis === undefined || neck === undefined || chest === undefined)
    return read;

  // The borne pelvis where the fit puts it, and the bearer's neck.
  const placed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    [...read.mine].map(
      ([bone, resolved]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): [
        AutoMovieHumanoidBone,
        IAutoMovieResolvedBone,
      ] => [
        bone,
        {
          ...resolved,
          worldPosition: read.fit.place(resolved.worldPosition),
          worldRotation: Quaternion.multiply(
            read.fit.turn,
            resolved.worldRotation,
          ),
        },
      ],
    ),
  );
  const shapes = (
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieMotionHumanColliders.IPlaced[] =>
    HumanColliders.placed(body, bones).filter(
      (s: IAutoMovieMotionHumanColliders.IPlaced): boolean => s.bone === bone,
    );
  let gap: number = Infinity;
  for (const m of shapes(borne, placed, "hips"))
    for (const y of shapes(bearer, read.theirs, "neck"))
      for (const s of m.shapes)
        for (const t of y.shapes)
          gap = Math.min(gap, physicalShapePairDistance(m.pose, s, y.pose, t));
  if (!(gap < 0)) return read;

  // Back across the floor, away from the way the bearer's chest faces.
  const yaw: number = (HumanFrame.heading(chest.worldRotation) * Math.PI) / 180;
  const back: IAutoMovieVector3 = Vector3.scale(
    { x: Math.sin(yaw), y: 0, z: Math.cos(yaw) },
    gap,
  );
  return {
    ...read,
    fit: {
      ...read.fit,
      place: (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(read.fit.place(point), back),
    },
  };
}
