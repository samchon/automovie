import type { IAutoMovieHumanBodyParametricParameters } from "../anatomy/measurements/IAutoMovieHumanBodyParametricParameters";

/**
 * One complete numerical request, independent of legacy replay weights.
 *
 * The current articular-head inspector preserves the requested context but
 * supplies only explicit target-radius candidates in a neutral reference rig.
 * The basis names that reference, not a skin generated from these targets.
 * Saved requests carry no personal mesh, centre or second shape document.
 *
 * @evidence contracts/common.md#principled-implementation The simple/detailed union retains physical targets and observed acquisitions without introducing independently authored replay weights.
 * @evidence contracts/common.md#clear-and-simple-design Identity and reference selection extend the existing complete parametric request.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No stored geometry stands in for unresolved anatomy.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the reference basis from a generated person and states what is saved.
 * @evidence contracts/modeling.md#parameter-channels Named measurements keep their existing units and independent side ownership.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The document identifies a request, not a generated anatomical part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It stores no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Measurement types own their units; this envelope introduces no spatial values.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It constructs no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The numerical document is transported to the inspector, whose candidate model owns the displayed output.
 * @evidence contracts/anatomy.md#parametric-authority The inherited targets are named anatomical quantities, never editable vertices or curves.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Measurement definitions and acquisition meaning remain with the inherited types.
 * @evidenceExclude contracts/anatomy.md#permitted-range Runtime admission and the selected inspector own supported conditions.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAnatomicalDocument =
  IAutoMovieHumanBodyParametricParameters & {
    /** Stable identity of this numerical request. */
    readonly id: string;

    /** Display label, independent of generator selection. */
    readonly name: string;

    /** Exact basis identity of the neutral reference rig used for inspection. */
    readonly basis: string;
  };
