import { IAutoMovieSweep, IAutoMovieSweepSection } from "@automovie/engine";
import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanTrunkSweep } from "./AutoMovieHumanTrunkSweep";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";

/**
 * A shoulder tube: from the root of the arm beside the acromion out to the mid-upper-arm ring, which the arm shares.
 *
 * The tube starts a share of the deltoid's thickness beside the acromion on the arm's root as the T-posed shoulder carries it: its top at the acromion's height, since the acromion is subcutaneous; its front, back and underside the given multiples of the upper arm's girth radius from the shoulder joint's centre, where the deltoid wraps the humeral head and the axillary folds leave for the chest and the back. A station over the deltoid's belly beyond the acromion lowers the top where the skin dips between the acromion and the arm. The section lies across the arm, its first axis forward like the ring's, so the tube does not twist on its way to the ring. The last row repeats the ring one row before it, so the tube's share of the joined girth is the ring's own.
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
  const root: IExtent = {
    top: frame.acromion.y,
    bottom: frame.shoulder.y - ROOT.below * r,
    front: frame.shoulder.z + ROOT.front * r,
    back: frame.shoulder.z - ROOT.back * r,
  };
  const start: IAutoMovieVector3 = AutoMovieHumanVector.of(
    sign * (frame.acromion.x + DELTOID_SHARE * frame.deltoid),
    (root.top + root.bottom) / 2,
    (root.front + root.back) / 2,
  );
  // the deltoid's belly beyond the acromion, below its top: the skin dips from the acromion over the deltoid toward the arm
  const deltoid: IExtent = {
    top: frame.acromion.y - DELTOID.dip * r,
    bottom: frame.shoulder.y - DELTOID.below * r,
    front: frame.shoulder.z + DELTOID.front * r,
    back: frame.shoulder.z - DELTOID.back * r,
  };
  const length: number = AutoMovieHumanVector.distance(start, ring.frame.origin);
  const at: number = Math.min(S.COLLAR.arm / 2, Math.max(0.05, DELTOID.beyond / Math.abs(ring.frame.origin.x - start.x)));
  // across the arm, first axis forward like the ring's, second the normal crossed with it
  const normal: IAutoMovieVector3 = AutoMovieHumanVector.of(sign, 0, 0);
  const forward: IAutoMovieVector3 = AutoMovieHumanVector.of(0, 0, 1);
  const second: IAutoMovieVector3 = AutoMovieHumanVector.cross(normal, forward);
  // a section spanning the extents, centred on their middle and placed about the spine point there
  const section = (extent: IExtent, spine: IAutoMovieVector3, exponent: number): IAutoMovieSweepSection => {
    const cy: number = (extent.top + extent.bottom) / 2;
    const cz: number = (extent.front + extent.back) / 2;
    const half: { up: number; down: number } =
      second.y < 0
        ? { up: cy - extent.bottom, down: extent.top - cy }
        : { up: extent.top - cy, down: cy - extent.bottom };
    return {
      type: "superellipse",
      right: S.metres(extent.front - cz),
      up: S.metres(half.up),
      left: S.metres(cz - extent.back),
      down: S.metres(half.down),
      exponents: [exponent, exponent, exponent, exponent],
      centre: { x: S.metres(cz - spine.z), y: S.metres((cy - spine.y) * second.y) },
    };
  };
  const rotation: IAutoMovieQuaternion = S.quaternionOf(forward, second, normal);
  const spineAt: IAutoMovieVector3 = AutoMovieHumanVector.of(
    start.x + (ring.frame.origin.x - start.x) * at,
    start.y + (ring.frame.origin.y - start.y) * at,
    start.z + (ring.frame.origin.z - start.z) * at,
  );
  return {
    length,
    sweep: {
      spine: { points: [S.toMetres(start), S.toMetres(ring.frame.origin)], normal: ring.directions[0]! },
      stations: [
        { at: 0, rotation, section: section(root, start, ROOT.exponent) },
        { at, rotation, section: section(deltoid, spineAt, DELTOID.exponent) },
        { at: S.COLLAR.arm, section: S.ringSection(ring, 0), rotation: S.ringRotation(ring, 0) },
        { at: 1, section: S.ringSection(ring, 0), rotation: S.ringRotation(ring, 0) },
      ],
    },
  };
}

/** Top, underside, front and back of a section across the arm, millimetres. */
interface IExtent {
  top: number;
  bottom: number;
  front: number;
  back: number;
}

/** Share of the deltoid's thickness beside the acromion where the tube starts. */
const DELTOID_SHARE: number = 0.3;

/**
 * The arm's root in the T-pose, in upper-arm girth radii from the shoulder joint's centre: front, back and underside, and the squareness of its section. Fitted to the MakeHuman CC0 reference bodies of the four gate identities, sagittal sections at the acromion's lateral edge (front and back) and 20 mm beyond it (underside, clear of the axilla), retargeted onto our T-posed skeleton by the shared calibration harness. Grade: fitted to a CC0 reference.
 */
const ROOT = { front: 1.45, back: 1.13, below: 1.3, exponent: 2.3 } as const;

/**
 * The deltoid's belly in the T-pose, `beyond` millimetres lateral of the acromion: its top `dip` upper-arm girth radii below the acromion, and its front, back and underside in girth radii from the shoulder joint's centre. Fitted to the same MakeHuman sagittal sections 40 mm lateral of the acromion, where the skin over the deltoid lies lowest between the acromion and the arm. Grade: fitted to a CC0 reference.
 */
const DELTOID = { beyond: 40, dip: 0.35, front: 1.16, back: 1.0, below: 1.22, exponent: 2.3 } as const;
