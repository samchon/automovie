import { type IAutoMovieResolvedBone, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "./HumanFoot";

/** Borrowed geometry readers for one unchanged displayed body evaluation. */
interface IReading {
  /** The original bearing base; sides keep their given order and default to both. */
  base(sides?: readonly ("left" | "right")[]): IAutoMovieVector3[];
  /** A side's borrowed placed sockets, heel first; do not mutate them during this reading. */
  sockets(side: "left" | "right"): readonly HumanFoot.ISocket[];
}

/**
 * Share actual foot socket/outline placement within one synchronous reading.
 *
 * @param body The unchanged body supplying its sole frames.
 * @param bones Its unchanged displayed bone map for this one evaluation.
 * @returns Bound base and socket readers; release them with this evaluation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States unchanged body/displayed-bone binding, side/default ordering, borrowed socket ownership and synchronous lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation Places sockets with HumanFoot.sockets and outline points with the surface owner's exact point expression, then retains the original minimum-height and inclusive HumanFoot.BEARING predicate for the requested foot base.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two side-indexed maps share socket and outline placements across the base and heel readers; HumanFoot retains sole geometry and raw public entries.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Derives every shared point from the bound body/bone map, accepts no caller-supplied derived sockets, and keeps every outline/socket point, ordering and bearing threshold.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each requested side's three socket and outline points are placed at most once per operation, omitting unread normal/forward rotations and frame wrappers; every base read still performs the original linear minimum and bearing filter over that side's actual points.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller binds one unchanged body and displayed bone map for this synchronous evaluation; changing either requires a new reading, without pose identity/time keys or cross-evaluation sharing.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One reading retains at most two socket arrays and two outline-point arrays until its synchronous owner returns or throws; outputs may retain their resulting points, while no global/body/plan cache retains the reading.
 */
export function readHumanFoot(
  body: IHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): IReading {
  const placed: Map<"left" | "right", HumanFoot.ISocket[]> = new Map();
  const outlines: Map<"left" | "right", IAutoMovieVector3[]> = new Map();

  /** Place a side's actual sockets on its bound displayed bones once. */
  function sockets(side: "left" | "right"): HumanFoot.ISocket[] {
    let points: HumanFoot.ISocket[] | undefined = placed.get(side);
    if (points === undefined) {
      points = HumanFoot.sockets(body, bones, side);
      placed.set(side, points);
    }
    return points;
  }
  return {
    sockets,
    base: (sides: readonly ("left" | "right")[] = ["left", "right"]): IAutoMovieVector3[] =>
      sides.flatMap((side: "left" | "right"): IAutoMovieVector3[] => {
        const sole: HumanFoot.ISocket[] = sockets(side);
        let corners: IAutoMovieVector3[] | undefined = outlines.get(side);
        if (corners === undefined) {
          corners = HumanFoot.outline(body, side).map(
            (frame: resolveAutoMovieHumanoidSurfaces.IFrame): IAutoMovieVector3 =>
              resolveAutoMovieHumanoidSurfaces.point(frame, bones.get(frame.bone)!),
          );
          outlines.set(side, corners);
        }
        const points: IAutoMovieVector3[] = [
          ...sole.map((socket: HumanFoot.ISocket): IAutoMovieVector3 => socket.point),
          ...corners,
        ];
        let low: number = Infinity;
        for (const point of points) low = Math.min(low, point.y);
        return points.filter((point: IAutoMovieVector3): boolean => point.y <= low + HumanFoot.BEARING);
      }),
  };
}
