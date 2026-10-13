import type {
  IAutoMovieCut,
  IAutoMovieStagedSet,
} from "@automovie/engine";
import type {
  IAutoMovieBlocking,
  IAutoMovieModel,
  IAutoMovieMotion,
  IAutoMoviePerformance,
  IAutoMovieScript,
  IAutoMovieShot,
  IAutoMovieSkeleton,
  IAutoMovieStage,
} from "@automovie/interface";

/**
 * Type of the pursuit example's pure compilation boundary, consumed by its film page and portable owning test. Index-paired inputs produce successful stage/cut records and plain rig/motion data; returned compilation is not a completed render or a clinical/visual verdict. Fixed content actors, context and editing policy belong to compilePursuitFilm.
 *
 * @evidence contracts/common.md#principled-implementation The function type connects typed authored rung inputs to stage/cut success variants and the example's actual model/motion registry; refusal is an exception rather than a partial playable result.
 * @evidence contracts/common.md#clear-and-simple-design One merged identity groups input, rig and output contracts beside the consumed compilation callback without declaring another runtime host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not establish arbitrary-cast support, model health or completed display, and the example owner's fixed context/editing limitations remain outside structural success.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies actual consumers, index pairing, plain data and separation from rendering/clinical judgment.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This alias implements no stage, synthesis or cut algorithm; its concrete producer owns all costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The signature supplies no compilation cache or cross-input equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The alias acquires no resource; returned data and actual page/viewer lifetimes belong to their implementations.
 *
 * @author Samchon
 */
export type ICompilePursuitFilm = (
  props: ICompilePursuitFilm.IProps,
) => ICompilePursuitFilm.IResult;

export namespace ICompilePursuitFilm {
  /**
   * Authored rung inputs for one pursuit compilation. Blocking/performance arrays must have equal lengths and pair by index; the example registry supports its fixed actors rather than discovering arbitrary assets.
   *
   * @evidence contracts/common.md#principled-implementation Existing script/stage/blocking/performance schemas retain their own units and checks; explicit index pairing is enforced before compiler access.
   * @evidence contracts/common.md#clear-and-simple-design Four authored inputs expose the original stage ladder without duplicating engine result or renderer state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Structural input types do not supply missing models or turn fixed actor/context policy into generic cast support.
   * @evidence contracts/common.md#meaningful-documentation The comment defines pairing, fixed-content scope and the original rung roles.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This input interface implements no validation or compilation traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It declares no matching key/cache for authored input combinations.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Input arrays are caller-owned; concrete compilation/result owners decide which records are copied or borrowed.
   *
   * @author Samchon
   */
  export interface IProps {
    /** Cast and beats every later step resolves against. */
    script: IAutoMovieScript;

    /** Actor and set placements staged before any beat is blocked. */
    staging: IAutoMovieStage;

    /** One blocking per performance, matched by index. */
    blockings: IAutoMovieBlocking[];

    /** The performed shots, in edit order. */
    performances: IAutoMoviePerformance[];
  }

  /**
   * Plain skeleton/model pair for one example actor. Separate actors have distinct mutable records while retaining the same stickman compatibility identity; this is not a GPU model instance.
   *
   * @evidence contracts/common.md#principled-implementation Skeleton and model data share the builder's actual rig reference, and per-node registry identity separates actors using the same model reference.
   * @evidence contracts/common.md#clear-and-simple-design Two existing document types suffice for downstream compilation and viewer upload without another actor wrapper.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Distinct actor ownership is not a unique skeleton-name claim, anatomical qualification or completed native upload.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes per-actor records, compatibility names and plain versus GPU data.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The interface performs no primitive or FK work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record shape implements no rig cache or sharing algorithm.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Concrete builder/caller owns documents and borrowed engine constraints; renderer uploads are separate viewer resources.
   *
   * @author Samchon
   */
  export interface IRig {
    /** Skeleton the performance poses. */
    skeleton: IAutoMovieSkeleton;

    /** Model whose parts follow that skeleton. */
    model: IAutoMovieModel;
  }

  /**
   * Successful compilation data the film page lowers and plays. Stage/cut success proves their deterministic gates, while holistic continuity, appearance and physical render completion remain separate judgments.
   *
   * @evidence contracts/common.md#principled-implementation Stage/cut success variants, per-node rig lookup and per-shot motion maps retain the original rung outputs and named registry authority.
   * @evidence contracts/common.md#clear-and-simple-design Data and lookup seams expose exactly what the existing film page needs without constructing a browser/renderer in the compiler.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A playable edit structure is not a certified model/display, and unsupported actor lookup refuses rather than inventing assets.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes deterministic gate success from actual consumer lowering and unverified appearance/continuity.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The interface performs no scene, lookup or timeline algorithm itself.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reuse of staged/model/motion data is implemented by the concrete producer and page, not this schema.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned data/lookup closures belong to the caller and acquire no renderer or task through this type.
   *
   * @author Samchon
   */
  export interface IResult {
    /** Successful staging result shared by every shot. */
    staged: IAutoMovieStagedSet.ISuccess;

    /** Rig by performing node; a set piece has none. */
    rigOf: Record<string, IRig | undefined>;

    /**
     * Borrow a supported performing node's actual rig; absent/inherited names throw rather than inventing a rig.
     *
     * @evidence contracts/common.md#principled-implementation Own node-key membership selects the registered actor, separating real rigs from JavaScript prototype properties.
     * @evidence contracts/common.md#clear-and-simple-design One lookup seam keeps the page's performance-node resolution with the content registry.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown and inherited names cannot substitute a fabricated or prototype rig.
     * @evidence contracts/common.md#meaningful-documentation The member identifies borrowed registered data and named refusal.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The signature implements no registry lookup algorithm.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work It declares no independent rig memoization beyond the supplied owner.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed rig lifetime belongs to the returned compilation/caller, with no resource acquisition in this signature.
     */
    rigFor: (node: string) => IRig;

    /**
     * Borrow a supported staged node's shared block or registered actor model. The node comes from the staged scene; unsupported actor names throw.
     *
     * @evidence contracts/common.md#principled-implementation Block model identity selects shared set content and other nodes resolve by own actor registry key rather than the shared stickman asset name.
     * @evidence contracts/common.md#clear-and-simple-design One model seam serves existing staged-node lowering while placement scale remains in the staged transform.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Staged-node input is a caller premise, arbitrary assets are not loaded and unsupported actors receive no substitute model.
     * @evidence contracts/common.md#meaningful-documentation The member states staged provenance, block-versus-actor selection and borrowing/refusal.
     * @evidenceExclude contracts/performance.md#efficient-algorithms The signature chooses no model traversal or upload algorithm.
     * @evidenceExclude contracts/performance.md#reuse-equivalent-work Registry/model reuse belongs to the concrete compiler owner.
     * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller borrows model data and the page separately owns native uploads; this declaration acquires neither.
     */
    modelForNode: (node: { id: string; model: string }) => IAutoMovieModel;

    /** Performed shots, in performance order. */
    shots: IAutoMovieShot[];

    /** Motions of each shot, keyed by shot id and then by performing node. */
    motionsByShot: Map<string, Record<string, IAutoMovieMotion>>;

    /** Successful edit over every shot. */
    cut: IAutoMovieCut.ISuccess;
  }
}
