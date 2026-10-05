import type { IAutoMovieHumanFacePeriocular } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocular";

/**
 * The periocular registration of the face and the record of how each role
 * was read, written to the generation manifest.
 *
 * @author Samchon
 */
export interface IHumanSourcePeriocularRegistration {
  /** The registration the face declares. */
  periocular: IAutoMovieHumanFacePeriocular;

  /** Reading record per role and side. */
  record: Record<string, unknown>;
}
