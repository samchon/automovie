import { IAutoMovieSweep } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanTrunkSweep } from "./AutoMovieHumanTrunkSweep";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";

/**
 * A shoulder tube: from the root of the arm beside the acromion out to the mid-upper-arm ring, which the arm shares.
 *
 * The tube starts a share of the deltoid's thickness beside the acromion on the arm's root as the T-posed shoulder carries it: its top at the acromion's height, since the acromion is subcutaneous; its front, back and underside the given multiples of the upper arm's girth radius from the shoulder joint's centre, where the deltoid wraps the humeral head and the axillary folds leave for the chest and the back. The section lies across the arm, its first axis forward like the ring's, so the tube does not twist on its way to the ring. The last row repeats the ring one row before it, so the tube's share of the joined girth is the ring's own.
 *
 * @param props.frame The side's trunk frame
 * @param props.ring The upper arm's ring
 * @param props.side The arm
 * @returns The tube in metres and its spine's length in millimetres
 */
export function sweepAutoMovieHumanTrunkArm(props: {
  frame: IAutoMovieHumanTrunkFrame;
  ring: IAutoMovieHumanRingShape;
  side: AutoMovieHumanSide;
}): { sweep: IAutoMovieSweep; length: number } {
  const S: typeof AutoMovieHumanTrunkSweep = AutoMovieHumanTrunkSweep;
  const { frame, ring } = props;
  const sign: number = props.side === "left" ? 1 : -1;
  const r: number = frame.armGirth / (2 * Math.PI);
  const extent = {
    top: frame.acromion.y,
    bottom: frame.shoulder.y - ROOT.below * r,
    front: frame.shoulder.z + ROOT.front * r,
    back: frame.shoulder.z - ROOT.back * r,
  };
  const start: IAutoMovieVector3 = AutoMovieHumanVector.of(
    sign * (frame.acromion.x + DELTOID_SHARE * frame.deltoid),
    (extent.top + extent.bottom) / 2,
    (extent.front + extent.back) / 2,
  );
  // across the arm, first axis forward like the ring's, second the normal crossed with it
  const normal: IAutoMovieVector3 = AutoMovieHumanVector.of(sign, 0, 0);
  const forward: IAutoMovieVector3 = AutoMovieHumanVector.of(0, 0, 1);
  const second: IAutoMovieVector3 = AutoMovieHumanVector.cross(normal, forward);
  const along = (direction: IAutoMovieVector3): number =>
    direction.y > 0.5
      ? extent.top - start.y
      : direction.y < -0.5
        ? start.y - extent.bottom
        : direction.z > 0.5
          ? extent.front - start.z
          : start.z - extent.back;
  return {
    length: AutoMovieHumanVector.distance(start, ring.frame.origin),
    sweep: {
      spine: { points: [S.toMetres(start), S.toMetres(ring.frame.origin)], normal: ring.directions[0]! },
      stations: [
        {
          at: 0,
          rotation: S.quaternionOf(forward, second, normal),
          section: {
            type: "superellipse",
            right: S.metres(along(forward)),
            up: S.metres(along(second)),
            left: S.metres(along(AutoMovieHumanVector.of(0, 0, -1))),
            down: S.metres(along(AutoMovieHumanVector.of(-second.x, -second.y, -second.z))),
            exponents: [ROOT.exponent, ROOT.exponent, ROOT.exponent, ROOT.exponent],
          },
        },
        { at: S.COLLAR.arm, section: S.ringSection(ring, 0), rotation: S.ringRotation(ring, 0) },
        { at: 1, section: S.ringSection(ring, 0), rotation: S.ringRotation(ring, 0) },
      ],
    },
  };
}

/** Share of the deltoid's thickness beside the acromion where the tube starts. */
const DELTOID_SHARE: number = 0.3;

/**
 * The arm's root in the T-pose, in upper-arm girth radii from the shoulder joint's centre: front, back and underside, and the squareness of its section. Fitted to the MakeHuman CC0 reference bodies of the four gate identities, sagittal sections at the acromion's lateral edge (front and back) and 20 mm beyond it (underside, clear of the axilla), retargeted onto our T-posed skeleton by the shared calibration harness. Grade: fitted to a CC0 reference.
 */
const ROOT = { front: 1.45, back: 1.13, below: 1.3, exponent: 2.3 } as const;
