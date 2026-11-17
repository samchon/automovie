import type { IAutoMovieViewParallelAxis } from "../../../construction/IAutoMovieViewParallelAxis";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanDigitWalk } from "../limb/IAutoMovieHumanDigitWalk";
import type { IAutoMovieHumanSiteViewPart } from "../limb/IAutoMovieHumanSiteViewPart";
import type { IAutoMovieHumanToeVertical } from "./IAutoMovieHumanToeVertical";

/** Type contracts exchanged by AutoMovieHumanToePart; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanToePart {
  /**
   * The toe's original point course and foot-axis section laws, calibration mm.
   *
   * @evidence contracts/common.md#principled-implementation Keeps generating centres and apex separate from the fixed directions that own their measured across/depth chart.
   * @evidence contracts/common.md#clear-and-simple-design Point course, one foot direction and site laws are the complete source input.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No point is labeled as an observed MTP/PIP/DIP or recovered from a loft.
   * @evidence contracts/common.md#meaningful-documentation Members state units, station meaning and the distal apex's separate ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The input type declares no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The source builder owns preparation and sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The generating caller owns the points and laws during the synchronous build.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The toe's original point course and foot-axis section laws, calibration mm.
   * @evidence contracts/development/design.md#principled-representation `name`: Anatomical source name, toe.left.1 through toe.right.5. `centres`: Named generating points on the plan-affine hidden-start-to-apex course and the declared height source; not measured joints. `apex`: Declared generated skin apex; no further pulp reach is added.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootInterim.toes. Read by AutoMovieHumanFootBreadth.measure, AutoMovieHumanToePart.create, AutoMovieHumanToePart.define.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `vertical`: Actual local-parent transfer and one same-clock origin/plantar source; absent only for constant-height analytic fixtures.
   */
  export interface IInput {
    /** Anatomical source name, toe.left.1 through toe.right.5. */
    name: string;

    /** Named generating points on the plan-affine hidden-start-to-apex course and the declared height source; not measured joints. */
    centres: AutoMovieVector3Tuple[];

    /** Declared generated skin apex; no further pulp reach is added. */
    apex: AutoMovieVector3Tuple;

    /** Unit level foot-along direction owning the observation's longitudinal coordinate. */
    along: AutoMovieVector3Tuple;

    /** Retained distal half-depth, calibration mm; constant axis height only when the explicit vertical source is absent. */
    height: number;

    /** Actual local-parent transfer and one same-clock origin/plantar source; absent only for constant-height analytic fixtures. */
    vertical?: IAutoMovieHumanToeVertical.ISource;

    /** Original breadth/depth laws in the fixed foot chart, using the existing generating-site names. */
    law: IAutoMovieHumanDigitWalk.IInput["law"];

    /** Optional closed scalar source bounds in that same up/across chart. */
    ranges: IAutoMovieHumanSiteViewPart.IInput["ranges"];

    /** Section control count and ring phase count. */
    order: number;

    /** Maximum source layer spacing in foot-along millimetres. */
    gap: number;
  }

  /** One exact millimetre origin and its canonical metre declaration, before any unit round trip or loft.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One exact millimetre origin and its canonical metre declaration, before any unit round trip or loft.
   * @evidence contracts/development/design.md#principled-representation `origin`: Original coordinate curves; the same mm clock owns this origin and the signed radial curves.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanToePart.source. Also types AutoMovieHumanToePart.declaration.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `origin`; callers supply the complete record.
   */
  export interface ISource extends IAutoMovieHumanSiteViewPart.IInput {
    /** Original coordinate curves; the same mm clock owns this origin and the signed radial curves. */
    origin: IAutoMovieViewParallelAxis.IOrigin;
  }

  /** Final source plus the exact millimetre coordinate owner used by its axis and horizontal metric readers.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Final source plus the exact millimetre coordinate owner used by its axis and horizontal metric readers.
   * @evidence contracts/development/design.md#principled-representation `origin`: Present on success; absent on an input/axis failure.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanToePart.define.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `origin`: Present on success; absent on an input/axis failure.
   */
  export interface IDefinition extends IAutoMovieHumanSiteViewPart.IDefinition {
    /** Present on success; absent on an input/axis failure. */
    origin?: IAutoMovieViewParallelAxis.IOrigin;
  }
}
