import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

/** The same sided corrective and native row population after numerical reflection. */
export interface IBodyMirroredCorrective {
  corrective: NonNullable<IAutoMovieHumanBodyBasis["correctives"]>[number];
  rows: number[];
}
