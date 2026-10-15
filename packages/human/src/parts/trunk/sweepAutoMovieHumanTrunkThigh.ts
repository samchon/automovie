import { IAutoMovieSweep } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanTrunkSweep } from "./AutoMovieHumanTrunkSweep";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { sectionAutoMovieHumanTrunkThigh } from "./sectionAutoMovieHumanTrunkThigh";
import { sweepAutoMovieHumanTrunkBody } from "./sweepAutoMovieHumanTrunkBody";

/**
 * A hip tube: from one trunk row below the crotch down to the mid-thigh ring, which the leg shares.
 *
 * The tube starts level, like the crotch section above it, on its half of the two thighs' contour at the gluteal furrow carried toward the ring's extent by the start's share of the way down to the ring (`sectionAutoMovieHumanTrunkThigh`). The ring's radii are measured from its origin on the femur's axis, which lies off the thigh's own middle, so the spine runs parallel to that offset and the front and back run straight from the start to the ring instead of swinging round a spine through the start's middle; and it starts medial of the half's middle, so its front and back directions meet the half's medial front and back, under the fork's ends on the trunk's midline, and its lateral direction the half's lateral side. The last row repeats the ring, one row before it, so the tube's share of the joined girth is the ring's own.
 *
 * @param props.frame The side's trunk frame
 * @param props.ring The thigh's ring
 * @param props.side The thigh
 * @param props.furrow The two thighs' contour at the gluteal furrow
 * @returns The tube in metres and its spine's length in millimetres
 */
export function sweepAutoMovieHumanTrunkThigh(props: {
  frame: IAutoMovieHumanTrunkFrame;
  ring: IAutoMovieHumanRingShape;
  side: AutoMovieHumanSide;
  furrow: sweepAutoMovieHumanTrunkBody.IContour;
}): { sweep: IAutoMovieSweep; length: number } {
  const S: typeof AutoMovieHumanTrunkSweep = AutoMovieHumanTrunkSweep;
  const { frame, ring, furrow } = props;
  const L: IAutoMovieHumanTrunkFrame.ILevels = frame.levels;
  const sign: 1 | -1 = props.side === "left" ? 1 : -1;
  const y: number = L.crotch - (L.axilla - L.crotch) / S.LOWER_ROWS;
  const w: number = Math.min(1, Math.max(0, (L.gluteal - y) / (L.gluteal - ring.frame.origin.y)));
  const lerp = (a: number, b: number): number => a + (b - a) * w;
  const xs: number[] = ring.positions.map((p: IAutoMovieVector3): number => p.x);
  const zs: number[] = ring.positions.map((p: IAutoMovieVector3): number => p.z);
  const outer: number = lerp(furrow.half, Math.max(...xs.map((x: number): number => sign * x)));
  const depth: number = lerp(furrow.depth, (Math.max(...zs) - Math.min(...zs)) / 2);
  const centre: number = lerp(furrow.centre, (Math.max(...zs) + Math.min(...zs)) / 2);
  const shift: { x: number; z: number } = {
    x: (Math.max(...xs) + Math.min(...xs)) / 2 - ring.frame.origin.x,
    z: (Math.max(...zs) + Math.min(...zs)) / 2 - ring.frame.origin.z,
  };
  const start: IAutoMovieVector3 = AutoMovieHumanVector.of(
    (sign * outer) / 2 - shift.x - sign * MEDIAL_OFFSET * (outer / 2),
    y,
    centre - shift.z,
  );
  // the ring's first axis faces back, so its section starts half a turn round
  const half: number = ring.count / 2;
  return {
    length: AutoMovieHumanVector.distance(start, ring.frame.origin),
    sweep: {
      spine: { points: [S.toMetres(start), S.toMetres(ring.frame.origin)], normal: { x: 0, y: 0, z: -1 } },
      stations: [
        {
          at: 0,
          // level like the crotch section above it, first axis backward, second toward the person's left
          rotation: S.quaternionOf({ x: 0, y: 0, z: -1 }, { x: 1, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }),
          section: sectionAutoMovieHumanTrunkThigh({
            side: sign,
            centre,
            depth,
            half: outer,
            exponent: S.FORK_EXPONENT,
            medial: S.MEDIAL_EXPONENT,
            start: { x: start.x, z: start.z },
          }),
        },
        { at: S.COLLAR.thigh, section: S.ringSection(ring, half), rotation: S.ringRotation(ring, half) },
        { at: 1, section: S.ringSection(ring, half), rotation: S.ringRotation(ring, half) },
      ],
    },
  };
}

/** How far medial of its half's middle each thigh tube's spine starts, as a share of the half's half-width. */
const MEDIAL_OFFSET: number = 0.5;
