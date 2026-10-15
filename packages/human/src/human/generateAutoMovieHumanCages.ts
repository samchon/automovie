import { AutoMovieHumanPart } from "../junction/AutoMovieHumanPart";
import { AutoMovieHumanSide } from "../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { AUTOMOVIE_HUMAN_PART_INSTANCES } from "./AUTOMOVIE_HUMAN_PART_INSTANCES";
import { IAutoMovieHumanPartGenerators } from "./IAutoMovieHumanPartGenerators";

/**
 * Generate every part's cage for a person, each alone.
 *
 * @param measurements Resolved measurements
 * @param skeleton The skeleton at rest
 * @param generators The generator of each part
 * @returns One cage per part instance, in `AUTOMOVIE_HUMAN_PART_INSTANCES` order
 */
export const generateAutoMovieHumanCages = (
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  generators: IAutoMovieHumanPartGenerators,
): Array<{
  part: AutoMovieHumanPart;
  side: AutoMovieHumanSide | null;
  cage: IAutoMovieHumanCage;
}> =>
  AUTOMOVIE_HUMAN_PART_INSTANCES.map(([part, side]) => ({
    part,
    side,
    cage: (
      generators[part] as {
        generate(props: {
          measurements: IAutoMovieHumanMeasurements;
          skeleton: IAutoMovieHumanSkeleton;
          side: AutoMovieHumanSide | null;
        }): IAutoMovieHumanCage;
      }
    ).generate({ measurements, skeleton, side }),
  }));
