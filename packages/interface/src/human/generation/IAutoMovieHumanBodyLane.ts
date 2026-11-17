import type { IAutoMovieConstructionNode } from "../../construction/IAutoMovieConstructionNode";
import type { IAutoMovieLoftChain } from "../../construction/IAutoMovieLoftChain";
import type { IAutoMovieLoftContract } from "../../construction/IAutoMovieLoftContract";
import type { IAutoMovieSolidBody } from "../../construction/IAutoMovieSolidBody";
import type { IAutoMovieViewPart } from "../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanBodyTree } from "./IAutoMovieHumanBodyTree";
import type { IAutoMovieHumanArmBones } from "./arm/IAutoMovieHumanArmBones";
import type { IAutoMovieHumanArmWalk } from "./arm/IAutoMovieHumanArmWalk";
import type { IAutoMovieHumanFootPart } from "./foot/IAutoMovieHumanFootPart";
import type { IAutoMovieHumanToePart } from "./foot/IAutoMovieHumanToePart";
import type { IAutoMovieHumanHandAttachment } from "./hand/IAutoMovieHumanHandAttachment";
import type { IAutoMovieHumanHeadLane } from "./head/IAutoMovieHumanHeadLane";
import type { IAutoMovieHumanLegBones } from "./leg/IAutoMovieHumanLegBones";
import type { IAutoMovieHumanLegWalk } from "./leg/IAutoMovieHumanLegWalk";
import type { IAutoMovieHumanDigitWalk } from "./limb/IAutoMovieHumanDigitWalk";
import type { IAutoMovieHumanNamedSource } from "./limb/IAutoMovieHumanNamedSource";
import type { IAutoMovieHumanSourceDefinition } from "./limb/IAutoMovieHumanSourceDefinition";
import type { IAutoMovieHumanSourceRealization } from "./limb/IAutoMovieHumanSourceRealization";
import type { IAutoMovieHumanTrunkBuild } from "./trunk/IAutoMovieHumanTrunkBuild";

/**
 * Original limb/head inputs, attachment folds and production-tree results, retaining source failures before realization.
 *
 * The interface package owns these declarations; AutoMovieHumanBodyLane in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Original limb/head inputs, attachment folds and production-tree results, retaining source failures before realization. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IFold, ISide, IDigit, IToe, IInput, IOutput, IDefinition declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IFold, ISide, IDigit, IToe, IInput, IOutput, IDefinition separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanBodyLane exchanges the named IFold, ISide, IDigit, IToe, IInput, IOutput, IDefinition contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanBodyLane {
  /** A join's seed search and fold, calibration mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A join's seed search and fold, calibration mm.
   * @evidence contracts/development/design.md#principled-representation `search`: Where the seed is searched: the part's phase and the shares of its station range from inside the host to outside it. `radius`: The fold's radius, mm. `cap`: The widest chord either side, mm; absent, the lane's own cap for that join.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanBodyLane.fold, AutoMovieHumanBodyLaneInterim.fold.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `cap`: The widest chord either side, mm; absent, the lane's own cap for that join.
   */
  export interface IFold {
    /** Where the seed is searched: the part's phase and the shares of its station range from inside the host to outside it. */
    search: {
      /** Section phase in radians, increasing according to the source curve's orientation. */
      phi: number;
      /** Start of the seed-search interval as a dimensionless share of the part's station span. */
      from: number;
      /** End of the seed-search interval as a dimensionless share of the part's station span. */
      to: number;
    };

    /** The fold's radius, mm. */
    radius: number;

    /** The widest chord either side, mm; absent, the lane's own cap for that join. */
    cap?: number;
  }

  /** One side's limbs and extremities.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One side's limbs and extremities.
   * @evidence contracts/development/design.md#principled-representation `leg`: The leg's bones and its sites' laws. `arm`: The arm's bones, the palm's last centre and reach, its sites' laws and joints, its fold onto the trunk. `foot`: The foot.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanBodyLane.side, AutoMovieHumanBodyLaneInterim.side.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `leg`, `arm`, `foot`, `footDefinition`, `fingers`, `digitNames`, `toes`, `toeNames`; callers supply the complete record.
   */
  export interface ISide {
    /** The leg's bones and its sites' laws. */
    leg: {
      /** Resolved joint centres for this limb in the registered body frame, millimetres. */
      bones: Pick<IAutoMovieHumanLegBones.IBones, "hip" | "knee" | "ankle">;
      /** Prepared leg-axis and section law shared by publication and attachments. */
      law: IAutoMovieHumanLegWalk.ILaw;
      /** Prepared leg original, including its admitted view and diagnostics before raw lofting. */
      definition: IAutoMovieHumanLegWalk.IDefinition;
      /** Publish the actual leg consuming this final/trial parent's named hip source. */
      bind(
        parent: IAutoMovieHumanSourceDefinition,
        station: number,
      ): IAutoMovieHumanLegWalk.IDefinition;
      /** Physical station and phase interval of this limb's shared fold with the trunk. */
      trunk: IFold;
      /** Physical station and phase interval of the shared leg-to-foot fold. */
      foot: IFold;
    };

    /** The arm's bones, the palm's last centre and reach, its sites' laws and joints, its fold onto the trunk. */
    arm: {
      /** Identical normalized original shared by this loft and hand attachments. */
      definition: IAutoMovieHumanSourceDefinition;
      /** Resolved joint centres for this limb in the registered body frame, millimetres. */
      bones: Pick<
        IAutoMovieHumanArmBones.IBones,
        "shoulder" | "elbow" | "wrist"
      >;
      /** Third metacarpal head in the registered body frame, millimetres. */
      knuckle: AutoMovieVector3Tuple;
      /** Palmar base-crease locus from the person's independent palm length. */
      crease?: AutoMovieVector3Tuple;
      /** Actual radial hand-across direction for the WJC-to-MCP3 material transition. */
      radial: AutoMovieVector3Tuple;
      /** Distal palm-cap reach beyond the final centre, millimetres. */
      reach: number;
      /** Downward upper-arm measuring convention and proximal source domain. */
      measuring: IAutoMovieHumanArmWalk.IMeasuring;
      /** Arm site laws in proximal-to-distal order. */
      sites: IAutoMovieHumanArmWalk.ISiteLaw[];
      /** Elbow and wrist physical turn-window lengths, millimetres. */
      joints: {
        /** Full elbow depth defining its C2 turn-window length, millimetres. */
        elbow: number;
        /** Full wrist depth defining its C2 turn-window length, millimetres. */
        wrist: number;
      };
      /** Physical station and phase interval of this limb's shared fold with the trunk. */
      trunk: IFold;
    };

    /** The foot. */
    foot: IAutoMovieHumanFootPart.IInput;
    /** Same final foot original consumed by its loft and toe contact readers. */
    footDefinition: IAutoMovieHumanSourceDefinition;

    /** The fingers and the thumb, each with its web's fold onto the palm. */
    fingers: IDigit[];
    /** Actual digit factory keys; enumeration does not evaluate their geometry. */
    digitNames: readonly string[];
    /**
     * Prepare just this actual digit original; other digits are not evaluated.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Prepare just this actual digit original; other digits are not evaluated.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanBodyLane and the callback provider must satisfy the documented digit contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanBodyLane and its callback provider own the cost of each digit invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanBodyLane and the callback provider determine when the inputs to digit describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanBodyLane and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanBodyLane.ISide.digit callable contract, without an implementation body. AutoMovieHumanBodyLane and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanBodyLane.ISide.digit declares only the invocation boundary; decomposition belongs to AutoMovieHumanBodyLane and the callback provider.
     */
    digit(name: string): IDigit | undefined;

    /** The toes, each with its web's fold onto the forefoot. */
    toes: IToe[];
    /** Names from the same foot-placement rows consumed by the toe producer. */
    toeNames: readonly string[];
  }

  /** A digit's input and its web's fold.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A digit's input and its web's fold.
   * @evidence contracts/development/design.md#principled-representation `definition`: Same prepared original consumed by both the selected reader and production raw loft. `digit`: The digit. `fold`: Its web's fold onto the host.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanBodyLane.branches, AutoMovieHumanBodyLane.baseOf.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `definition`, `digit`, `fold`; callers supply the complete record.
   */
  export interface IDigit {
    /** Same prepared original consumed by both the selected reader and production raw loft. */
    definition: IAutoMovieHumanSourceDefinition;
    /** The digit. */
    digit: IAutoMovieHumanDigitWalk.IInput;

    /** Its web's fold onto the host. */
    fold: IFold;
  }

  /**
   * A toe's foot-axis skin source and its declared fold onto the forefoot.
   *
   * Keeps the fixed foot-observation source separate from a finger's joint-normal input.
   * One toe input and fold are sufficient for the existing branch assembly.
   * No final join success, skeletal registration or missing-source substitute is encoded.
   * States source-plane ownership and distinguishes the pending fold from a realized attachment.
   * This declaration owns no algorithm.
   * The branch builder owns source construction and sharing.
   * The definition caller owns the record and its source input.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A toe's foot-axis skin source and its declared fold onto the forefoot.
   * @evidence contracts/development/design.md#principled-representation `definition`: Same final fixed-chart original consumed by production and selected readers. `toe`: Fixed observation-plane input, distinct from a finger's bone-normal walk. `fold`: The source attachment's fold declaration; final realization remains separate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanBodyLane.branches, AutoMovieHumanBodyLane.baseOf.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `definition`, `toe`, `fold`; callers supply the complete record.
   */
  export interface IToe {
    /** Same final fixed-chart original consumed by production and selected readers. */
    definition: IAutoMovieHumanSourceDefinition;
    /** Fixed observation-plane input, distinct from a finger's bone-normal walk. */
    toe: IAutoMovieHumanToePart.IInput;

    /** The source attachment's fold declaration; final realization remains separate. */
    fold: IFold;
  }

  /** What the lane is built from.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the lane is built from.
   * @evidence contracts/development/design.md#principled-representation `diagnostics`: Earlier anatomical source failures, retained verbatim before any tree or join operation. `trunk`: The trunk's build. `preparedTrunk`: Same already prepared trunk/tape-pass result, when an original reader evaluated it first.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyLaneInterim.of, AutoMovieHumanBodyLaw.bodyInput, AutoMovieHumanBodyPreparation.bodyInput. Read by AutoMovieHumanBodyLane.create, AutoMovieHumanBodyLane.define. Also types AutoMovieHumanBodyPreparation.input.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `diagnostics`: Earlier anatomical source failures, retained verbatim before any tree or join operation. `preparedTrunk`: Same already prepared trunk/tape-pass result, when an original reader evaluated it first. `preparedSources`: Actually requested raw originals from this same preparation context. `head`: The head's subtree and its fold onto the trunk (`AutoMovieHumanHeadLane`); absent, no head.
   */
  export interface IInput {
    /** Earlier anatomical source failures, retained verbatim before any tree or join operation. */
    diagnostics?: readonly IAutoMovieLoftContract.IDiagnostic[];

    /** The trunk's build. */
    trunk: IAutoMovieHumanTrunkBuild.IInput;
    /** Same already prepared trunk/tape-pass result, when an original reader evaluated it first. */
    preparedTrunk?: IAutoMovieHumanTrunkBuild.IOutput;
    /** Actually requested raw originals from this same preparation context. */
    preparedSources?: ReadonlyMap<string, IAutoMovieHumanSourceRealization>;

    /** Both sides. */
    sides: Record<"left" | "right", ISide>;

    /** Widest spacing between layers of the limbs, mm. */
    gap: number;

    /** The head's subtree and its fold onto the trunk (`AutoMovieHumanHeadLane`); absent, no head. */
    head?: IAutoMovieHumanHeadLane.IOutput;
  }

  /** The assembled subtree.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The assembled subtree.
   * @evidence contracts/development/design.md#principled-representation `chains`: Every part's chain and every blend's. `bodies`: The realized body of trimmed faces, every face a chain of `chains`. `diagnostics`: Every broken premise.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyLane.create, AutoMovieHumanBodyLane.realize, AutoMovieHumanBodyPublication.of. Also types AutoMovieHumanBodyLaw.lane.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `chains`, `bodies`, `diagnostics`; callers supply the complete record.
   */
  export interface IOutput {
    /** Every part's chain and every blend's. */
    chains: IAutoMovieLoftChain[];

    /** The realized body of trimmed faces, every face a chain of `chains`. */
    bodies: IAutoMovieSolidBody.IPublished[];

    /** Every broken premise. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
  }

  /** The actual production tree and source diagnostics, before any solid realization.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The actual production tree and source diagnostics, before any solid realization.
   * @evidence contracts/development/design.md#principled-representation `sourceParts`: Actual immutable millimetre originals resolved by source leaves during this realization. `handAttachments`: Actual consumed hand contact records, retaining the same parent original and anatomical joint separately. `root`: The assembled production tree; null when its trunk definition failed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyLane.define. Read by AutoMovieHumanBodyLane.realize. Also types AutoMovieHumanBodyLaw.lane.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `sourceParts`, `handAttachments`, `root`, `limits`, `diagnostics`, `sources`; callers supply the complete record.
   */
  export interface IDefinition {
    /** Actual immutable millimetre originals resolved by source leaves during this realization. */
    sourceParts: ReadonlyMap<string, IAutoMovieViewPart>;
    /** Actual consumed hand contact records, retaining the same parent original and anatomical joint separately. */
    handAttachments: IAutoMovieHumanHandAttachment.IConnection[];
    /** The assembled production tree; null when its trunk definition failed. */
    root: IAutoMovieConstructionNode | null;
    /** The exact limits the production realization consumes. */
    limits: IAutoMovieHumanBodyTree.ILimits;
    /** Source-builder and tree-assembly premises; final join diagnostics do not exist yet. */
    diagnostics: IAutoMovieLoftContract.IDiagnostic[];
    /** Actual named builder results, including null admissions and views absent from the final tree. */
    sources: IAutoMovieHumanNamedSource[];
  }
}
