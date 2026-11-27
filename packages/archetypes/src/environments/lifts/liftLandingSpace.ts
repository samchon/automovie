import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieBuiltSpace,
  IAutoMovieBuiltSurface,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core/AutoMovieArchetypeFrame";

/*
 * Describe one docked landing's room and fixed support polygon. The room starts
 * at the sill centre plane, which lets connector admission observe the docked
 * car origin. The feet's support excludes the gap.
 */
export function liftLandingSpace(
  id: string,
  scope: string,
  parent: string,
  sill: IAutoMovieTransform,
  width: number,
  height: number,
  gap: number,
  depth: number,
): { space: IAutoMovieBuiltSpace; support: IAutoMovieBuiltSurface } {
  const half: number = width / 2;
  const end: number = gap + depth;
  const world = (x: number, y: number, z: number): IAutoMovieVector3 =>
    AutoMovieArchetypeFrame.point(sill, AutoMovieEngineVector3.create(x, y, z));
  const center: IAutoMovieVector3 = world(0, height / 2, end / 2);
  const limits: Array<[IAutoMovieVector3, number]> = [
    [AutoMovieArchetypeFrame.axis(sill, "x"), half],
    [AutoMovieArchetypeFrame.axis(sill, "y"), height / 2],
    [AutoMovieArchetypeFrame.axis(sill, "z"), end / 2],
  ];
  return {
    space: {
      id,
      kind: "lift-landing",
      parent,
      cells: [
        {
          id: `${id}/cell`,
          planes: limits.flatMap(
            ([axis, extent]: [IAutoMovieVector3, number]) =>
              [axis, AutoMovieEngineVector3.scale(axis, -1)].map(
                (normal: IAutoMovieVector3) => ({
                  normal,
                  offset: AutoMovieEngineVector3.dot(normal, center) + extent,
                }),
              ),
          ),
        },
      ],
    },
    support: {
      space: id,
      surface: {
        id: `${scope}/${id}/floor`,
        kind: "floor",
        polygon: [
          world(-half, 0, gap),
          world(-half, 0, end),
          world(half, 0, end),
          world(half, 0, gap),
        ],
        anchor: world(0, 0, gap),
      },
    },
  };
}
