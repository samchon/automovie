import type { IAutoMovieHumanBodyAtlasSourceSubstitution } from "./IAutoMovieHumanBodyAtlasSourceSubstitution";

/**
 * Provenance and rights of an acquired atlas surface, distinct from an
 * independently measured person's tissue or a population prediction.
 *
 * The offline compiler records the actual download and acquisition account.
 * Unknown acquisition details remain explicit text rather than implied
 * clinical registration. Attribution follows the asset through export.
 *
 * @evidence contracts/common.md#principled-implementation Source identity, bytes and rights travel together and cannot be inferred from a part name.
 * @evidence contracts/common.md#clear-and-simple-design One source receipt shared by registered atlas parts.
 * @evidenceExclude contracts/common.md#prohibited-implementation-shortcuts This record transports provenance.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes atlas provenance from clinical validation.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The enclosing resource names the part.
 * @evidenceExclude contracts/modeling.md#parameter-channels No authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry No emitted geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The registered resource owns coordinates.
 * @evidenceExclude contracts/modeling.md#shared-boundaries No constructed boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The resource consumer observes the surface.
 * @evidence contracts/anatomy.md#anatomical-source The receipt retains the atlas acquisition account and its unknowns without converting a single atlas to cohort evidence.
 * @evidenceExclude contracts/anatomy.md#permitted-range No physiological admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Offline source, never personal mesh input.
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
