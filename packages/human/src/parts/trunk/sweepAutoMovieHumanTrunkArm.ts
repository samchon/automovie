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
 * The tube starts a share of the deltoid's thickness beside the acromion on the arm's root as the T-posed shoulder carries it: its top a little below the acromion, which the raised arm's deltoid rises beside; its front, back and underside the given multiples of the upper arm's girth radius from the shoulder joint's centre, where the deltoid wraps the humeral head and the axillary folds leave for the chest and the back. From there the tube runs straight to the ring, so its girth falls monotonically. The section lies across the arm, its first axis forward like the ring's, so the tube does not twist on its way to the ring. The last row repeats the ring one row before it, so the tube's share of the joined girth is the ring's own.
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
  const root: { top: number; bottom: number; front: number; back: number } = {
    top: frame.acromion.y - ROOT.top * r,
    bottom: frame.shoulder.y - ROOT.below * r,
    front: frame.shoulder.z + ROOT.front * r,
    back: frame.shoulder.z - ROOT.back * r,
  };
  const start: IAutoMovieVector3 = AutoMovieHumanVector.of(
    sign * (frame.acromion.x + DELTOID_SHARE * frame.deltoid),
    (root.top + root.bottom) / 2,
    (root.front + root.back) / 2,
  );
  // across the arm, first axis forward like the ring's, second the normal crossed with it
  const normal: IAutoMovieVector3 = AutoMovieHumanVector.of(sign, 0, 0);
  const forward: IAutoMovieVector3 = AutoMovieHumanVector.of(0, 0, 1);
  const second: IAutoMovieVector3 = AutoMovieHumanVector.cross(normal, forward);
  const half: { up: number; down: number } =
    second.y < 0
      ? { up: start.y - root.bottom, down: root.top - start.y }
      : { up: root.top - start.y, down: start.y - root.bottom };
  return {
    length: AutoMovieHumanVector.distance(start, ring.frame.origin),
    sweep: {
      spine: {
        points: [S.toMetres(start), S.toMetres(ring.frame.origin)],
        normal: ring.directions[0]!,
      },
      stations: [
        {
          at: 0,
          rotation: S.quaternionOf(forward, second, normal),
          section: {
            type: "superellipse",
            right: S.metres(root.front - start.z),
            up: S.metres(half.up),
            left: S.metres(start.z - root.back),
            down: S.metres(half.down),
            exponents: [
              ROOT.exponent,
              ROOT.exponent,
              ROOT.exponent,
              ROOT.exponent,
            ],
          },
        },
        {
          at: S.COLLAR.arm,
          section: S.ringSection(ring, 0),
          rotation: S.ringRotation(ring, 0),
        },
        {
          at: 1,
          section: S.ringSection(ring, 0),
          rotation: S.ringRotation(ring, 0),
        },
      ],
    },
  };
}

/** Share of the deltoid's thickness beside the acromion where the tube starts. */
const DELTOID_SHARE: number = 0.3;

/**
 * The arm's root in the T-pose, in upper-arm girth radii: its top below the acromion, and its front, back and underside from the shoulder joint's centre, with the squareness of its section. The raised arm pushes the deltoid up beside the acromion, so the skin over the acromion lies lowest and rises over the deltoid toward the arm. Front, back and top fitted to the reference bodies nearest the four gate identities (two lean young women, a lean young man and a muscular young man), sagittal sections 10 to 20 mm lateral of the acromion at each body's own measurements, on our T-posed skeleton; the underside, where those sections still cut the chest wall below the axilla, keeps the MakeHuman CC0 fit. Grade: fitted to reference bodies.
 */
const ROOT = {
  top: 0.4,
  front: 1.42,
  back: 1.84,
  below: 1.54,
  exponent: 2.3,
} as const;
