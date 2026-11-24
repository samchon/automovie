import type { IAutoMovieHumanFootInterim } from "../foot/IAutoMovieHumanFootInterim";
import type { IAutoMovieHumanFootSource } from "../foot/IAutoMovieHumanFootSource";
import type { IAutoMovieHumanSourceDefinition } from "../limb/IAutoMovieHumanSourceDefinition";
import type { IAutoMovieHumanLegBones } from "./IAutoMovieHumanLegBones";
import type { IAutoMovieHumanLegWalk } from "./IAutoMovieHumanLegWalk";

/**
 * Type contracts exchanged by AutoMovieHumanLegSourceFamily; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanLegSourceFamily {
  /** Regional and full demands of the same production family. */
  export interface IOutput {
    /** Independent base before explicit attachment to the trunk. */
    current(): IAutoMovieHumanLegWalk.IDefinition;

    /**
     * Same bounded calf-to-cap authority without forcing the full leg or
     * upper-parent completion.
     */
    ankle(): IAnkle;

    /**
     * Author a proximal prefix against this parent at station in calibration
     * millimetres.
     */
    bind(
      parent: IAutoMovieHumanSourceDefinition,
      station: number,
    ): IAutoMovieHumanLegWalk.IDefinition;

    /** Prepare the independent base once for an explicit parent fitting scope. */
    prepareBinding(): IOutput["bind"];
  }

  /** Exact retained region with the actual explicit full-resolver capability. */
  export type IAnkle = Omit<
    IAutoMovieHumanFootInterim.IAnkleSource,
    "source"
  > & {
    /**
     * Only complete requests the real full original; name/frame/property reads
     * remain local metadata.
     */
    source: IAutoMovieHumanFootSource.IRegional;
  };

  /**
   * Invocation-owned production inputs and its optional full-parent completion
   * seam.
   */
  export interface IInput {
    /** Existing side-qualified production name. */
    name: string;

    /** Actual immutable bone frames. */
    bones: Pick<IAutoMovieHumanLegBones.IBones, "hip" | "knee" | "ankle">;
    /** Existing measured and intermediate source laws. */
    law: IAutoMovieHumanLegWalk.ILaw;

    /** Existing emission spacing, calibration mm. */
    gap: number;

    /**
     * Return the final leg from its owning trunk on explicit full demand, or
     * throw its failure.
     */
    complete?: IAutoMovieHumanFootSource.FromRegionResolve;
  }
}
