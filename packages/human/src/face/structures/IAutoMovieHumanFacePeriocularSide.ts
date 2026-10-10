import type { IAutoMovieHumanFacePeriocularBrowBand } from "./IAutoMovieHumanFacePeriocularBrowBand";
import type { IAutoMovieHumanFacePeriocularCage } from "./IAutoMovieHumanFacePeriocularCage";
import type { IAutoMovieHumanFacePeriocularCanthi } from "./IAutoMovieHumanFacePeriocularCanthi";
import type { IAutoMovieHumanFacePeriocularComponent } from "./IAutoMovieHumanFacePeriocularComponent";
import type { IAutoMovieHumanFacePeriocularGlobe } from "./IAutoMovieHumanFacePeriocularGlobe";
import type { IAutoMovieHumanFacePeriocularLashes } from "./IAutoMovieHumanFacePeriocularLashes";
import type { IAutoMovieHumanFacePeriocularMargins } from "./IAutoMovieHumanFacePeriocularMargins";

/**
 * The periocular registration of one eye.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularSide {
  /** This side's brow: its surface and the vertices of that surface it owns. */
  brow: IAutoMovieHumanFacePeriocularComponent;

  /** This side's lashes: surface, upper and lower regions, owned vertices. */
  lashes: IAutoMovieHumanFacePeriocularLashes;

  /** This side's globe: surface and attachment owner. */
  globe: IAutoMovieHumanFacePeriocularGlobe;

  /** This side's upper and lower lid margins on the skin. */
  margins: IAutoMovieHumanFacePeriocularMargins;

  /** This side's medial and lateral canthus definitions. */
  canthi: IAutoMovieHumanFacePeriocularCanthi;

  /** Optional licensed host cage for full coarse sections and tissue shells. */
  cage?: IAutoMovieHumanFacePeriocularCage;

  /** Optional licensed complete forehead implantation band. */
  browBand?: IAutoMovieHumanFacePeriocularBrowBand;
}
