import type { IAutoMovieHumanFaceOpticalSupport } from "@automovie/human/face/structures/IAutoMovieHumanFaceOpticalSupport";

/**
 * The optical support of both eyes and the record of how each was built,
 * written to the generation manifest.
 *
 * @author Samchon
 */
export interface IHumanSourceOpticalRegistration {
  /** Left then right eye support. */
  supports: IAutoMovieHumanFaceOpticalSupport[];

  /** Build record per eye. */
  records: Record<string, unknown>[];
}
