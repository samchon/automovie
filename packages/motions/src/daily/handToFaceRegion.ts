import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanHandToFaceRows,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

import { touchRegionFrame } from "../compose/touchRegionFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { handToFaceSheet } from "./handToFaceSheet";

/** The alternatives of `HandToFaceRegionPlace`'s site. */
type HandToFaceRegionPlace = "point" | "normal";

/** The alternatives of `HandToFaceRegionResult2`'s site. */
type HandToFaceRegionResult2 = "point" | "normal";

/** The alternatives of `HandToFaceRegionResult`'s site. */
type HandToFaceRegionResult = "point" | "normal";

/**
 * The place a hand-to-face task aims a hand at, as a reader of the posture and
 * the action's second: the face region the row names, read on the performer's
 * own body, or the sheet held before the eyes when the row names no region.
 *
 * Over a carrier the face travels with the body, so the region is read on the
 * bones the posture of that instant gives: posed only when the region lies on a
 * bone the reader asks them for (a region on the trunk is read from the posture
 * itself). Limbs are fitted after the trunk and move no bone of the midline, so
 * a region on a midline bone is read with no limb fitted; a bone of a side
 * keeps the whole solve. A row that stands its effector upright reads the
 * region's normal level, so its tangent `up` is the world's up.
 *
 * @param context The action's context.
 * @param row The task's row.
 * @param bones The entry pose's bones, the reading of a performer no carrier
 *   moves.
 * @returns For a hand's side and the region it aims at (null for the sheet),
 *   the place at a posture and a second of the action.
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
) => Pick<IAutoMovieMotionHumanTarget.IPlace, HandToFaceRegionResult> {
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  return (side: AutoMovieHumanSide, name: AutoMovieHumanoidRegion | null) =>
    (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): Pick<IAutoMovieMotionHumanTarget.IPlace, HandToFaceRegionResult2> => {
      if (name === null) return handToFaceSheet.of(context, posture, side);
      const place: Pick<
        IAutoMovieMotionHumanTarget.IPlace,
        HandToFaceRegionPlace
      > = touchRegionFrame(
        context,
        { kind: "self", region: name } satisfies IAutoMovieMotionTarget,
        context.start + seconds,
        posture,
        context.carrier === undefined
          ? bones
          : (): ReturnType<typeof poseBones> => {
              // Only the region's bone is read: the solve and the forward
              // kinematics are asked for it alone, whose frame equals the
              // whole resolution's (`resolveHumanPosture.seeded`).
              const bone: AutoMovieHumanoidBone =
                body.surfaces.regions[name].bone;
              const read: ReadonlySet<AutoMovieHumanoidBone> =
                new Set<AutoMovieHumanoidBone>([bone]);
              return poseBones(
                body,
                resolveHumanPosture.seeded(
                  body,
                  /^(left|right)/.test(bone)
                    ? posture
                    : { ...posture, limbs: {} },
                  undefined,
                  undefined,
                  undefined,
                  read,
                ).pose,
                undefined,
                read,
              );
            },
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
