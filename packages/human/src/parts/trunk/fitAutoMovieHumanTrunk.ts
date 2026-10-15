import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { IAutoMovieHumanTrunkPoints } from "./IAutoMovieHumanTrunkPoints";
import { IAutoMovieHumanTrunkTune } from "./IAutoMovieHumanTrunkTune";
import { connectAutoMovieHumanTrunk } from "./connectAutoMovieHumanTrunk";
import { measureAutoMovieHumanTrunkFrame } from "./measureAutoMovieHumanTrunkFrame";
import { measureAutoMovieHumanTrunkSurface } from "./measureAutoMovieHumanTrunkSurface";
import { placeAutoMovieHumanTrunkPoints } from "./placeAutoMovieHumanTrunkPoints";

/** Rounds of the fit; each removes most of the remaining relative error of every measurement. */
const ROUNDS: number = 7;

/**
 * Bounds of the squareness factors: a waist the fit cannot reach by shape takes the rest in breadth; the hips, whose breadth and depth are both measured, may square further, as the buttocks flatten the back of the section into two lobes.
 */
const SQUARENESS: Record<"waist" | "hip", [number, number]> = {
  waist: [0.8, 1.3],
  hip: [0.8, 1.7],
};

/**
 * Base chest circumference under the breasts over the underbust: the chest at the bust's level, without the breasts, is a little fuller than at the inframammary fold, as the rib cage widens upward to the fourth rib. Conventional.
 */
const BASE_OVER_UNDERBUST: number = 1.04;

/**
 * Fit the trunk's sections until its surface measures as the identity does, and return the final cage.
 *
 * The anatomy places every form; the fit only scales sections, measuring the subdivided surface each round as anthropometry would. Waist and hip take breadth and depth from their measured breadths and depths and squareness from their circumferences; past the squareness bounds the circumference goes to breadth. The chest takes depth from its measured depth and its girth by breadth, because its measured breadth is compressed. With breasts, the chest without them is fitted to the underbust and the breasts' projection to the girth they add; without, the underbust is fitted a little under the chest. The thigh scales to its circumference at the gluteal furrow. Each factor moves by the ratio of target to measurement, damped so coupled sections settle together.
 *
 * @param measurements Resolved measurements
 * @param skeleton The person's skeleton at rest
 * @returns The fitted cage and the factors that made it
 */
export function fitAutoMovieHumanTrunk(
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
): fitAutoMovieHumanTrunk.IOutput {
  const frame: IAutoMovieHumanTrunkFrame = measureAutoMovieHumanTrunkFrame(
    measurements,
    skeleton,
    "left",
  );
  const tune: IAutoMovieHumanTrunkTune = IAutoMovieHumanTrunkTune.neutral();
  const breasted: boolean = frame.underbust < frame.chest.girth * 0.995;
  const build = (t: IAutoMovieHumanTrunkTune): [IAutoMovieHumanCage, number] => {
    const points: IAutoMovieHumanTrunkPoints = placeAutoMovieHumanTrunkPoints(
      measurements,
      skeleton,
      t,
    );
    return [connectAutoMovieHumanTrunk(points), frame.levels.fold];
  };
  const ratio = (target: number, measured: number, power: number): number =>
    measured > 0 ? Math.pow(target / measured, power) : 1;
  const bound = (x: number, [low, high]: [number, number]): number => Math.min(high, Math.max(low, x));
  let [cage, underY]: [IAutoMovieHumanCage, number] = build(tune);
  for (let round: number = 0; round < ROUNDS; ++round) {
    const m: measureAutoMovieHumanTrunkSurface.IOutput = measureAutoMovieHumanTrunkSurface(
      cage,
      frame,
      underY,
    );
    tune.chest.depth *= ratio(frame.chest.depth, m.chest.depth, 0.9);
    if (breasted) {
      const [flat, flatY]: [IAutoMovieHumanCage, number] = build({ ...tune, breast: 0 });
      const base: measureAutoMovieHumanTrunkSurface.IOutput =
        measureAutoMovieHumanTrunkSurface(flat, frame, flatY);
      tune.chest.breadth *= ratio(BASE_OVER_UNDERBUST * frame.underbust, base.chest.girth, 1.2);
      tune.under.breadth *= ratio(frame.underbust, base.underbust, 1.2);
      tune.breast = Math.min(
        4,
        Math.max(
          0.05,
          tune.breast *
            ratio(
              Math.max(5, frame.chest.girth - base.chest.girth),
              Math.max(5, m.chest.girth - base.chest.girth),
              0.9,
            ),
        ),
      );
    } else {
      tune.chest.breadth *= ratio(frame.chest.girth, m.chest.girth, 1.2);
      tune.under.breadth *= ratio(0.97 * frame.underbust, m.underbust, 1.2);
    }
    tune.waist.breadth *= ratio(frame.waist.breadth, m.waist.breadth, 0.9);
    tune.waist.depth *= ratio(frame.waist.depth, m.waist.depth, 0.9);
    tune.waist.squareness = bound(
      tune.waist.squareness * (1 + 5 * (frame.waist.girth / m.waist.girth - 1)),
      SQUARENESS.waist,
    );
    if (SQUARENESS.waist.includes(tune.waist.squareness))
      tune.waist.breadth *= ratio(frame.waist.girth, m.waist.girth, 0.8);
    tune.hip.breadth *= ratio(frame.buttock.breadth, m.buttock.breadth, 0.9);
    tune.hip.depth *= ratio(frame.buttock.depth, m.buttock.depth, 0.9);
    tune.hip.squareness = bound(
      tune.hip.squareness * (1 + 5 * (frame.buttock.girth / m.buttock.girth - 1)),
      SQUARENESS.hip,
    );
    tune.thigh *= ratio(frame.thighGirth, m.thigh, 0.9);
    [cage, underY] = build(tune);
  }
  return { cage, tune };
}
/** Output type of {@link fitAutoMovieHumanTrunk}. */
export namespace fitAutoMovieHumanTrunk {
  /**
   * The fitted trunk.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** The cage of the last round. */
    cage: IAutoMovieHumanCage;

    /** The factors that made it. */
    tune: IAutoMovieHumanTrunkTune;
  }
}
