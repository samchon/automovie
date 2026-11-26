import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanLegWalk } from "../leg/IAutoMovieHumanLegWalk";
import type { IAutoMovieHumanSiteControls } from "../limb/IAutoMovieHumanSiteControls";
import type { IAutoMovieHumanSourceDefinition } from "../limb/IAutoMovieHumanSourceDefinition";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";
import type { IAutoMovieHumanFootPart } from "./IAutoMovieHumanFootPart";
import type { IAutoMovieHumanFootSource } from "./IAutoMovieHumanFootSource";
import type { IAutoMovieHumanFootToeSources } from "./IAutoMovieHumanFootToeSources";

/**
 * Type contracts exchanged by AutoMovieHumanFootInterim; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanFootInterim {
  /**
   * A real leg-family ankle capability, without claiming that its upper parent
   * is already complete.
   */
  export interface IAnkleSource {
    /** Original physical ankle station, calibration mm. */

    ankleStation: number;

    /** Same retained distal authority with an explicit full-parent resolver. */

    source: IAutoMovieHumanFootSource.ISource;
  }

  /**
   * The foot input and all five toe sources sharing its actual floor frame and
   * metatarsal support origin, before loft or skin construction.
   */
  export interface IDefinition {
    /**
     * The actual foot builder input, including its shared regional support
     * datum.
     */
    foot: IAutoMovieHumanFootPart.IInput;

    /**
     * Same final original read by the attachments, metric owner and production
     * loft.
     */
    definition: IAutoMovieHumanSourceDefinition;

    /** Hallux first, each with its actual generated attachment and walk. */
    toes: IAutoMovieHumanFootToeSources.ICandidate[];

    /**
     * Nonfatal attachment-premise diagnostics retained before any join or skin.
     * An unavailable breadth source throws before a normalized record can be
     * returned.
     */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * Shared local source controls and child inputs; actual parent publication
   * stays an explicit method.
   */
  export interface IPrepared extends Omit<IDefinition, "definition"> {
    /**
     * Same original scalar/frame controls consumed by the foot and its toe
     * contacts.
     */
    controls: IAutoMovieHumanSiteControls.IOutput;

    /**
     * Publish the same prepared controls on explicit original or assembly demand.
     */
    definition(): IAutoMovieHumanSourceDefinition;
  }

  /**
   * The args argument of AutoMovieHumanFootInterim.define. Explicit
   * original-parent publication preserves the previous public definition
   * contract.
   */
  export type DefineArgs = [
    name: "left" | "right",
    d: IAutoMovieHumanFootFrame.IDimensions,
    ankle: AutoMovieVector3Tuple,
    leg: IAutoMovieHumanLegWalk.IDefinition | IAnkleSource,
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
  ];
}
