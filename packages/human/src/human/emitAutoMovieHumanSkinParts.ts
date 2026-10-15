import { IAutoMovieMaterial, IAutoMovieModelPart } from "@automovie/interface";

import { meshAutoMovieHumanCage } from "../junction/meshAutoMovieHumanCage";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { AUTOMOVIE_HUMAN_SKIN_MATERIAL } from "./AUTOMOVIE_HUMAN_SKIN_MATERIAL";
import { IAutoMovieHumanPartGenerators } from "./IAutoMovieHumanPartGenerators";
import { generateAutoMovieHumanCages } from "./generateAutoMovieHumanCages";

/**
 * Emit each skin part's own cage, subdivided alone, as a separate static model part, the preview in which a part is judged before joining.
 *
 * Each part keeps its open rings as boundaries, so its edge near a junction is the part's own limit surface, not the joined one. Part ids are `skin.<part>` or `skin.<part>.<side>`, so the viewer can show one part alone.
 *
 * @param measurements Resolved measurements
 * @param skeleton The skeleton at rest
 * @param levels Subdivision levels
 * @param generators The generator of each part
 * @returns The parts and the material they cite
 */
export const emitAutoMovieHumanSkinParts = (
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  levels: number,
  generators: IAutoMovieHumanPartGenerators,
): { parts: IAutoMovieModelPart[]; materials: IAutoMovieMaterial[] } => ({
  parts: generateAutoMovieHumanCages(measurements, skeleton, generators).map(
    ({ part, side, cage }): IAutoMovieModelPart => {
      const id: string =
        side === null ? `skin.${part}` : `skin.${part}.${side}`;
      return {
        id,
        name: side === null ? part : `${side} ${part}`,
        geometry: {
          type: "mesh",
          mesh: meshAutoMovieHumanCage({ cage, levels, domain: id }).mesh,
        },
        material: AUTOMOVIE_HUMAN_SKIN_MATERIAL.id,
        attachedBone: null,
        transform: null,
      };
    },
  ),
  materials: [AUTOMOVIE_HUMAN_SKIN_MATERIAL],
});
