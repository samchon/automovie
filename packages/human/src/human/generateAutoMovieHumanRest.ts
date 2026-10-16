import { IAutoMovieModelPart } from "@automovie/interface";

import { meshAutoMovieHumanCage } from "../junction/meshAutoMovieHumanCage";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanConstructionNet } from "../structures/IAutoMovieHumanConstructionNet";
import { IAutoMovieHumanPartGenerators } from "./IAutoMovieHumanPartGenerators";
import { emitAutoMovieHumanSkin } from "./emitAutoMovieHumanSkin";
import { emitAutoMovieHumanSkinParts } from "./emitAutoMovieHumanSkinParts";
import { generateAutoMovieHumanCages } from "./generateAutoMovieHumanCages";
import { inspectAutoMovieHumanConstruction } from "./inspectAutoMovieHumanConstruction";
import { joinAutoMovieHumanCages } from "./joinAutoMovieHumanCages";
import { reliefAutoMovieHumanSkin } from "./reliefAutoMovieHumanSkin";

/**
 * Build one person's immutable rest geometry for one assembly and its generating net.
 * Source cages, joining and the physical fitting solve run once for both
 * consumers. Construction uses the actual completed generating controls;
 * its authored curves remain separately visible as original constraints.
 * The owning Human instance retains this result for its lifetime and returns
 * copies to appearance and inspection callers, so caller edits cannot change
 * later models. A failed build is not retained.
 */
export function generateAutoMovieHumanRest(measurements: IAutoMovieHumanMeasurements, skeleton: IAutoMovieHumanSkeleton, generators: IAutoMovieHumanPartGenerators, assembly: "parts" | "joined", prepared?: ReturnType<typeof generateAutoMovieHumanCages>): { parts: IAutoMovieModelPart[]; construction: IAutoMovieHumanConstructionNet[] } {
  const cages: ReturnType<typeof generateAutoMovieHumanCages> = prepared ?? generateAutoMovieHumanCages(measurements, skeleton, generators);
  if (assembly === "parts") {
    const output: ReturnType<typeof emitAutoMovieHumanSkinParts> = emitAutoMovieHumanSkinParts(measurements, skeleton, 2, generators, cages);
    return { parts: output.parts, construction: output.construction };
  }
  const cage: ReturnType<typeof joinAutoMovieHumanCages> = joinAutoMovieHumanCages(measurements, skeleton, generators, undefined, cages);
  const output: meshAutoMovieHumanCage.IOutput = meshAutoMovieHumanCage({ cage, levels: 2, domain: "skin", relief: reliefAutoMovieHumanSkin(measurements, skeleton, generators) });
  return {
    parts: [emitAutoMovieHumanSkin(measurements, skeleton, 2, generators, { cage, output })],
    construction: inspectAutoMovieHumanConstruction(cages, { cage, surface: output.surface, levels: 2 }),
  };
}
