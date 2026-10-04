import type { IAutoMovieHumanBodyBasisCorrective } from "@automovie/human/body/structures/shape/IAutoMovieHumanBodyBasisCorrective";

import type { IHumanSourceGenerationCorrectiveInput } from "./IHumanSourceGenerationCorrectiveInput.ts";

/**
 * One combination corrective of the generation with its published origin.
 * Face inputs name channel sides; body inputs may also name a joint pose
 * driver, kept in the published body form.
 */
export interface IHumanSourceGenerationCorrective {
  id: string;
  origin: "face" | "body";
  inputs: (IHumanSourceGenerationCorrectiveInput | IAutoMovieHumanBodyBasisCorrective["inputs"][number])[];
  weight: number;
  target: string;
}
