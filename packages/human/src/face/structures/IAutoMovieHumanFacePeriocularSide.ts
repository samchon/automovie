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
 * @evidence contracts/common.md#principled-implementation One anatomical side links its actual source brow/card/globe/margin/canthus roles and optional skin cage/implantation band to the existing specialized consumers.
 * @evidence contracts/common.md#clear-and-simple-design Canonical component registrations own their separate domains; the parent supplies left/right and shared producer generation rather than another mirror rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional cage or brow band absence refuses features that require them and supplies no generated anatomy; source metadata does not substitute for topology, physical admission or current visual observation.
 * @evidence contracts/common.md#meaningful-documentation Each member names its exact resident role and optional generated-section registration, avoiding inferred ownership from asset names.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This aggregate implements no role lookup or periocular geometry.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared side ownership establishes correspondence rather than evaluated-pose caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The producer owns nested records; this interface creates no assets, queries or shells.
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
