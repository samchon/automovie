import type { IAutoMovieHumanArmConstruction } from "./IAutoMovieHumanArmConstruction";
import type { IAutoMovieHumanBodyLane } from "./IAutoMovieHumanBodyLane";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanLimbRest } from "./IAutoMovieHumanLimbRest";
import type { IAutoMovieHumanSourceDefinition } from "./IAutoMovieHumanSourceDefinition";

/**
 * Type contracts exchanged by AutoMovieHumanArmSources; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanArmSources {
  /**
   * Source-only capabilities; no full body, raw loft or proximal join is
   * implied.
   */
  export interface IOutput {
    /**
     * Request the retained complete arm definition; the first demand prepares
     * the arm controls and later demands return that definition. Preparation
     * failures propagate.
     */
    definition(): IAutoMovieHumanSourceDefinition;

    /**
     * Return fresh assembly metadata referring to the retained arm definition
     * and original joints; the assembly supplies the trunk fold separately.
     */
    arm(): Omit<IAutoMovieHumanBodyLane.ISide["arm"], "trunk">;

    /** Existing digit names without authoring their geometry. */
    digitNames: readonly string[];

    /**
     * Request a side-qualified digit name from digitNames, reusing its retained
     * palm controls and result; return undefined for an unknown name.
     * Preparation failures propagate.
     */
    digit(name: string): IAutoMovieHumanBodyLane.IDigit | undefined;

    /**
     * Request all four fingers and the thumb in digitNames order; return a new
     * array containing the retained digit results. Preparation failures
     * propagate.
     */
    fingers(): IAutoMovieHumanBodyLane.IDigit[];
  }

  /** The arm's actual inputs; no other source, curve or mesh is required. */
  export interface IInput {
    /** Side-qualified source names. */
    side: "left" | "right";

    /** The same direct rest definition later used by bind bones. */
    rest: IAutoMovieHumanLimbRest.IArm;

    /** Public arm/hand dimensions, calibration mm. */
    arms: IAutoMovieHumanArmConstruction.IInputs & {
      /**
       * Requested full shoulder breadth across both deltoids, calibration
       * millimetres.
       */
      bideltoid: number;
    };

    /** Resolved public measures used by the original digit law. */
    measures: IAutoMovieHumanBodyMeasures;

    /** Calibration scale. */
    scale: number;
  }
}
