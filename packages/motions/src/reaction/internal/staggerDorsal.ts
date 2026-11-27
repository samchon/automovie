import { AutoMovieEngineVector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkLeg } from "../../actions/internal/walkLeg";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { staggerNearest } from "./staggerNearest";

/*
 * Each planted foot's ankle dorsal limit in a stagger by the share of the
 * body's weight it bears (`walkLeg.dorsal`), the share read from where the
 * recovery's centre of pressure stands.
 *
 * A centre of pressure on a foot's outline is borne by that foot alone; one
 * between the two outlines is borne by both as by two supports of a beam, each
 * foot's share the centre of pressure's distance from the other foot's outline
 * over the sum of its distances from both (the lever rule of statics, the
 * supports taken at their outlines' nearest points). A foot planted alone bears
 * it all. The recovery's centre of pressure moves continuously
 * (`StaggerPendulum`) and reaches the stance foot's outline by a step's
 * lift-off, so each share, and the dorsal room it gives, runs continuously from
 * a foot's touch-down to its lift-off.
 * Parameter body: The body.
 * Parameter pressure: The centre of pressure on the floor, world metres.
 * Parameter feet: The feet as scheduled; a foot with a swing bears nothing and gets
 * no limit.
 * Returns: The dorsal limit of each planted foot, degrees.
 */
export function staggerDorsal(
  body: IAutoMovieMotionHumanBody,
  pressure: IAutoMovieVector3,
  feet: Readonly<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanWalkFoot.IScheduled>
  >,
): Partial<Record<AutoMovieHumanSide, number>> {
  const planted: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
    (side: AutoMovieHumanSide): boolean => feet[side].swing === undefined,
  );
  if (planted.length === 1) return { [planted[0]!]: walkLeg.dorsal(1) };
  if (planted.length === 0) return {};
  const p: IAutoMovieVector3 = { x: pressure.x, y: 0, z: pressure.z };
  const away: (side: AutoMovieHumanSide) => number = (
    side: AutoMovieHumanSide,
  ): number => {
    const outline: IAutoMovieVector3[] = AutoMovieEngineMath.convexHull2D(
      HumanFoot.sole(body, side, feet[side].placement).map(
        (q: IAutoMovieVector3): IAutoMovieVector3 => ({ x: q.x, y: 0, z: q.z }),
      ),
    );
    return AutoMovieEngineVector3.distance(staggerNearest(outline, p), p);
  };
  const left: number = away("left");
  const right: number = away("right");
  const both: number = left + right;
  const share: number = both > 0 ? left / both : 0.5;
  return { left: walkLeg.dorsal(1 - share), right: walkLeg.dorsal(share) };
}
