import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import type { AutoMovieProductionFrameCapture } from "@automovie/interface";

import type { AutoMovieModelArchetypeRegistry } from "./productionArchetypes";

/**
 * Named host dependencies of one root-fixed production context.
 *
 * The root seed and default namespace select the resident project; capture,
 * archetypes and authoring evidence are the dependencies every service opened
 * there shares. The live evidence reader is paired with the same compile
 * declaration so currentness cannot judge a different owner population.
 * Construction captures these choices once; the callback itself reads fresh
 * evidence whenever a guarded operation requests it.
 *
 * @evidence contracts/common.md#principled-implementation Named optional dependencies describe the same root-fixed services the positional constructor supports; the live evidence callback belongs to the captured authoring declaration rather than a separately chosen owner population.
 * @evidence contracts/common.md#clear-and-simple-design One options record supplies root, namespace and shared host instruments to the context, which performs admission and constructs services once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted dependencies retain the context's supported defaults; root and namespace ambiguity still reach their admission gates instead of being repaired by this type.
 * @evidence contracts/common.md#meaningful-documentation States each dependency's owner, capture lifetime, namespace role, and when the live evidence reader is consulted.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The options type executes no setup; resolution and service construction own that cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Capture, archetypes and authoring dependencies are shared by services in one context; the callback reads current evidence at guarded boundaries rather than reusing a stale result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The context retains these host-owned references for its lifetime; the type transfers no disposal obligation and owns no process or handle.
 * @author Samchon
 */
export interface IAutoMovieProductionContextOptions {
  /** Actual-pixel instrument shared by the opened services, when supplied. */
  capture?: AutoMovieProductionFrameCapture;

  /** Host-owned path at or below the selected project root. */
  projectRoot?: string;

  /** Explicit default namespace; ambiguous registration is still refused. */
  productionId?: string;

  /** Catalogue every production opened here is judged against. */
  archetypes?: AutoMovieModelArchetypeRegistry;

  /** Exact graph-derived declaration used by the compile. */
  authoringEvidence?: IAutoMovieProductionEvidence;

  /**
   * Fresh reader of that declaration at every currentness boundary.
   *
   * @evidence contracts/common.md#principled-implementation A callback supplies the current authoring graph rather than freezing evidence from context construction; the host pairs it with the captured declaration's owner population.
   * @evidence contracts/common.md#clear-and-simple-design The context shares one host-provided reader with guarded services while the evidence package owns graph acquisition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No cached context-time evidence stands in for this fresh reader; guarded operations propagate its admission failures through their own refusal paths.
   * @evidence contracts/common.md#meaningful-documentation States that the reader belongs to the captured declaration and runs at currentness boundaries rather than only during setup.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callable type chooses no reading algorithm; the host owns acquisition cost and the status owner owns how often it is required.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The reader promises current observation; retained-status equivalence may reuse gate execution only after it observes current dependencies.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The context retains the host callback for its lifetime; callback-owned handles and byte storage remain the host's responsibility and this type transfers no disposal obligation.
   */
  currentAuthoringEvidence?: () => IAutoMovieProductionEvidence;
}
