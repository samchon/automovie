import { IAutoMovieOpeningOperation } from "./IAutoMovieOpeningOperation";
import { IAutoMovieOpeningProfile } from "./IAutoMovieOpeningProfile";

/**
 * One traversable or visible opening through a boundary.
 *
 * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-form-layout Exposes `IAutoMovieBuiltOpening` as the portable data boundary for the building opening form layout requirement.
 * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-cut-input-output Types `IAutoMovieBuiltOpening` for the building envelope opening cut input output system contract.
 */
export interface IAutoMovieBuiltOpening {
  /**
   * Stable opening identity.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-form-layout Exposes `id` as the portable data boundary for the building opening form layout requirement.
   * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-cut-input-output Types `id` for the building envelope opening cut input output system contract.
   */
  id: string;
  /**
   * Open semantic label such as `door`, `window`, `arch`, or `passage`.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-form-layout Exposes `kind` as the portable data boundary for the building opening form layout requirement.
   * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-cut-input-output Types `kind` for the building envelope opening cut input output system contract.
   */
  kind: string;
  /**
   * Boundary containing this opening.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-form-layout Exposes `boundary` as the portable data boundary for the building opening form layout requirement.
   * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-cut-input-output Types `boundary` for the building envelope opening cut input output system contract.
   */
  boundary: string;
  /**
   * Door, sash, gate, or other filling element; null for an open cut.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-form-layout Exposes `fill` as the portable data boundary for the building opening form layout requirement.
   * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-cut-input-output Types `fill` for the building envelope opening cut input output system contract.
   */
  fill: string | null;
  /**
   * The void this opening actually cuts in its host boundary's face.
   *
   * Omitting it keeps the pre-geometry record: the opening is a declared
   * relation and nothing is checked about where it is. Stating it demands the
   * host carry a {@link IAutoMovieBuiltBoundary.face}, and the void is then held
   * inside that face and apart from every other void on it.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-form-layout Exposes `profile` as the portable data boundary for the building opening form layout requirement.
   * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-cut-input-output Types `profile` for the building envelope opening cut input output system contract.
   */
  profile?: IAutoMovieOpeningProfile;
  /**
   * Movable panels and the named states they stand in, or nothing for a fixed
   * cut such as an arch or a permanently open passage.
   *
   * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-form-layout Exposes `operation` as the portable data boundary for the building opening form layout requirement.
   * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-opening-cut-input-output Types `operation` for the building envelope opening cut input output system contract.
   */
  operation?: IAutoMovieOpeningOperation;
}
