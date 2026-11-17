import type { IAutoMovieLoftContract } from "../../../construction/IAutoMovieLoftContract";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanLegWalk } from "../leg/IAutoMovieHumanLegWalk";
import type { IAutoMovieHumanSiteControls } from "../limb/IAutoMovieHumanSiteControls";
import type { IAutoMovieHumanSiteViewPart } from "../limb/IAutoMovieHumanSiteViewPart";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";
import type { IAutoMovieHumanFootPart } from "./IAutoMovieHumanFootPart";
import type { IAutoMovieHumanFootSource } from "./IAutoMovieHumanFootSource";
import type { IAutoMovieHumanFootToeSources } from "./IAutoMovieHumanFootToeSources";

/** Type contracts exchanged by AutoMovieHumanFootInterim; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootInterim {
  /** A real leg-family ankle capability, without claiming that its upper parent is already complete.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A real leg-family ankle capability, without claiming that its upper parent is already complete.
   * @evidence contracts/development/design.md#principled-representation `ankleStation`: Original physical ankle station, calibration mm. `source`: Same retained distal authority with an explicit full-parent resolver.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanFootInterim.prepare.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `ankleStation`, `source`; callers supply the complete record.
   */
  export interface IAnkleSource {
    /** Original physical ankle station, calibration mm. */

    ankleStation: number;

    /** Same retained distal authority with an explicit full-parent resolver. */

    source: IAutoMovieHumanFootSource.ISource;
  }

  /**
   * The foot input and all five toe sources sharing its actual floor frame
   * and metatarsal support origin, before loft or skin construction.
   *
   * @evidence contracts/common.md#principled-implementation Makes the actual foot's heel, axis and regional supports the source for every toe.
   * @evidence contracts/common.md#clear-and-simple-design Owns one foot input and five explicit attachment records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not recover placement from a generated course or reuse the old skeletal foot's different yaw and origin.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes source inputs from a realized foot, and skin attachments from skeletal centres.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result type declares no runtime algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The define owner determines how the records are shared.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The generating call owns the finite result without global retention.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The foot input and all five toe sources sharing its actual floor frame and metatarsal support origin, before loft or skin construction.
   * @evidence contracts/development/design.md#principled-representation `foot`: The actual foot builder input, including its shared regional support datum. `definition`: Same final original read by the attachments, metric owner and production loft. `toes`: Hallux first, each with its actual generated attachment and walk.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootInterim.define.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `foot`, `definition`, `toes`, `diagnostics`; callers supply the complete record.
   */
  export interface IDefinition {
    /** The actual foot builder input, including its shared regional support datum. */
    foot: IAutoMovieHumanFootPart.IInput;

    /** Same final original read by the attachments, metric owner and production loft. */
    definition: IAutoMovieHumanSiteViewPart.IDefinition;

    /** Hallux first, each with its actual generated attachment and walk. */
    toes: IAutoMovieHumanFootToeSources.ICandidate[];

    /** Nonfatal attachment-premise diagnostics retained before any join or skin. An unavailable breadth source throws before a normalized record can be returned. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }

  /** Shared local source controls and child inputs; actual parent publication stays an explicit method.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Shared local source controls and child inputs; actual parent publication stays an explicit method.
   * @evidence contracts/development/design.md#principled-representation `controls`: Same original scalar/frame controls consumed by the foot and its toe contacts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootInterim.prepare. Also types AutoMovieHumanFootInterim.shared, AutoMovieHumanLegSources.foot.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `controls`; callers supply the complete record.
   */
  export interface IPrepared extends Omit<IDefinition, "definition"> {
    /** Same original scalar/frame controls consumed by the foot and its toe contacts. */
    controls: IAutoMovieHumanSiteControls.IOutput;

    /** Publish the actual foot only on explicit original/assembly demand, retaining one identical result. */
    definition(): IAutoMovieHumanSiteViewPart.IDefinition;
  }

  /** The args argument of AutoMovieHumanFootInterim.define. Explicit original-parent publication preserves the previous public definition contract.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explicit original-parent publication preserves the previous public definition contract.
   * @evidence contracts/development/design.md#principled-representation Explicit original-parent publication preserves the previous public definition contract. Ordered tuple slots are name, d, ankle, leg, measures, scale; fixed arity preserves their correspondence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFootInterim.DefineArgs is the canonical exchange used by AutoMovieHumanFootInterim.define.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFootInterim.define for explicit original-parent publication preserves the previous public definition contract.
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
