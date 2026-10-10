import type { IAutoMovieHumanBodyAtlasSourceSubstitution } from "./IAutoMovieHumanBodyAtlasSourceSubstitution";

/**
 * Provenance and rights of an acquired atlas surface, distinct from an
 * independently measured person's tissue or a population prediction.
 *
 * The offline compiler records the actual download and acquisition account.
 * Unknown acquisition details remain explicit text rather than implied
 * clinical registration. Attribution follows the asset through export.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAtlasSource {
  /** Direct source download location. */
  uri: string;

  /** Acquired atlas release, independent of the compiled body basis. */
  revision: string;

  /** SHA-256 of the original acquired file. */
  sha256: string;

  /** License identifier of that direct source. */
  license: string;

  /** License source read when acquiring the asset. */
  licenseUri: string;

  /** Required attribution, preserved for static asset correspondence. */
  attribution: string;

  /** Original organ identifier, not the runtime part ordinal. */
  anatomicalIdentity: string;

  /** Acquisition, original units, population and unresolved source details. */
  acquisition: string;

  /**
   * Present when the fields above describe another member's acquired file,
   * as for a part authored from its sagittally mirrored contralateral
   * member. It keeps the file this part's own identity names. Omission
   * means the part was authored from the file the fields above describe.
   */
  substitution?: IAutoMovieHumanBodyAtlasSourceSubstitution;
}
