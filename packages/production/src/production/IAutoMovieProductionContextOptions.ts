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
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Keeps root, production selection and the compile's evidence dependencies explicit in one context input.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Supplies the host's resident root and exact source/evidence composition without making another authored state store.
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

  /** Fresh reader of that declaration at every currentness boundary. */
  currentAuthoringEvidence?: () => IAutoMovieProductionEvidence;
}
