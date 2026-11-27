import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import type { HumanCarriedCouplingFit } from "./HumanCarriedCouplingFit";

/*
 * A carried body's pelvis set back off the bearer's neck. A seat on the yoke
 * rests the borne seat socket, under the sitting bones, on the top of the back
 * behind the neck, and the pelvis reaches forward of that socket by about its
 * half depth, so on the yoke the front of the pelvis lay in the neck (87 mm for
 * the small woman on the average man's shoulders). The pelvis's colliders are
 * measured against the neck's once on the fitted key, and where they overlap
 * the whole borne body is set back toward the bearer's back across the floor by
 * the overlap over the distance's slope along that direction (read from one
 * more distance at the overlap's depth, since the two meet obliquely), so the
 * pelvis's front comes onto the neck's surface: the pelvis's half depth and the
 * neck's radius less the yoke's place behind the neck, read on the real shapes.
 * A body clear of the neck is left where the fit put it.
 * Parameter bearer: The bearer's body.
 * Parameter borne: The borne body.
 * Parameter read: The fitted key: the placement and both bodies' key bones.
 * Returns: The key, its placement set back when the pelvis meets the neck.
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
          worldRotation: AutoMovieEngineQuaternion.multiply(
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
  const pelvic: IAutoMovieMotionHumanColliders.IPlaced[] = shapes(
    borne,
    placed,
    "hips",
  );
  const neckShapes: IAutoMovieMotionHumanColliders.IPlaced[] = shapes(
    bearer,
    read.theirs,
    "neck",
  );
  // The least signed distance between the pelvis, moved by an offset, and
  // the neck.
  const least = (offset: IAutoMovieVector3): number => {
    let found: number = Infinity;
    for (const m of pelvic)
      for (const y of neckShapes)
        for (const s of m.shapes)
          for (const t of y.shapes)
            found = Math.min(
              found,
              AutoMovieEnginePhysics.physicalShapePairDistance(
                {
                  ...m.pose,
                  position: AutoMovieEngineVector3.add(m.pose.position, offset),
                },
                s,
                y.pose,
                t,
              ),
            );
    return found;
  };
  const gap: number = least({ x: 0, y: 0, z: 0 });
  if (!(gap < 0)) return read;

  // Back across the floor, away from the way the bearer's chest faces. The
  // pelvis meets the neck obliquely (over its top), so the distance grows
  // with a backward shift at the slope of the contact normal on that
  // direction, not one for one: one more distance at the overlap's own
  // depth gives the slope, and the shift is the overlap over it.
  const yaw: number = (HumanFrame.heading(chest.worldRotation) * Math.PI) / 180;
  const backward: IAutoMovieVector3 = {
    x: -Math.sin(yaw),
    y: 0,
    z: -Math.cos(yaw),
  };
  const probe: number = -gap;
  const slope: number = (least(AutoMovieEngineVector3.scale(backward, probe)) - gap) / probe;
  const back: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
    backward,
    slope > 0 ? -gap / slope : probe,
  );
  return {
    ...read,
    fit: {
      ...read.fit,
      place: (point: IAutoMovieVector3): IAutoMovieVector3 =>
        AutoMovieEngineVector3.add(read.fit.place(point), back),
    },
  };
}
