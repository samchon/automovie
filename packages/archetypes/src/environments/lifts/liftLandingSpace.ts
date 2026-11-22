import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieBuiltSpace,
  IAutoMovieBuiltSurface,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core/AutoMovieArchetypeFrame";

/**
 * Describe one docked landing's room and fixed support polygon.
 * The room starts at the sill centre plane, which lets connector admission
 * observe the docked car origin. The feet's support excludes the gap.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes the occupied volume and the bearing surface and states their frames.
 * @evidence contracts/development/implementation.md#principled-implementation Opposed half-space planes locate a rigid box in world metres. The independently bounded support starts on the landing side of the author-supplied gap.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One local rectangle establishes the stage floor while its widened extent toward the sill locates the stopped connector.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fictitious cab floor or support in the gap is emitted.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed comparisons and rigid projections per floor.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each floor retains its own frame and identity.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one volume and one closed ring with no owned resources.
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
    AutoMovieArchetypeFrame.point(sill, Vector3.create(x, y, z));
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
              [axis, Vector3.scale(axis, -1)].map(
                (normal: IAutoMovieVector3) => ({
                  normal,
                  offset: Vector3.dot(normal, center) + extent,
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
