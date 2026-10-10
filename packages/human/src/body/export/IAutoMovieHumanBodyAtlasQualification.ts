import type { IAutoMovieHumanBodyAtlasPartQualification } from "./IAutoMovieHumanBodyAtlasPartQualification";

/**
 * Atlas inspection metadata joined to actual static geometry by source IDs.
 *
 * Only selected atlas members carry this namespace; ordinary skin, clothing
 * and face parts carry no atlas claim. Editable documents are saved separately.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAtlasQualification {
  /** Atlas namespace version, independent of generic interval metadata. */
  version: 1;

  /** Reference replay is not a population estimator or clinical certificate. */
  qualification: "reference-atlas-inspection";

  /** Selected source members in their primitive's actual member order. */
  parts: IAutoMovieHumanBodyAtlasPartQualification[];
}
