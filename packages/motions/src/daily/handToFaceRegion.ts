import type {
  AutoMovieHumanoidRegion,
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanHandToFaceRows,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

import { AutoMovieMotionHumanTouch } from "../compose/AutoMovieMotionHumanTouch";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { handToFaceSheet } from "./handToFaceSheet";

/**
 * The place a hand-to-face task aims a hand at, as a reader of the posture
 * and the action's second: the face region the row names, read on the
 * performer's own body, or the sheet held before the eyes when the row
 * names no region.
 *
 * Over a carrier the face travels with the body, so the region is read on
 * the bones the posture of that instant gives: posed only when the region
 * lies on a bone the reader asks them for (a region on the trunk is read from
 * the posture itself). Limbs are fitted after the trunk and move no bone of
 * the midline, so a region on a midline bone is read with no limb fitted; a
 * bone of a side keeps the whole solve. A row that stands its effector
 * upright reads the region's normal level, so its tangent `up` is the
 * world's up.
 *
 * @param context The action's context.
 * @param row The task's row.
 * @param bones The entry pose's bones, the reading of a performer no carrier moves.
 * @returns For a hand's side and the region it aims at (null for the sheet), the place at a posture and a second of the action.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two targets, the carrier's reading with its two cases and the level normal.
 * @evidence contracts/development/implementation.md#principled-implementation The region is the touch grammar's own reading of a self target (`AutoMovieMotionHumanTouch.region`); the midline case rests on the resolver's order, limbs after the trunk.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One reader per side and region, with the bones supplied lazily.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A region on a side's bone keeps the whole posture solve; nothing is read from an earlier instant.
 * @evidence contracts/development/implementation.md#efficient-algorithms Over a carrier one posture solve a region read that asks a bone, without limb fits for a midline bone; none otherwise.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each read is its own instant's.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The readers close over the context, the row and the entry bones and retain nothing else.
 */
export function handToFaceRegion(
  context: IAutoMovieMotionHumanActionContext,
  row: IAutoMovieMotionHumanHandToFaceRows.IRow,
  bones: ReturnType<typeof poseBones>,
): (
  side: AutoMovieHumanSide,
  name: AutoMovieHumanoidRegion | null,
) => (
  posture: IAutoMovieMotionHumanPosture,
  seconds: number,
) => Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal"> {
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  return (
      side: AutoMovieHumanSide,
      name: AutoMovieHumanoidRegion | null,
    ) =>
    (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal"> => {
      if (name === null) return handToFaceSheet.of(context, posture, side);
      const place: Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal"> =
        AutoMovieMotionHumanTouch.region(
          context,
          { kind: "self", region: name } satisfies IAutoMovieMotionTarget,
          context.start + seconds,
          posture,
          context.carrier === undefined
            ? bones
            : (): ReturnType<typeof poseBones> =>
                poseBones(
                  body,
                  resolveHumanPosture(
                    body,
                    /^(left|right)/.test(body.surfaces.regions[name].bone)
                      ? posture
                      : { ...posture, limbs: {} },
                  ),
                ),
        );
      const level: number = Math.hypot(place.normal.x, place.normal.z);
      return row.level === true && level > 1e-6
        ? {
            ...place,
            normal: {
              x: place.normal.x / level,
              y: 0,
              z: place.normal.z / level,
            },
          }
        : place;
    };
}
