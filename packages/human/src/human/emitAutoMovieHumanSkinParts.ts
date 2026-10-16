import { IAutoMovieMaterial, IAutoMovieModelPart } from "@automovie/interface";

import { meshAutoMovieHumanCage } from "../junction/meshAutoMovieHumanCage";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanConstructionNet } from "../structures/IAutoMovieHumanConstructionNet";
import { AUTOMOVIE_HUMAN_SKIN_MATERIAL } from "./AUTOMOVIE_HUMAN_SKIN_MATERIAL";
import { IAutoMovieHumanPartGenerators } from "./IAutoMovieHumanPartGenerators";
import { generateAutoMovieHumanCages } from "./generateAutoMovieHumanCages";
import { inspectAutoMovieHumanConstruction } from "./inspectAutoMovieHumanConstruction";
import { reliefAutoMovieHumanSkin } from "./reliefAutoMovieHumanSkin";

/**
 * Emit each part's standalone skin and the same completed generating cage.
 * Open rings retain the part's own boundary rule; this output is distinct from
 * joined skin. Prepared source cages let the owning Human instance reuse its
 * immutable generation inputs without conflating the two fitting domains.
 */
export function emitAutoMovieHumanSkinParts(
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  levels: number,
  generators: IAutoMovieHumanPartGenerators,
  prepared?: ReturnType<typeof generateAutoMovieHumanCages>,
): { parts: IAutoMovieModelPart[]; materials: IAutoMovieMaterial[]; construction: IAutoMovieHumanConstructionNet[] } {
  const relief: ReturnType<typeof reliefAutoMovieHumanSkin> = reliefAutoMovieHumanSkin(measurements, skeleton, generators);
  const cages: ReturnType<typeof generateAutoMovieHumanCages> = prepared ?? generateAutoMovieHumanCages(measurements, skeleton, generators);
  const construction: IAutoMovieHumanConstructionNet[] = [];
  const parts: IAutoMovieModelPart[] = cages.map((source: ReturnType<typeof generateAutoMovieHumanCages>[number]): IAutoMovieModelPart => {
    const id: string = source.side === null ? `skin.${source.part}` : `skin.${source.part}.${source.side}`;
    const output: meshAutoMovieHumanCage.IOutput = meshAutoMovieHumanCage({ cage: source.cage, levels, domain: id, relief });
    construction.push(...inspectAutoMovieHumanConstruction([source], { cage: source.cage, surface: output.surface, levels }));
    return {
      id,
      name: source.side === null ? source.part : `${source.side} ${source.part}`,
      geometry: { type: "mesh", mesh: output.mesh },
      material: AUTOMOVIE_HUMAN_SKIN_MATERIAL.id,
      attachedBone: null,
      transform: null,
    };
  });
  return { parts, materials: [AUTOMOVIE_HUMAN_SKIN_MATERIAL], construction };
}
