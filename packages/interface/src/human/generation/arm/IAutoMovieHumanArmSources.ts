import type { IAutoMovieHumanArmConstruction } from "../IAutoMovieHumanArmConstruction";
import type { IAutoMovieHumanBodyLane } from "../IAutoMovieHumanBodyLane";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanLimbRest } from "../IAutoMovieHumanLimbRest";
import type { IAutoMovieHumanSourceDefinition } from "../limb/IAutoMovieHumanSourceDefinition";

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
     * Prepare the complete arm definition on the scope's fixed arm and palm
     * fields. Preparation failures propagate.
     */
    definition(): IAutoMovieHumanSourceDefinition;

    /**
     * Prepare the original and its assembly metadata together. The assembly
     * supplies the trunk fold separately.
     */
    arm(): Omit<IAutoMovieHumanBodyLane.ISide["arm"], "trunk">;

    /** Existing digit names without authoring their geometry. */
    digitNames: readonly string[];

    /**
     * Prepare the named digit against the same palm controls. An unknown name
     * returns undefined. Preparation failures propagate.
     */
    digit(name: string): IAutoMovieHumanBodyLane.IDigit | undefined;

    /**
     * Prepare all four fingers and the thumb in digitNames order from one
     * shared hand attachment scope. Preparation failures propagate.
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
