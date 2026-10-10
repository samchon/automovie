import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";

/**
 * Canonical person document and borrowed face materials for shared skin colour.
 * The derivation reads the admitted face override and basis skin albedo, then
 * creates a body document without changing either input. The material owner
 * retains optical qualification; this carrier establishes no tissue measurement.
 *
 * @author Samchon
 */
export interface IDeriveHumanPersonBodyProps {
  /** Person whose face supplies the single skin colour shared with its body. */
  document: IAutoMovieHumanPersonDocument;

  /** Borrowed face basis materials, providing skin albedo before overrides. */
  faceMaterials: readonly IAutoMovieMaterial[];
}
