import { AutoMovieDiagnosticCode, IAutoMovieAssetProvenance, IAutoMovieDiagnostic, IAutoMovieExternalMotionConversionReceipt } from "@automovie/interface";
import { inspectAutoMovieExternalModelBytes } from "@automovie/ingest";
import { type IAutoMovieProductionContentInput } from "../IAutoMovieProductionContentInput";
import { IAutoMovieExternalModelRuntimeBinding } from "../materializeProduction";
import { AutoMovieModelArchetypeRegistry } from "../productionArchetypes";
import { IAutoMovieProductionDesignGraph } from "../validateProductionDesign";

/**
 * Call-local admitted ledger and mutable inspection accounting shared by the original sequential asset phases.
 *
 * @evidence contracts/common.md#principled-implementation One context joins the filtered records/current content, path/consumer accounting, successful inspection closures and ordered diagnostic sinks built by productionAssetInventory.
 * @evidence contracts/common.md#clear-and-simple-design It exists solely to preserve the same state across extracted phases; no public root API, service, cache or independent lifecycle is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Context metadata and generated proxies do not authenticate bytes or prove mesh enclosure. Its maps can contain partial results alongside errors, and later compilation must respect those errors.
 * @evidence contracts/common.md#meaningful-documentation Field comments identify borrowed graph/registry/bytes, each mutable phase result and error versus warning sinks.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface erases; full parsing, searching, ingest, joining and copying costs remain with inventory and its actual phases.
 * @evidence contracts/performance.md#reuse-equivalent-work Inspection/closure maps share successful same-invocation facts; later observations require a new context over current inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The inventory owns call-local Maps/Sets and returns selected populations; graph/registry/input views are borrowed, with growth driven by supplied assets/uses/recipes and no resource manager.
 *
 * @author Samchon
 */
export interface IProductionAssetInventoryContext {
  /** Locally parsed ledger records after credential-bearing entries are removed. */
  records: IAutoMovieAssetProvenance[];

  /** Borrowed current content entries keyed by their exact path. */
  content: Map<string, IAutoMovieProductionContentInput>;

  /** Case-folded path accounting populated by ordered record validation. */
  paths: Map<string, string>;

  /** Latest active exclusive consumer assignment; duplicates are diagnosed before the entry is replaced. */
  activeConsumerAssets: Map<string, string>;

  /** Actual model-owner/resource pairs consumed as LODs or ingest sidecars. */
  consumedModelResources: Set<string>;

  /** Actual motion-owner/resource pairs consumed by ingest. */
  consumedMotionResources: Set<string>;

  /** Successful byte-grounded motion inspections reused for later adoption. */
  motionInspections: Map<string, ReturnType<typeof inspectAutoMovieExternalModelBytes>>;

  /** Sorted sidecar byte identities retained with each successful motion source. */
  motionClosures: Map<string, IAutoMovieExternalMotionConversionReceipt["source"]["closure"]>;

  /** Locally usable model profile/closure/proxy facts before recipe joining. */
  externalByAsset: Map<string, Omit<IAutoMovieExternalModelRuntimeBinding, "asset" | "lod">>;

  /** Ordered findings; partial successful maps do not override its error entries. */
  diagnostics: IAutoMovieDiagnostic[];

  /**
   * Append one inventory-owned error at the declared manifest path.
   *
   * @evidence contracts/common.md#principled-implementation The sole context producer binds this sink to diagnostics.push with category error, project phase and the already-defined manifest path; callers supply exact code/target/message.
   * @evidence contracts/common.md#clear-and-simple-design Extracted phases share the same ordered error sink instead of duplicating diagnostic presentation or suppressing failures.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Appending does not repair bytes, roll back prior observations or turn a partial population into a successful build.
   * @evidence contracts/common.md#meaningful-documentation States category/path ownership, append ordering and unchanged caller diagnostic text.
   * @evidence contracts/performance.md#efficient-algorithms The actual bound sink allocates one fixed-field record and appends it with amortized constant array work; supplied strings remain retained at their actual sizes.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct observations remain distinct ordered diagnostics rather than cached or deduplicated successful answers.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The inventory retains appended records until its result/caller release, with finding-driven unbounded growth and no acquired handle or task.
   */
  diagnostic: (code: AutoMovieDiagnosticCode, target: string, message: string) => void;

  /**
   * Append inventory advice that does not invalidate otherwise usable model facts.
   *
   * @evidence contracts/common.md#principled-implementation The producer binds this sink to category warning under the same manifest/project address; model admission separately checks actual error entries rather than total diagnostic count.
   * @evidence contracts/common.md#clear-and-simple-design Advisory material differences remain visible through the same ordered finding list while error admission stays in its model phase.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A warning supplies neither loss authorization nor proof of visual equivalence, and it cannot hide a later proxy/resource error.
   * @evidence contracts/common.md#meaningful-documentation Defines advisory effect, exact diagnostic text/address ownership and separate error-gate obligation.
   * @evidence contracts/performance.md#efficient-algorithms One fixed-field record is appended with amortized constant array work; memory includes the supplied message/identity text and array growth.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each actual advisory observation is retained without a cache keyed only by code or asset path.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Advice remains with the returned diagnostics until caller release, without a numeric finding cap or external resource acquired by the sink.
   */
  warning: (code: AutoMovieDiagnosticCode, target: string, message: string) => void;

  /** Borrowed current design graph used for consumer and recipe/adoption lookup. */
  graph: IAutoMovieProductionDesignGraph;

  /** Borrowed registered strategies; bone requirements remain their schema data. */
  archetypes: AutoMovieModelArchetypeRegistry;

  /** Exact active production identity used to select uses and adoptions. */
  productionId: string;

  /** Defined ledger path retained by every bound error/advice sink. */
  manifestPath: string;
}
