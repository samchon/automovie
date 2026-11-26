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
    /** Latest actual coupled definition, or the base before explicit assembly. */
    current(): IAutoMovieHumanLegWalk.IDefinition;

    /**
     * Same bounded calf-to-cap authority without forcing the full leg or
     * upper-parent completion.
     */
    ankle(): IAnkle;

    /**
     * Replace the current coupled definition with a trial or final proximal
     * prefix against this parent at station in calibration millimetres; binding
     * alone does not complete the parent.
     */
    bind(
      parent: IAutoMovieHumanSourceDefinition,
      station: number,
    ): IAutoMovieHumanLegWalk.IDefinition;
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
     * Successfully complete the owning trunk before full demand, or throw its
     * failure; binding a trial alone is not completion.
     */
    complete?: () => void;
  }
}
