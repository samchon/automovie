import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AUTOMOVIE_HUMAN_FOOT_GRID } from "./AUTOMOVIE_HUMAN_FOOT_GRID";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { interpolateAutoMovieHumanFootProfile } from "./interpolateAutoMovieHumanFootProfile";

/**
 * Dorsal height along a lesser toe, of the toe's height, at its stations. The proximal interphalangeal joint stands highest, the knuckle of a toe that rests slightly flexed, and the toe falls past the nail to its tip. Grade: conventional, set against renders.
 */
const LESSER_DORSUM: IAutoMovieHumanFootPlan.IProfile = [
  [0.5, 1.15],
  [0.62, 1.32],
  [0.72, 1.08],
  [0.82, 0.9],
  [0.91, 0.74],
  [0.975, 0.45],
];

/** Dorsal height along the hallux, which has no middle joint and runs nearly level to its nail. Grade: conventional. */
const HALLUX_DORSUM: IAutoMovieHumanFootPlan.IProfile = [
  [0.5, 1.05],
  [0.62, 1.05],
  [0.72, 0.98],
  [0.82, 0.88],
  [0.91, 0.72],
  [0.975, 0.45],
];

/**
 * Plantar height along a toe, of foot length: lifted under the joints, down on the distal pad, which with the heel and the ball carries the standing foot. Grade: conventional.
 */
const PLANTAR: IAutoMovieHumanFootPlan.IProfile = [
  [0.5, 0.02],
  [0.62, 0.02],
  [0.72, 0.012],
  [0.82, 0.003],
  [0.91, 0],
  [0.975, 0.012],
];

/** Half breadth along a toe, of the toe's breadth: the pad swells past the distal joint and rounds off at the tip. Grade: conventional. */
const HALF_BREADTH: IAutoMovieHumanFootPlan.IProfile = [
  [0.5, 0.54],
  [0.62, 0.55],
  [0.72, 0.5],
  [0.82, 0.52],
  [0.91, 0.52],
  [0.975, 0.33],
];

/**
 * Shape every toe's stations.
 *
 * Each station is a four-cornered section across the toe at a fraction of its length from the metatarsophalangeal joint. The dorsal corners stand narrower than the plantar ones, so the limit section is flatter beneath, where the toe rests, and rounded above.
 *
 * @param plan The foot's plan
 * @returns Stations by toe, each as its dorsomedial, dorsolateral, plantolateral and plantomedial corners
 */
export function shapeAutoMovieHumanFootToes(
  plan: IAutoMovieHumanFootPlan,
): IAutoMovieVector3[][][] {
  return plan.toes.map(
    (toe: IAutoMovieHumanFootPlan.IToe): IAutoMovieVector3[][] =>
      AUTOMOVIE_HUMAN_FOOT_GRID.toeStations.map(
        (at: number): IAutoMovieVector3[] => {
          const dorsal: number =
            interpolateAutoMovieHumanFootProfile(
              toe.hallux ? HALLUX_DORSUM : LESSER_DORSUM,
              at,
            ) * toe.height;
          const plantar: number =
            interpolateAutoMovieHumanFootProfile(PLANTAR, at) * plan.length;
          const half: number =
            interpolateAutoMovieHumanFootProfile(HALF_BREADTH, at) * toe.width;
          const top: number = half * (at > 0.95 ? 0.8 : 0.88);
          return [
            shapeAutoMovieHumanFootToes.at(toe, at, -top, dorsal),
            shapeAutoMovieHumanFootToes.at(toe, at, top, dorsal),
            shapeAutoMovieHumanFootToes.at(toe, at, half, plantar),
            shapeAutoMovieHumanFootToes.at(toe, at, -half, plantar),
          ];
        },
      ),
  );
}
/** The toe frame helper of {@link shapeAutoMovieHumanFootToes}. */
export namespace shapeAutoMovieHumanFootToes {
  /**
   * A point on a toe's frame.
   *
   * @param toe The toe
   * @param along Fraction of the toe's length from its joint
   * @param lateral Distance to the lateral side of the toe's axis, negative medially
   * @param height Height above the standing surface
   * @returns The point
   */
  export function at(
    toe: IAutoMovieHumanFootPlan.IToe,
    along: number,
    lateral: number,
    height: number,
  ): IAutoMovieVector3 {
    const centre: IAutoMovieVector3 = AutoMovieHumanVector.offset(toe.joint, [
      toe.direction,
      along * toe.length,
    ]);
    return AutoMovieHumanVector.of(
      centre.x + toe.direction.z * lateral,
      height,
      centre.z - toe.direction.x * lateral,
    );
  }
}
