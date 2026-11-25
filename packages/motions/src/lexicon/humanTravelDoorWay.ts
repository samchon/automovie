import type {
  IAutoMovieMotionHumanObstacle,
  IAutoMovieMotionHumanTravelDoor,
  IAutoMovieMotionObstacleAperture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * The way through a door: the named obstacle's named opening (its only one when
 * none is named), and the level direction through it at right angles to its
 * width, away from where the walker stands.
 *
 * @param obstacles The performance's obstacles.
 * @param params The obstacle and opening to pass through.
 * @param here Where the walker stands, world metres.
 * @returns The obstacle, its opening, the way out and points along it.
 * @throws {HumanRefusal} When the performance has no such obstacle, the
 *   obstacle has no such opening, or several openings and none is named.
 */
export function humanTravelDoorWay(
  obstacles: readonly IAutoMovieMotionHumanObstacle[],
  params: Pick<IAutoMovieMotionHumanTravelDoor.IParams, "through" | "aperture">,
  here: IAutoMovieVector3,
): humanTravelDoorWay.IWay {
  const obstacle: IAutoMovieMotionHumanObstacle | undefined = obstacles.find(
    (o: IAutoMovieMotionHumanObstacle): boolean => o.subject === params.through,
  );
  const openings: readonly IAutoMovieMotionObstacleAperture[] =
    obstacle?.apertures ?? [];
  const opening: IAutoMovieMotionObstacleAperture | undefined =
    params.aperture === undefined
      ? openings.length === 1
        ? openings[0]
        : undefined
      : openings.find(
          (a: IAutoMovieMotionObstacleAperture): boolean =>
            a.id === params.aperture,
        );
  if (obstacle === undefined || opening === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: obstacle === undefined ? "through" : "aperture",
      value:
        obstacle === undefined ? params.through : (params.aperture ?? null),
      feasible: {
        kind: "alternatives",
        values:
          obstacle === undefined
            ? obstacles.map(
                (o: IAutoMovieMotionHumanObstacle): string => o.subject,
              )
            : openings.map(
                (a: IAutoMovieMotionObstacleAperture): string => a.id,
              ),
      },
      reason:
        obstacle === undefined
          ? `the performance has no obstacle ${params.through}`
          : params.aperture === undefined
            ? `${params.through} has ${openings.length} openings, and none was named`
            : `${params.through} has no opening ${params.aperture}`,
      fix: "name an obstacle of the performance and one of its openings",
    });
  const side: number =
    (opening.at.x - here.x) * -opening.across.z +
      (opening.at.z - here.z) * opening.across.x >=
    0
      ? 1
      : -1;
  const out: IAutoMovieVector3 = {
    x: -opening.across.z * side,
    y: 0,
    z: opening.across.x * side,
  };
  return {
    obstacle,
    opening,
    out,
    along: (metres: number): IAutoMovieVector3 => ({
      x: opening.at.x + out.x * metres,
      y: 0,
      z: opening.at.z + out.z * metres,
    }),
  };
}

/** The way through a door. */
export namespace humanTravelDoorWay {
  /** The way through an opening. */
  export interface IWay {
    /** The obstacle passed through. */
    obstacle: IAutoMovieMotionHumanObstacle;

    /** Its opening. */
    opening: IAutoMovieMotionObstacleAperture;

    /** The level way through, unit, away from the walker. */
    out: IAutoMovieVector3;

    /**
     * A floor point on the way, from the opening's middle.
     *
     * @param metres Distance along the way; negative before the sill.
     * @returns The floor point, world metres.
     */
    along(metres: number): IAutoMovieVector3;
  }
}
