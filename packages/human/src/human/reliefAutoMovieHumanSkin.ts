import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanPart } from "../junction/AutoMovieHumanPart";
import { AutoMovieHumanSide } from "../junction/AutoMovieHumanSide";
import { IAutoMovieHumanSurfaceCoordinate } from "../junction/IAutoMovieHumanSurfaceCoordinate";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanPartGenerator } from "../parts/IAutoMovieHumanPartGenerator";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { AUTOMOVIE_HUMAN_PART_INSTANCES } from "./AUTOMOVIE_HUMAN_PART_INSTANCES";
import { IAutoMovieHumanPartGenerators } from "./IAutoMovieHumanPartGenerators";

/**
 * The skin's relief: every part instance's own relief, chosen by the chart a point lies on.
 *
 * Each part generator that declares a relief is asked for it once per instance, so a part's fields are built once however many vertices read them; a point on a part without one is not moved.
 *
 * @param measurements Resolved measurements of the person
 * @param skeleton The person's skeleton at rest
 * @param generators The part generators
 * @returns Displacement, millimetres, outward positive, at a point's chart address and rest position in millimetres
 */
export function reliefAutoMovieHumanSkin(
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  generators: IAutoMovieHumanPartGenerators,
): (point: {
  coordinate: IAutoMovieHumanSurfaceCoordinate;
  position: IAutoMovieVector3;
}) => number {
  const fields: Map<
    string,
    (point: {
      coordinate: IAutoMovieHumanSurfaceCoordinate;
      position: IAutoMovieVector3;
    }) => number
  > = new Map();
  for (const [part, side] of AUTOMOVIE_HUMAN_PART_INSTANCES) {
    const generator = generators[
      part
    ] as unknown as IAutoMovieHumanPartGenerator<AutoMovieHumanPart>;
    if (generator.relief === undefined) continue;
    fields.set(
      key(part, side),
      generator.relief({
        measurements,
        skeleton,
        side: side as IAutoMovieHumanPartGenerator.Side<AutoMovieHumanPart>,
      }) as (point: {
        coordinate: IAutoMovieHumanSurfaceCoordinate;
        position: IAutoMovieVector3;
      }) => number,
    );
  }
  return (point: {
    coordinate: IAutoMovieHumanSurfaceCoordinate;
    position: IAutoMovieVector3;
  }): number =>
    fields.get(key(point.coordinate.part, point.coordinate.side))?.(point) ?? 0;
}

const key = (
  part: AutoMovieHumanPart,
  side: AutoMovieHumanSide | null,
): string => (side === null ? part : `${part}.${side}`);
