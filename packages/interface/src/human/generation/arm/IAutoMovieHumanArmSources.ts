import type { IAutoMovieHumanArmConstruction } from "../IAutoMovieHumanArmConstruction";
import type { IAutoMovieHumanBodyLane } from "../IAutoMovieHumanBodyLane";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanLimbRest } from "../IAutoMovieHumanLimbRest";
import type { IAutoMovieHumanSourceDefinition } from "../limb/IAutoMovieHumanSourceDefinition";

/**
 * Type contracts exchanged by AutoMovieHumanArmSources; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanArmSources exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IOutput, IInput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanArmSources; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IOutput, IInput contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanArmSources {
  /** Source-only capabilities; no full body, raw loft or proximal join is implied.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Source-only capabilities; no full body, raw loft or proximal join is implied.
   * @evidence contracts/development/design.md#principled-representation `digitNames`: Existing digit names without authoring their geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmSources.create. Also types AutoMovieHumanLimbSources.arms, AutoMovieHumanLimbSources.previous.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `digitNames`; callers supply the complete record.
   */
  export interface IOutput {
    /**
     * Request the retained complete arm definition; the first demand prepares the arm controls and later demands return that definition. Preparation failures propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Request the retained complete arm definition; the first demand prepares the arm controls and later demands return that definition. Preparation failures propagate.
     */
    definition(): IAutoMovieHumanSourceDefinition;

    /**
     * Return fresh assembly metadata referring to the retained arm definition and original joints; the assembly supplies the trunk fold separately.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Return fresh assembly metadata referring to the retained arm definition and original joints; the assembly supplies the trunk fold separately.
     */
    arm(): Omit<IAutoMovieHumanBodyLane.ISide["arm"], "trunk">;

    /** Existing digit names without authoring their geometry. */
    digitNames: readonly string[];

    /**
     * Request a side-qualified digit name from digitNames, reusing its retained palm controls and result; return undefined for an unknown name. Preparation failures propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Request a side-qualified digit name from digitNames, reusing its retained palm controls and result; return undefined for an unknown name. Preparation failures propagate.
     */
    digit(name: string): IAutoMovieHumanBodyLane.IDigit | undefined;

    /**
     * Request all four fingers and the thumb in digitNames order; return a new array containing the retained digit results. Preparation failures propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Request all four fingers and the thumb in digitNames order; return a new array containing the retained digit results. Preparation failures propagate.
     */
    fingers(): IAutoMovieHumanBodyLane.IDigit[];
  }

  /** The arm's actual inputs; no other source, curve or mesh is required.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The arm's actual inputs; no other source, curve or mesh is required.
   * @evidence contracts/development/design.md#principled-representation `side`: Side-qualified source names. `rest`: The same direct rest definition later used by bind bones. `arms`: Public arm/hand dimensions, calibration mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanArmSources.names, AutoMovieHumanArmSources.create. Also types AutoMovieHumanArmSources.side, AutoMovieHumanArmSources.{ shoulder, elbow, wrist }.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `side`, `rest`, `arms`, `measures`, `scale`; callers supply the complete record.
   */
  export interface IInput {
    /** Side-qualified source names. */
    side: "left" | "right";

    /** The same direct rest definition later used by bind bones. */
    rest: IAutoMovieHumanLimbRest.IArm;

    /** Public arm/hand dimensions, calibration mm. */
    arms: IAutoMovieHumanArmConstruction.IInputs & {
      /** Requested full shoulder breadth across both deltoids, calibration millimetres. */
      bideltoid: number;
    };

    /** Resolved public measures used by the original digit law. */
    measures: IAutoMovieHumanBodyMeasures;

    /** Calibration scale. */
    scale: number;
  }
}
