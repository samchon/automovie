
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanFoot, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanFoot } from "./HumanFoot";

/** Borrowed geometry readers for one unchanged displayed body evaluation. */
interface IReading {
  /**
   * The original bearing base; sides keep their given order and default to
   * both.
   */
  base(sides?: readonly AutoMovieHumanSide[]): IAutoMovieVector3[];
  /**
   * A side's borrowed placed sockets, heel first; do not mutate them during
   * this reading.
   */
  sockets(
    side: AutoMovieHumanSide,
  ): readonly IAutoMovieMotionHumanFoot.ISocket[];
}

/**
 * Share actual foot socket/outline placement within one synchronous reading.
 *
 * @param body The unchanged body supplying its sole frames.
 * @param bones Its unchanged displayed bone map for this one evaluation.
 * @returns Bound base and socket readers; release them with this evaluation.
 */
export function readHumanFoot(
  body: IAutoMovieMotionHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): IReading {
  const placed: Map<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.ISocket[]> =
    new Map();
  const outlines: Map<AutoMovieHumanSide, IAutoMovieVector3[]> = new Map();

  /** Place a side's actual sockets on its bound displayed bones once. */
  function sockets(
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanFoot.ISocket[] {
    let points: IAutoMovieMotionHumanFoot.ISocket[] | undefined =
      placed.get(side);
    if (points === undefined) {
      points = HumanFoot.sockets(body, bones, side);
      placed.set(side, points);
    }
    return points;
  }
  return {
    sockets,
    base: (
      sides: readonly AutoMovieHumanSide[] = ["left", "right"],
    ): IAutoMovieVector3[] =>
      sides.flatMap((side: AutoMovieHumanSide): IAutoMovieVector3[] => {
        let corners: IAutoMovieVector3[] | undefined = outlines.get(side);
        if (corners === undefined) {
          corners = HumanFoot.outline(body, side).map(
            (frame: IAutoMovieHumanoidSurfaces.IFrame): IAutoMovieVector3 =>
              AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
                frame,
                bones.get(frame.bone)!,
              ),
          );
          outlines.set(side, corners);
        }
        const points: IAutoMovieVector3[] = corners.length
          ? corners
          : sockets(side).map(
              (socket: IAutoMovieMotionHumanFoot.ISocket): IAutoMovieVector3 =>
                socket.point,
            );
        let low: number = Infinity;
        for (const point of points) low = Math.min(low, point.y);
        return points.filter(
          (point: IAutoMovieVector3): boolean =>
            point.y <= low + HumanFoot.BEARING,
        );
      }),
  };
}
