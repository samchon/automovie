import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/** One site's knots.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation One site's knots.
 * @evidence contracts/development/design.md#principled-representation `site`: The measurement site, such as `stylion` or `waist`, named in diagnostics. `station`: Station along the part's axis, mm. `edges`: The box's edges `[+u, +v, -u, -v]` as signed chart coordinates relative to the axis, mm: the first two above zero, the last two below.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanWalkPart.engineJets. Read by AutoMovieHumanMassPart.radialJets, sameQuarters. Also types AutoMovieHumanArmHandControls.wrist, AutoMovieHumanArmWalk.wrist.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `jets`: Optional four edge jets in the whole source's normalized parameter, each with its edge value's units.
 */
export interface IAutoMovieHumanSectionSite {
  /** The measurement site, such as `stylion` or `waist`, named in diagnostics. */
  site: string;

  /** Station along the part's axis, mm. */
  station: number;

  /** The box's edges `[+u, +v, -u, -v]` as signed chart coordinates relative to the axis, mm: the first two above zero, the last two below. */
  edges: [number, number, number, number];

  /** A taut-tape girth (mm) solved on the site's box, or a sourced conic shoulder in `(0, 1)`. */
  fullness:
    | {
        /** Closed section tape length, millimetres. */
        girth: number;
        /** Optional first/second derivatives in the whole source's normalized parameter, with the parent scalar's units; omission leaves these derivatives undeclared. */
        jet?: IAutoMovieViewPart.IKnot["jet"];
      }
    | {
        /** Dimensionless native conic shoulder controlling section fullness; the owning section builder admits its range. */
        shoulder: number;
        /** Optional first/second derivatives in the whole source's normalized parameter, with the parent scalar's units; omission leaves these derivatives undeclared. */
        jet?: IAutoMovieViewPart.IKnot["jet"];
      };

  /** Optional four edge jets in the whole source's normalized parameter, each with its edge value's units. */
  jets?: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IKnot["jet"]>;
}
