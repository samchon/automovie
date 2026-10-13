import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanPersonBoundaryReading } from "./IAutoMovieHumanPersonBoundaryReading";

/**
 * Registered generation output in common posed metre Y-up/+Z-forward coordinates. Face:/body: parts/materials share canonical source boundary positions and one source normal field where emitted. Generation assembly uses existing complementary cells without legacy cut/collar/stitch/fair stages. Actual resident validation executes in the producer; this carrier supplies no global embeddedness, clinical proportion or current visual guarantee.
 *
 * Without registered layers, body retains its independent derived-document evaluation; with layers, its skin/garment/layers use the final formed body exterior. SourceSkinModel, when present, retains joined parts before fabric material partition/lift in the same final placed frame, including actual other emitted parts. Ordinary runtime packing/export reads model. Boundary scalars instead report requested pre-pose source fields, not final posed adjacent-ring clearance bounds.
 *
 * @evidence contracts/common.md#principled-implementation Actual registered source cells/rig and shared normal field produce distinct final person, source observation and body evaluation outputs without legacy seam fitting.
 * @evidence contracts/common.md#clear-and-simple-design Canonical model/body/bone/boundary records separate final emission, optional source observation and rig/source-field receipts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts SourceSkinModel is not called a separately authored asset or legacy neck-stitch result, and shared field metadata does not establish global/clinical or current GPU acceptance.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre frame, namespace prefixes, layer-dependent body output, pre-fabric source observation and pre-pose boundary scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This output schema executes no shared skin/normal, layer or resident validation work; the registered builder owns those algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Runtime/source observation reuse of one result is consumer behavior rather than a cache implemented by this carrier.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring model references acquires no renderer or source task; actual build/caller owners control final/source/body buffer lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonGenerationBuild {
  /** The posed person, validated as a resident model. */
  model: IAutoMovieModel;

  /**
   * Same joined parts before garment material partition/lift, retaining actual final placed frame and source correspondence without a legacy neck-stitch stage. When omitted, consumers use model's source-region population under its owner contract; ordinary runtime output remains model.
   */
  sourceSkinModel?: IAutoMovieModel;

  /** Independent body evaluation without layers; final formed skin, garment and layers when registered. */
  body: IAutoMovieHumanBodyBuild;

  /** Rest and posed frames of the body's joints, then the face's jaw and eyes under the head. */
  bones: IAutoMovieHumanBodyBuild["bones"];

  /** What the two partitions asked of the shared boundary. */
  boundary: IAutoMovieHumanPersonBoundaryReading;
}
