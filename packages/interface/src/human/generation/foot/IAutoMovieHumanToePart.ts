import type { IAutoMovieViewParallelAxis } from "../../../construction/IAutoMovieViewParallelAxis";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanDigitWalk } from "../limb/IAutoMovieHumanDigitWalk";
import type { IAutoMovieHumanSectionSource } from "../limb/IAutoMovieHumanSectionSource";
import type { IAutoMovieHumanSourceDefinition } from "../limb/IAutoMovieHumanSourceDefinition";
import type { IAutoMovieHumanToeVertical } from "./IAutoMovieHumanToeVertical";

/**
 * Foot-axis toe originals and shared millimetre coordinate sources, with
 * optional parent-derived vertical laws.
 *
 * The interface package owns these declarations; AutoMovieHumanToePart in Human
 * supplies their runtime values.
 */
export namespace IAutoMovieHumanToePart {
  /**
   * The toe's original point course and foot-axis section laws, calibration mm.
   *
   * Keeps generating centres and apex separate from the fixed directions that
   * own their measured across/depth chart. Point course, one foot direction and
   * site laws are the complete source input. No point is labeled as an observed
   * MTP/PIP/DIP or recovered from a loft. Members state units, station meaning
   * and the distal apex's separate ownership. The input type declares no
   * algorithm. The source builder owns preparation and sharing. The generating
   * caller owns the points and laws during the synchronous build.
   */
  export interface IInput {
    /** Anatomical source name, toe.left.1 through toe.right.5. */
    name: string;

    /**
     * Named generating points on the plan-affine hidden-start-to-apex course
     * and the declared height source; not measured joints.
     */
    centres: AutoMovieVector3Tuple[];

    /** Declared generated skin apex; no further pulp reach is added. */
    apex: AutoMovieVector3Tuple;

    /**
     * Unit level foot-along direction owning the observation's longitudinal
     * coordinate.
     */
    along: AutoMovieVector3Tuple;

    /**
     * Retained distal half-depth, calibration mm; constant axis height only
     * when the explicit vertical source is absent.
     */
    height: number;

    /**
     * Actual local-parent transfer and one same-clock origin/plantar source;
     * absent only for constant-height analytic fixtures.
     */
    vertical?: IAutoMovieHumanToeVertical.ISource;

    /**
     * Original breadth/depth laws in the fixed foot chart, using the existing
     * generating-site names.
     */
    law: IAutoMovieHumanDigitWalk.IInput["law"];

    /** Optional closed scalar source bounds in that same up/across chart. */
    ranges: IAutoMovieHumanSectionSource["ranges"];

    /** Section control count and ring phase count. */
    order: number;

    /** Maximum source layer spacing in foot-along millimetres. */
    gap: number;
  }

  /**
   * One exact millimetre origin and its canonical metre declaration, before any
   * unit round trip or loft.
   */
  export interface ISource extends IAutoMovieHumanSectionSource {
    /**
     * Original coordinate curves; the same mm clock owns this origin and the
     * signed radial curves.
     */
    origin: IAutoMovieViewParallelAxis.IOrigin;
  }

  /**
   * Final source plus the exact millimetre coordinate owner used by its axis
   * and horizontal metric readers.
   */
  export interface IDefinition extends IAutoMovieHumanSourceDefinition {
    /** Present on success; absent on an input/axis failure. */
    origin?: IAutoMovieViewParallelAxis.IOrigin;
  }
}
