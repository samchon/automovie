import { IAutoMovieSweep } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanTrunkSweep } from "./AutoMovieHumanTrunkSweep";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";

/**
 * A shoulder tube: from inside the trunk's opening on the flank out to the mid-upper-arm ring, which the arm shares.
 *
 * The tube starts beside the acromion, a share of the deltoid's thickness out, at the shoulder joint's height and depth, on a circle a little fuller than the upper arm's girth, and its last row repeats the ring one row before it, so the tube's share of the joined girth is the ring's own.
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
  const start: IAutoMovieVector3 = AutoMovieHumanVector.of(
    sign * (frame.acromion.x + DELTOID_SHARE * frame.deltoid),
    frame.shoulder.y,
    frame.shoulder.z,
  );
  return {
    length: AutoMovieHumanVector.distance(start, ring.frame.origin),
    sweep: {
      spine: { points: [S.toMetres(start), S.toMetres(ring.frame.origin)], normal: ring.directions[0]! },
      stations: [
        { at: 0, section: S.circle((FULLNESS * frame.armGirth) / (2 * Math.PI)) },
        { at: S.COLLAR.arm, section: S.ringSection(ring, 0), rotation: S.ringRotation(ring, 0) },
        { at: 1, section: S.ringSection(ring, 0), rotation: S.ringRotation(ring, 0) },
      ],
    },
  };
}

/** Share of the deltoid's thickness beside the acromion where the tube starts. */
const DELTOID_SHARE: number = 0.3;

/** The tube's first circle over the upper arm's girth circle. */
const FULLNESS: number = 1.2;
