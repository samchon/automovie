import type { IAutoMovieHumanFacePeriocularCanthi } from "./IAutoMovieHumanFacePeriocularCanthi";
import type { IAutoMovieHumanFacePeriocularComponent } from "./IAutoMovieHumanFacePeriocularComponent";
import type { IAutoMovieHumanFacePeriocularGlobe } from "./IAutoMovieHumanFacePeriocularGlobe";
import type { IAutoMovieHumanFacePeriocularLashes } from "./IAutoMovieHumanFacePeriocularLashes";
import type { IAutoMovieHumanFacePeriocularMargins } from "./IAutoMovieHumanFacePeriocularMargins";
import type { IAutoMovieHumanFacePeriocularCage } from "./IAutoMovieHumanFacePeriocularCage";
import type { IAutoMovieHumanFacePeriocularBrowBand } from "./IAutoMovieHumanFacePeriocularBrowBand";

/**
 * The periocular registration of one eye.
 *
 * @evidence contracts/common.md#principled-implementation Groups the five periocular roles of one eye.
 * @evidence contracts/common.md#clear-and-simple-design Five named members, one per role.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Roles come from the source producer's registration, never from asset names.
 * @evidence contracts/common.md#meaningful-documentation States what each member identifies and who supplies it.
 * @evidence contracts/modeling.md#spatial-conventions Members state their own frames.
 * @evidenceExclude contracts/modeling.md#parameter-channels Registers identity; defines no channel.
 * @evidence contracts/modeling.md#part-identity-and-grouping Names the parts of one eye region.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries The margins and canthi are this eye's shared lid boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source manifest records the CC0 data or mesh reading each entry comes from.
 * @evidenceExclude contracts/anatomy.md#permitted-range Registers identity; bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Producer registration, not an authored control.
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
