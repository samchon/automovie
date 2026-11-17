import type { IAutoMovieLoftChain } from "../../construction/IAutoMovieLoftChain";
import type { IAutoMovieLoftContract } from "../../construction/IAutoMovieLoftContract";
import type { IAutoMovieViewPart } from "../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanParameters } from "../IAutoMovieHumanParameters";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodyFrame } from "./IAutoMovieHumanBodyFrame";
import type { IAutoMovieHumanBodyLane } from "./IAutoMovieHumanBodyLane";
import type { IAutoMovieHumanBodyLaw } from "./IAutoMovieHumanBodyLaw";
import type { IAutoMovieHumanHeadInputs } from "./IAutoMovieHumanHeadInputs";
import type { IAutoMovieHumanLimbRest } from "./IAutoMovieHumanLimbRest";
import type { IAutoMovieHumanLimbSources } from "./IAutoMovieHumanLimbSources";
import type { IAutoMovieHumanNeckBoundary } from "./IAutoMovieHumanNeckBoundary";
import type { IAutoMovieHumanNeckSource } from "./IAutoMovieHumanNeckSource";
import type { IAutoMovieHumanSkeletonLaw } from "./IAutoMovieHumanSkeletonLaw";
import type { IAutoMovieHumanTrunkConstruction } from "./IAutoMovieHumanTrunkConstruction";
import type { IAutoMovieHumanTrunkInputs } from "./IAutoMovieHumanTrunkInputs";
import type { IAutoMovieHumanTrunkSolution } from "./IAutoMovieHumanTrunkSolution";
import type { IAutoMovieHumanHeadLane } from "./head/IAutoMovieHumanHeadLane";
import type { IAutoMovieHumanHeadPlacement } from "./head/IAutoMovieHumanHeadPlacement";
import type { IAutoMovieHumanSourceRealization } from "./limb/IAutoMovieHumanSourceRealization";
import type { IAutoMovieHumanTrunkBuild } from "./trunk/IAutoMovieHumanTrunkBuild";

/**
 * Invocation-owned source factories, explicit raw requests and observed preparation state. Runtime construction and admission remain with AutoMovieHumanBodySources in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes invocation-owned source factories, explicit raw requests and observed preparation state; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Invocation-owned source factories, explicit raw requests and observed preparation state. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanBodySources; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing BodySources contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanBodySources {
  /** Common direct boundary and explicit source factories, before tree assembly or any raw request.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Common direct boundary and explicit source factories, before tree assembly or any raw request.
   * @evidence contracts/development/design.md#principled-representation `stature`: Shared source stature in calibration mm, without acquiring a head source. `frame`: Same aggregate skin-based placement convention directly consumed by S00 and the head inputs. `diagnostics`: Only actually requested common/placement/raw findings; missing stages are not passed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodySources.create. Also types AutoMovieHumanBodySources.milliseconds, AutoMovieHumanBodySources.common.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `production`: Explicitly completed production metadata, retained in this same invocation without copying its source memo fields. `body`: Source factories and their selected completed results, owned by this same invocation. `trunk`: Original tape-pass result; no raw result is implied. `preparingTrunk`: An unfinished coupled source is not publishable as a parent. `rawSources`: Only explicitly requested raw results.
   */
  export interface IOriginal extends IInput {
    /**
     * Explicit common neck scalar/section/frame request; no metadata read invokes its constraints.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Explicit common neck scalar/section/frame request; no metadata read invokes its constraints.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This common signature specifies the documented callback contract without an implementation body; AutoMovieHumanBodySources and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes common at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanBodySources.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual common provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanBodySources determines the work per common call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanBodySources's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the common provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    common(): ICommon;

    /** Shared source stature in calibration mm, without acquiring a head source. */
    readonly stature: number;

    /** Same aggregate skin-based placement convention directly consumed by S00 and the head inputs. */
    readonly frame: IAutoMovieHumanBodyFrame.IOutput;

    /**
     * Independent numerical limb rest; no whole bind or trunk source is published.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Independent numerical limb rest; no whole bind or trunk source is published.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This limbRest signature specifies the documented callback contract without an implementation body; AutoMovieHumanBodySources and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes limbRest at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanBodySources.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual limbRest provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanBodySources determines the work per limbRest call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanBodySources's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the limbRest provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    limbRest(): IAutoMovieHumanLimbRest.IOutput;

    /**
     * Same selected factories later consumed by full production.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Same selected factories later consumed by full production.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This limbSources signature specifies the documented callback contract without an implementation body; AutoMovieHumanBodySources and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes limbSources at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanBodySources.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual limbSources provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanBodySources determines the work per limbSources call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanBodySources's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the limbSources provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    limbSources(): IAutoMovieHumanLimbSources.IOutput;

    /** Only actually requested common/placement/raw findings; missing stages are not passed. */
    readonly diagnostics: IAutoMovieLoftContract.IDiagnostic[];

    /** Inclusive factory intervals, ms; a first request may include common/other factories, so these values must not be summed. Null is unrequested. The actual outer source call owns total required 2D cost. */
    readonly milliseconds: Record<
      | "common"
      | "neckBoundary"
      | "headSource"
      | "trunkConstraints"
      | "bodyAnatomy"
      | "neckRaw",
      number | null
    >;

    /**
     * Explicit actual cut/seat request from the common scalar family; a head or S00 original never pays this unrelated legacy receiver implicitly.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Explicit actual cut/seat request from the common scalar family; a head or S00 original never pays this unrelated legacy receiver implicitly.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This neckBoundary signature specifies the documented callback contract without an implementation body; AutoMovieHumanBodySources and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes neckBoundary at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanBodySources.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual neckBoundary provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanBodySources determines the work per neckBoundary call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanBodySources's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the neckBoundary provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    neckBoundary(): IAutoMovieHumanNeckBoundary.IOutput;

    /**
     * Explicit head-original request, using the same preceding neck controls as production.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Explicit head-original request, using the same preceding neck controls as production.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This headSource signature specifies the documented callback contract without an implementation body; AutoMovieHumanBodySources and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes headSource at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanBodySources.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual headSource provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanBodySources determines the work per headSource call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanBodySources's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the headSource provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    headSource(): IAutoMovieHumanHeadLane.IPrepared;

    /**
     * Explicit common legacy trunk constraints, without a raw neck or full head prerequisite.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Explicit common legacy trunk constraints, without a raw neck or full head prerequisite.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This trunkSolution signature specifies the documented callback contract without an implementation body; AutoMovieHumanBodySources and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes trunkSolution at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanBodySources.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual trunkSolution provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanBodySources determines the work per trunkSolution call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanBodySources's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the trunkSolution provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    trunkSolution(): IAutoMovieHumanTrunkSolution;

    /**
     * Body-owned bone/rest/hand descriptors from shared datum and public inputs, without head/eye construction.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Body-owned bone/rest/hand descriptors from shared datum and public inputs, without head/eye construction.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This bodyAnatomy signature specifies the documented callback contract without an implementation body; AutoMovieHumanBodySources and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes bodyAnatomy at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanBodySources.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual bodyAnatomy provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanBodySources determines the work per bodyAnatomy call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanBodySources's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the bodyAnatomy provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    bodyAnatomy(): IAutoMovieHumanSkeletonLaw.IOutput;

    /**
     * Explicit actual legacy raw request; metadata and property reads never invoke it.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Explicit actual legacy raw request; metadata and property reads never invoke it.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This neckRaw signature specifies the documented callback contract without an implementation body; AutoMovieHumanBodySources and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes neckRaw at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanBodySources.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual neckRaw provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanBodySources determines the work per neckRaw call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanBodySources's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the neckRaw provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    neckRaw(): IAutoMovieLoftChain;

    /** Explicitly completed production metadata, retained in this same invocation without copying its source memo fields. */
    production?: {
      /** Actual requested head source, never a nominal stand-in. */
      head: IAutoMovieHumanHeadLane.IPrepared;

      /** Full bind skeleton, including its actual head/eye bones. */
      anatomy: IAutoMovieHumanSkeletonLaw.IOutput;

      /** Actual placement metadata; its chain list stays empty until raw is requested. */
      standing: IAutoMovieHumanBodyCalibration;

      /** Identical solved trunk and placement metadata. */
      trunkPlacement: IAutoMovieHumanTrunkConstruction.IPlacement;
    };

    /** Source factories and their selected completed results, owned by this same invocation. */
    body?: IAutoMovieHumanBodyLane.IInput;

    /** Original tape-pass result; no raw result is implied. */
    trunk?: IAutoMovieHumanTrunkBuild.IOutput;

    /** An unfinished coupled source is not publishable as a parent. */
    preparingTrunk?: boolean;

    /** Only explicitly requested raw results. */
    rawSources?: Map<string, IAutoMovieHumanSourceRealization>;
  }

  /** Already resolved production inputs; their calibration units are unchanged.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Already resolved production inputs; their calibration units are unchanged.
   * @evidence contracts/development/design.md#principled-representation `params`: Borrowed immutable public inputs. `limbs`: Identical resolved calibration-mm limb inputs. `headInputs`: Canonical head inputs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanBodySources.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `completeLeg`: Explicit genuine coupled-parent request supplied by the production owner.
   */
  export interface IInput {
    /** Borrowed immutable public inputs. */
    params: IAutoMovieHumanParameters;

    /** Identical resolved calibration-mm limb inputs. */
    limbs: IAutoMovieHumanBodyLaw.ILimbInputs;

    /** Canonical head inputs. */
    headInputs: IAutoMovieHumanHeadInputs;

    /** Existing trunk construction inputs in calibration mm. */
    trunkInputs: IAutoMovieHumanTrunkInputs;

    /**
     * Explicit genuine coupled-parent request supplied by the production owner.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Explicit genuine coupled-parent request supplied by the production owner.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This completeLeg signature specifies the documented callback contract without an implementation body; AutoMovieHumanBodySources and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes completeLeg at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanBodySources.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual completeLeg provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanBodySources determines the work per completeLeg call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanBodySources's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the completeLeg provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    completeLeg?: () => void;
  }

  /** Actual common neck definitions, requested before either adjoining part consumes them.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual common neck definitions, requested before either adjoining part consumes them.
   * @evidence contracts/development/design.md#principled-representation `neckSource`: Registered numerical neck inputs, before head curves or parts. `upperSupport`: Direct original centre/plane support for the legacy upper trunk scalar, without a head mass. `pose`: The identical placed numerical layout consumed by the head and body joints.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanBodySources.shared, AutoMovieHumanBodySources.upperSupport.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `neckSource`, `upperSupport`, `pose`; callers supply the complete record.
   */
  export interface ICommon extends IAutoMovieHumanHeadPlacement.IShared {
    /** Registered numerical neck inputs, before head curves or parts. */
    readonly neckSource: IAutoMovieHumanNeckSource.IOutput;

    /** Direct original centre/plane support for the legacy upper trunk scalar, without a head mass. */
    readonly upperSupport:
      | {
          /** Geometric part with its original axis and section laws; its declared source frame and units apply. */
          part: Pick<IAutoMovieViewPart, "axis" | "stations">;
          /** Head crown in the shared registered frame, millimetres, used to place upper trunk support. */
          crown: AutoMovieVector3Tuple;
        }
      | undefined;

    /** The identical placed numerical layout consumed by the head and body joints. */
    readonly pose: IAutoMovieHumanHeadPlacement.IOutput;
  }
}
