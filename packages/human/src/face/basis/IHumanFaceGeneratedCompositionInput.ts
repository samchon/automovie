import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";

import type { IHumanConstructionCheck } from "../../common/basis/IHumanConstructionCheck";
import type { IHumanFaceBrowAssembly } from "../anatomy/brow/IHumanFaceBrowAssembly";
import type { IHumanFaceLashRow } from "../anatomy/lash/structures/IHumanFaceLashRow";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IHumanFaceMaterialAttachment } from "../structures/IHumanFaceMaterialAttachment";
import type { IHumanFacePoseResult } from "./IHumanFacePoseResult";

/** One owned model composition with exact geometry stages and the current finish lookup.
 *
 * @evidence contracts/common.md#principled-implementation The current owned model, exact pose and requested finish populations compose generated parts while extending the same material/admission/attachment populations consumed downstream.
 * @evidence contracts/common.md#clear-and-simple-design One input joins composition dependencies; source posing, finish factories, occlusion and success publication keep their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the current build's model is mutable; earlier admitted models cannot enter, and generated identity collisions refuse rather than silently replacing unrelated resident parts.
 * @evidence contracts/common.md#meaningful-documentation Members state current-build ownership, deliberate empty lashes, replaced brow incidence and same-build material/physical attachment lookup.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The input performs no composition; createHumanFaceGeneratedComposition and finish factories own scans/allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; the composition owner lazily retains equivalent source painting factories.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; owned build arrays/maps and added condition closures live with that build.
 *
 * @author Samchon
 */
export interface IHumanFaceGeneratedCompositionInput {
  /** Model-owned admission tasks; composition adds checks without changing geometry. */
  checks: IHumanConstructionCheck[];

  /** Current admitted numerical geometry and finish requests for this owned build. */
  document: IAutoMovieHumanFaceBasisDocument;

  /** Exact retained source/generated geometry used by the same contact stage. */
  pose: IHumanFacePoseResult;

  /** Actual requested shaft rows, including deliberate empty populations. */
  lashes?: readonly IHumanFaceLashRow[];

  /** Generated brow parts and exact resident card incidence they replace. */
  brows?: IHumanFaceBrowAssembly;

  /** The current build's owned resident model; no previous admitted model enters. */
  model: IAutoMovieModel;

  /** Extended together with model materials for the same build's AO publication. */
  materialMap: Map<string, IAutoMovieMaterial>;

  /** Same build's exact material-point attachments for downstream Person placement. */
  materialAttachments: Map<string, ReadonlyMap<number, IHumanFaceMaterialAttachment>>;
}
