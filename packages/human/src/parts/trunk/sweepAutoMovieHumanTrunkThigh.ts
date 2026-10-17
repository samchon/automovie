import { IAutoMovieSweep } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanTrunkSweep } from "./AutoMovieHumanTrunkSweep";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { sweepAutoMovieHumanTrunkBody } from "./sweepAutoMovieHumanTrunkBody";

/**
 * The straight support between the pinned thigh collar and its shared mid-thigh ring.
 *
 * The collar keeps the preceding layout's spacing, derived from its trunk-row support and ring frame. The nonplanar groin/trunk boundary reaches this collar directly through a Hermite patch; no separate medial section presses the two thigh surfaces onto the midline. Both emitted stations use the ring's section and frame so the neighboring ring loops continue along its axis.
 *
 * @param props.frame The side's trunk frame
 * @param props.ring The shared mid-thigh ring
 * @param props.side The thigh
 * @param props.furrow Existing contour used to preserve the collar spacing
 * @param props.row The existing neighboring trunk row height, millimetres
 * @returns The support sweep in metres and the collar's distance back from the ring, millimetres
 */
export function sweepAutoMovieHumanTrunkThigh(props: {
  frame: IAutoMovieHumanTrunkFrame;
  ring: IAutoMovieHumanRingShape;
  side: AutoMovieHumanSide;
  furrow: sweepAutoMovieHumanTrunkBody.IContour;
  row: number;
}): { sweep: IAutoMovieSweep; collar: number } {
  const S: typeof AutoMovieHumanTrunkSweep = AutoMovieHumanTrunkSweep;
  const { frame, ring, furrow }: typeof props = props;
  const L: IAutoMovieHumanTrunkFrame.ILevels = frame.levels;
  const sign: 1 | -1 = props.side === "left" ? 1 : -1;
  const y: number = L.crotch - props.row;
  const w: number = Math.min(
    1,
    Math.max(0, (L.gluteal - y) / (L.gluteal - ring.frame.origin.y)),
  );
  const lerp: (a: number, b: number) => number = (
    a: number,
    b: number,
  ): number => a + (b - a) * w;
  const xs: number[] = ring.positions.map(
    (p: IAutoMovieVector3): number => p.x,
  );
  const zs: number[] = ring.positions.map(
    (p: IAutoMovieVector3): number => p.z,
  );
  const outer: number = lerp(
    furrow.half,
    Math.max(...xs.map((x: number): number => sign * x)),
  );
  const centre: number = lerp(
    furrow.centre,
    (Math.max(...zs) + Math.min(...zs)) / 2,
  );
  const shift: { x: number; z: number } = {
    x: (Math.max(...xs) + Math.min(...xs)) / 2 - ring.frame.origin.x,
    z: (Math.max(...zs) + Math.min(...zs)) / 2 - ring.frame.origin.z,
  };
  const start: IAutoMovieVector3 = AutoMovieHumanVector.of(
    (sign * outer) / 2 - shift.x - sign * MEDIAL_OFFSET * (outer / 2),
    y,
    centre - shift.z,
  );
  const collar: number =
    (1 - S.COLLAR.thigh) *
    AutoMovieHumanVector.distance(start, ring.frame.origin);
  const normal: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    ring.frame.normal,
  );
  const origin: IAutoMovieVector3 = AutoMovieHumanVector.offset(
    ring.frame.origin,
    [normal, -collar],
  );
  const half: number = ring.count / 2;
  return {
    collar,
    sweep: {
      spine: {
        points: [S.toMetres(origin), S.toMetres(ring.frame.origin)],
        normal: S.rotate(S.ringRotation(ring, half), { x: 1, y: 0, z: 0 }),
      },
      stations: [
        {
          at: 0,
          section: S.ringSection(ring, half),
          rotation: S.ringRotation(ring, half),
        },
        {
          at: 1,
          section: S.ringSection(ring, half),
          rotation: S.ringRotation(ring, half),
        },
      ],
    },
  };
}

/** Existing medial support used only to retain the preceding collar spacing. */
const MEDIAL_OFFSET: number = 0.5;
